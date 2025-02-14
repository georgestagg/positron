/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as positron from 'positron';
import * as path from 'path';
import * as crypto from 'crypto';

import { ExtensionContext } from 'vscode';
import { InlineCompletionList, InlineCompletionTriggerKind, LanguageClient, LanguageClientOptions, NotificationType, ServerOptions, State, StateChangeEvent, TransportKind } from 'vscode-languageclient/node';

const copilotRunningContextKey = 'positron-assistant.copilot.status.running';

export interface CopilotModel {
	id: string;
	modelFamily: string;
	modelName: string;
	preview: boolean;
	scopes: ('chat-panel' | 'inline' | 'completion')[];
}

export interface CopilotContextRequest {
	conversationId: string;
	turnId: string;
	skillId: string;
}

export interface CopilotProgress {
	token: string;
	value: CopilotProgressPart;
}

type CopilotProgressPart =
	| CopilotProgressBeginConversation
	| CopilotProgressReportSteps
	| CopilotProgressReportReply
	| CopilotProgressEndConversation;

type CopilotProgressBeginConversation = {
	conversationId: string;
	kind: 'begin';
	title: string;
	turnId: string;
};

type CopilotProgressEndConversation = {
	conversationId: string;
	error?: {
		message: string;
	};
	kind: 'end';
	turnId: string;
	followUp?: { message: string };
	suggestedTitle?: string;
};

type CopilotProgressReportSteps = {
	conversationId: string;
	kind: 'report';
	steps: {
		id: 'collect-context' | 'generate-response';
		status: 'running' | 'completed';
		title: string;
	}[];
	turnId: string;
};

type CopilotProgressReportReply = {
	conversationId: string;
	kind: 'report';
	reply: string;
	turnId: string;
};

export enum CopilotStatusKind {
	Normal = 'Normal',
	Error = 'Error',
	Warning = 'Warning',
	Inactive = 'Inactive',
}

export interface CopilotStatusMessage {
	message?: string;
	busy: boolean;
	kind: CopilotStatusKind;
}

export class CopilotCoordinator {
	private static singleton: CopilotCoordinator | null;

	copilotClient: LanguageClient;

	private statusBar: vscode.StatusBarItem;
	private didTrySignIn: boolean = false;
	private conversationRegistry: Map<string, (part: CopilotProgressPart) => void> = new Map();
	private followupRegistry: Map<string, Promise<vscode.ChatFollowup>> = new Map();

	public static getInstance(context: ExtensionContext): CopilotCoordinator {
		if (!CopilotCoordinator.singleton) {
			CopilotCoordinator.singleton = new CopilotCoordinator(context);
		}
		return CopilotCoordinator.singleton;
	}

	public static async getFollowup(result: vscode.ChatResult): Promise<vscode.ChatFollowup[]> {
		const id = result.metadata?.requestId;
		if (!id) {
			return [];
		}

		try {
			const followup = await CopilotCoordinator.singleton?.followupRegistry.get(id);
			return [followup!];
		} catch (e) {
			return [];
		}
	}

