/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024-2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as positron from 'positron';
import { getModelConfigurations, showConfigurationDialog } from './config';
import { newLanguageModel } from './models';
import participants from './participants';
import { newCompletionProvider, registerHistoryTracking } from './completion';
import { editsProvider } from './edits';
import { setContext } from './context';
import { registerCommentsProvider } from './comments';

const hasChatModelsContextKey = 'positron-assistant.hasChatModels';

let modelDisposables: vscode.Disposable[] = [];
let participantDisposables: vscode.Disposable[] = [];

function disposeModels() {
	modelDisposables.forEach(d => d.dispose());
	modelDisposables = [];
}

function disposeParticipants() {
	participantDisposables.forEach(d => d.dispose());
	participantDisposables = [];
}

async function registerModels(context: vscode.ExtensionContext) {
	// Dispose of existing models
	disposeModels();

	try {
		const modelConfigs = await getModelConfigurations(context);
		// Register with Language Model API
		modelConfigs.filter(config => config.type === 'chat').forEach((config, idx) => {
			// We need at least one default and one non-default model for the dropdown to appear.
			// For now, just set the first language model as default.
			const isFirst = idx === 0;

			const languageModel = newLanguageModel(config);
			const modelDisp = vscode.lm.registerChatModelProvider(languageModel.identifier, languageModel, {
				name: languageModel.name,
				family: languageModel.provider,
				vendor: context.extension.packageJSON.publisher,
				version: context.extension.packageJSON.version,
				maxInputTokens: 0,
				maxOutputTokens: 0,
				isUserSelectable: true,
				isDefault: isFirst,
			});
			modelDisposables.push(modelDisp);
		});

		// Register with VS Code completions API
		modelConfigs.filter(config => config.type === 'completion').forEach(config => {
			const completionProvider = newCompletionProvider(config);
			const complDisp = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**/*.*' }, completionProvider);
			modelDisposables.push(complDisp);
		});

		// Set context for if we have chat models available for use
		const hasChatModels = modelConfigs.filter(config => config.type === 'chat').length > 0;
		vscode.commands.executeCommand('setContext', hasChatModelsContextKey, hasChatModels);

	} catch (e) {
		const failedMessage = vscode.l10n.t('Positron Assistant: Failed to load model configurations.');
		vscode.window.showErrorMessage(`${failedMessage} ${e}`);
	}
}

function registerParticipants(context: vscode.ExtensionContext) {
	Object.keys(participants).forEach(async (key) => {
		// Register agent with Positron Assistant API
		const disposable = await positron.ai.registerChatAgent(participants[key].agentData);
		context.subscriptions.push(disposable);

		// Register agent implementation with the vscode API
		const participant = vscode.chat.createChatParticipant(participants[key].id, participants[key].requestHandler);
		participant.iconPath = participants[key].iconPath;
		participant.followupProvider = participants[key].followupProvider;
		participant.welcomeMessageProvider = participants[key].welcomeMessageProvider;
	});
}

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('positron-assistant.review', () => {

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				title: 'Reviewing changes...',
				cancellable: true
			}, async (progress, token) => {
				progress.report({ message: 'Reviewing changes...' });

				await new Promise(resolve => setTimeout(resolve, 1000));

				const controller = vscode.comments.createCommentController('comment-sample', 'Comment Sample');
				controller.commentingRangeProvider = {
					provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
						const thread = controller.createCommentThread(document.uri, new vscode.Range(document.lineCount - 2, 0, document.lineCount - 2, 100), [{
							body: new vscode.MarkdownString(`
Here is a random suggestion to add a \`printf\` to the code.

----

<small>Suggested change:</small>

\`\`\`diff
- }
+ printf("Hello, World!\\n");
+ }
\`\`\`

----

`),
							mode: vscode.CommentMode.Preview,
							author: {
								name: 'Positron Assistant',
								iconPath: vscode.Uri.parse(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAABNJREFUCB1jZGBg+A/EDEwgAgQADigBA//q6GsAAAAASUVORK5CYII%3D`),
							},
						}]);
						thread.label = 'Code Review Comment (1 of 1)';
						thread.canReply = false;
						thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
						return null;
					}
				};
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('positron-assistant.addModelConfiguration', () => {
			showConfigurationDialog(context);
		})
	);

}

export function activate(context: vscode.ExtensionContext) {
	// Register chat participants
	registerParticipants(context);

	// Register configured language models
	registerModels(context);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('positron.assistant.models')) {
				registerModels(context);
			}
		})
	);

	// Track opened files for completion context
	registerHistoryTracking(context);

	// Mapped Edits
	context.subscriptions.push(
		vscode.chat.registerMappedEditsProvider({ pattern: '**/*' }, editsProvider)
	);

	// Register extension commands
	registerCommands(context);

	// Register comments provider
	registerCommentsProvider(context);

	// Register context singleton
	setContext(context);

	context.subscriptions.push({
		dispose: () => {
			disposeModels();
			disposeParticipants();
		}
	});
}