	private constructor(context: vscode.ExtensionContext) {
		// Path setup for GitHub Copilot language server
		const serverModule = path.join(context.extensionPath, 'node_modules', '@github', 'copilot-language-server', 'dist', 'language-server.js');
		const serverOptions: ServerOptions = {
			run: { module: serverModule, transport: TransportKind.ipc },
			debug: { module: serverModule, transport: TransportKind.ipc },
		};

		// Setup for language client and initialization options
		const clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: '*' }],
			progressOnInitialization: true,

			initializationOptions: {
				editorInfo: {
					name: 'vscode',
					version: `${vscode.version}+positron.${positron.version}`,
				},
				editorPluginInfo: {
					name: 'positron-assistant',
					version: '0.0.1',
				}
			},
		};

		this.copilotClient = new LanguageClient(
			'copilotLanguageServer',
			'Copilot Language Server',
			serverOptions,
			clientOptions,
		);

		// Register commands and LSP listeners
		this.registerCommands(context);
		this.registerStateListeners(context);
		this.registerResponseStreamHandler(context);
		this.registerContextProviders(context);

		// Enable status bar
		this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		this.statusBar.text = 'GitHub Copilot: Starting';
		this.statusBar.command = {
			title: 'Show Copilot Status Menu',
			command: 'workbench.action.quickOpen',
			arguments: [
				'>Positron Assistant: GitHub Copilot'
			]
		};
		this.statusBar.show();

		// Start Language client
		this.copilotClient.start();

		// Cleanup
		context.subscriptions.push(
			new vscode.Disposable(() => {
				this.copilotClient.stop();
				this.statusBar.dispose();
				this.conversationRegistry.clear();
				this.followupRegistry.clear();
			})
		);
	}

	async registerResponseStreamHandler(context: ExtensionContext) {
		context.subscriptions.push(
			this.copilotClient.onNotification('$/progress', (progress: CopilotProgress) => {
				const id = progress.token;
				if (id && this.conversationRegistry.has(id)) {
					const push = this.conversationRegistry.get(id)!;
					push(progress.value);
				}
			})
		);
	}

	async registerStateListeners(context: ExtensionContext) {
		context.subscriptions.push(
			this.copilotClient.onDidChangeState((event) => this.onDidChangeState(event))
		);

		context.subscriptions.push(
			this.copilotClient.onNotification('didChangeStatus', (...args) => {
				const message = args[0] as CopilotStatusMessage;
				this.onDidChangeStatus(message);
			})
		);
	}

	async registerContextProviders(context: ExtensionContext) {
		// Listen for and respond to `current-editor` "skill"/context provider requests
		context.subscriptions.push(
			this.copilotClient.onRequest('conversation/context', async (
				params: CopilotContextRequest,
				token: vscode.CancellationToken
			) => {
				switch (params.skillId) {
					case 'current-editor': {
						const editor = vscode.window.activeTextEditor;
						const visibleRange = editor?.visibleRanges[0];
						const selection = editor?.selection;
						return [{
							uri: editor?.document.uri.toString(),
							visibleRange: {
								start: visibleRange?.start,
								end: visibleRange?.end,
							},
							selection: {
								start: selection?.start,
								end: selection?.end,
							},
						}, null];
					}
					default:
						throw new Error(`Unknown skill ID: ${params.skillId}`);
				}
			})
		);
	}

	async registerCommands(context: ExtensionContext) {
		// Login flow
		context.subscriptions.push(
			vscode.commands.registerCommand('positron-assistant.copilot.signin', async () => {
				await this.copilotSignIn();
			})
		);

		// Sign out
		context.subscriptions.push(
			vscode.commands.registerCommand('positron-assistant.copilot.signout', async () => {
				this.copilotSignOut();
			})
		);
	}

	onDidChangeState(event: StateChangeEvent) {
		vscode.commands.executeCommand('setContext', copilotRunningContextKey, event.newState === State.Running);
	}

	onDidChangeStatus(message: CopilotStatusMessage) {
		if (message.busy) {
			this.statusBar.text = 'GitHub Copilot: Busy';
		} else if (message.message) {
			this.statusBar.text = `GitHub Copilot: ${message.kind}`;
			this.statusBar.tooltip = message.message;
		} else if (message.kind === CopilotStatusKind.Normal) {
			this.statusBar.text = 'GitHub Copilot';
		} else {
			this.statusBar.text = `GitHub Copilot: ${message.kind}`;
		}

		// If there's an error, try signing in to GitHub
		this.copilotSignIn();

	}

	async copilotSignOut() {
		this.copilotClient.sendRequest('signOut', {});
	}

	async copilotSignIn() {
		// TODO: We should have a better way to limit the number of times we try to sign in
		if (this.didTrySignIn) {
			return;
		}
		this.didTrySignIn = true;

		const req = await this.copilotClient.sendRequest('signIn', {}) as {
			command: { command: string; arguments: unknown[] };
			userCode: string;
		} | {
			status: 'AlreadySignedIn';
			user: string;
		};

		if ('status' in req && 'user' in req) {
			return;
		}

		await vscode.env.clipboard.writeText(req.userCode);
		const shouldLogin = await positron.methods.showQuestion(
			'GitHub Copilot Sign In',
			`You will need this code to sign in: <code>${req.userCode}</code>. It has been copied to your clipboard.`,
			'OK',
			'Cancel');

		if (shouldLogin) {
			this.statusBar.text = 'GitHub Copilot: Sign In';
			await this.copilotClient.sendRequest('workspace/executeCommand', {
				command: req.command.command,
				arguments: req.command.arguments
			});
		}
	}

	async provideInlineCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		context: vscode.InlineCompletionContext,
		token: vscode.CancellationToken
	): Promise<vscode.InlineCompletionList> {
		const request = this.copilotClient.code2ProtocolConverter.asInlineCompletionParams(document, position, context);

		// TODO: Why doesn't the copilot LSP like the triggerKind from asInlineCompletionParams when
		// we invoke manually? Let's just always set it to automatic for now.
		request.context.triggerKind = InlineCompletionTriggerKind.Automatic;

		const result = await this.copilotClient.sendRequest('textDocument/inlineCompletion', request) as InlineCompletionList;
		return this.copilotClient.protocol2CodeConverter.asInlineCompletionResult(result, token);
	}

	async provideLanguageModelResponse(
		model: string,
		messages: vscode.LanguageModelChatMessage[],
		options: vscode.LanguageModelChatRequestOptions,
		extensionId: string,
		progress: vscode.Progress<vscode.ChatResponseFragment2>,
		token: vscode.CancellationToken
	) {

		/*
		EXPERIMENTATION
		await this.copilotClient.sendRequest('context/registerProviders', {
			providers: [
				{
					id: 'testing-provider',
					selector: ['*'],
				}
			],
		}).then((...args) => console.log(args));

		await this.copilotClient.sendRequest('conversation/templates', {})
			.then((...args) => console.log(args));
		*/

		const workDoneToken = options.modelOptions?.requestId ?? crypto.randomUUID();

		const turns: { request: string; response?: string }[] = [];
		messages.forEach((message) => {
			if (message.role === vscode.LanguageModelChatMessageRole.User) {
				turns.push({
					request: message.content.reduce((acc, part) => {
						if (part instanceof vscode.LanguageModelTextPart) {
							acc += part.value;
						}
						return acc;
					}, '')
				});
			} else if (message.role === vscode.LanguageModelChatMessageRole.Assistant) {
				turns.slice(-1)[0].response = message.content.reduce((acc, part) => {
					if (part instanceof vscode.LanguageModelTextPart) {
						acc += part.value;
					}
					return acc;
				}, '');
			}
		});

		// Deferred promise for followup response
		let resolve: (value: vscode.ChatFollowup) => void;
		let reject: (reason?: any) => void;
		const followup = new Promise<vscode.ChatFollowup>((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});

		this.followupRegistry.set(workDoneToken, followup);
		this.conversationRegistry.set(workDoneToken, (part: CopilotProgressPart) => {
			if (part.kind === 'report' && 'steps' in part) {
				part.steps.forEach((step) => {
					if (step.id === 'collect-context' && step.status === 'running') {
						if (options.modelOptions?.toolInvocationToken) {
							positron.ai.responseProgress(
								options.modelOptions?.toolInvocationToken,
								new vscode.ChatResponseProgressPart(step.title)
							);
						}
					}
				});
			} else if (part.kind === 'report' && 'reply' in part) {
				progress.report({
					index: 0,
					part: new vscode.LanguageModelTextPart(part.reply)
				});
			} else if (part.kind === 'end') {
				if (part.error) {
					progress.report({
						index: 0,
						part: new vscode.LanguageModelTextPart(part.error.message)
					});
				}

				if (part.followUp) {
					resolve({ prompt: part.followUp.message });
				} else {
					reject('No follow-up provided.');
				}
			}
		});

		// Send cancellation request when token is cancelled
		const disposable = token.onCancellationRequested(() => {
			this.copilotClient.sendRequest('$/cancelRequest', {});
			disposable.dispose();
		});

		const source = (() => {
			switch (options.modelOptions?.location) {
				case vscode.ChatLocation.Editor:
				case vscode.ChatLocation.Terminal:
				case vscode.ChatLocation.Notebook:
					return 'inline';
				default:
					return 'panel';
			}
		})();

		try {
			await this.copilotClient.sendRequest('conversation/create', {
				model,
				workDoneToken,
				turns,
				capabilities: {
					skills: ['current-editor', 'testing-provider'],
				},
				source,
				computeSuggestions: true,
				references: [],
			});
		} finally {
			this.conversationRegistry.delete(workDoneToken);
		}
	}

	async getModels(): Promise<CopilotModel[]> {
		await this.copilotSignIn();
		const models = await this.copilotClient.sendRequest('copilot/models', {}) as CopilotModel[];
		return models;
	}
}
