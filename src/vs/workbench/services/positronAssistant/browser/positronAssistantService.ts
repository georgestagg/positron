/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable, Disposable, toDisposable } from 'vs/base/common/lifecycle';
import { IPositronAssistantService, IPositronAssistantProvider } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { ILogService } from 'vs/platform/log/common/log';
import { Emitter } from 'vs/base/common/event';
import { IPositronAssistantChatSession } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantChatSession';
import { PositronAssistantChatSession, PositronAssistantNullChatSession } from 'vs/workbench/services/positronAssistant/browser/positronAssistantChatSession';
import { generateUuid } from 'vs/base/common/uuid';
import { IPositronConsoleService } from 'vs/workbench/services/positronConsole/browser/interfaces/positronConsoleService';
import { IPositronVariablesService } from 'vs/workbench/services/positronVariables/common/interfaces/positronVariablesService';
import { PositronVariablesInstance } from 'vs/workbench/services/positronVariables/common/positronVariablesInstance';

/**
 * PositronAssistantService class.
 */
class PositronAssistantService extends Disposable implements IPositronAssistantService {
	declare readonly _serviceBrand: undefined;

	private readonly _providers = new Map<string, IPositronAssistantProvider>();
	private readonly _chatSessions = new Map<string, IPositronAssistantChatSession>();
	private _selectedAssistant: string | null = null;
	private _selectedChatSessionId: string | null = null;

	// Event emitters
	private readonly _onDidRegisterAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidRegisterAssistant = this._onDidRegisterAssistantEmitter.event;

	private readonly _onDidSelectAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidSelectAssistant = this._onDidSelectAssistantEmitter.event;

	private readonly _onDidSelectChatSession = this._register(new Emitter<IPositronAssistantChatSession>);
	readonly onDidSelectChatSession = this._onDidSelectChatSession.event;

	// Null chat session, used when no chat session has been selected by the front end
	private readonly _nullChatSession = this._register(new PositronAssistantNullChatSession(this));

	constructor(
		@ILogService private readonly _logService: ILogService,
		@IPositronConsoleService private readonly _consoleService: IPositronConsoleService,
		@IPositronVariablesService private readonly _variableService: IPositronVariablesService,
	) {
		super();
	}

	registerAssistant(id: string, provider: IPositronAssistantProvider): IDisposable {
		// Register and signal that the set of assistants has changed.
		this._providers.set(id, provider);
		this._onDidRegisterAssistantEmitter.fire(provider.name);
		this._logService.debug(`Assistant "${provider.name}" with identifier \`${id}\` registered.`);

		// Remove assistant when disposed
		return toDisposable(() => {
			this._logService.debug(`Assistant with identifier ${id} disposed.`);
			this._providers.delete(id);
		});
	}

	selectAssistant(id: string) {
		if (!this._providers.has(id)) {
			throw new Error(`Can't select assistant. Identifier \`${id}\` is not registered."`);
		}
		this._selectedAssistant = id;
		this._onDidSelectAssistantEmitter.fire(id);
	}

	selectChatSession(id: string | null) {
		if (id && !this._chatSessions.has(id)) {
			throw new Error(`Can't find chat session with ID: \`${id}\`."`);
		}
		this._selectedChatSessionId = id;
		this._onDidSelectChatSession.fire(this.selectedChatSession);
	}

	newChatSession(): { id: string; session: IPositronAssistantChatSession } {
		const id = generateUuid();
		const session = this._register(new PositronAssistantChatSession(this));
		this._chatSessions.set(id, session);
		return { id, session };
	}

	get registeredAssistants(): Map<string, string> {
		const assistants = new Map<string, string>();
		this._providers.forEach((provider, id) => {
			assistants.set(id, provider.name);
		});
		return assistants;
	}

	get registeredProviders() {
		return this._providers;
	}

	get selectedAssistant(): string | null {
		// Ensure that we're always selecting a registered assistant
		if (!this._providers.has(this._selectedAssistant ?? '')) {
			const firstId = this._providers.keys().next().value;
			if (firstId) {
				this.selectAssistant(firstId);
			}
		}
		return this._selectedAssistant;
	}

	get selectedChatSession(): IPositronAssistantChatSession {
		const id = this._selectedChatSessionId;
		if (id && this._chatSessions.has(id)) {
			return this._chatSessions.get(id)!;
		} else {
			return this._nullChatSession;
		}
	}

	get chatSessions() {
		return this._chatSessions;
	}

	provideChatResponse(): Promise<void> {
		let id = this._selectedChatSessionId;
		let session = this.selectedChatSession;
		if (!id) {
			const newChat = this.newChatSession();
			this.selectChatSession(newChat.id);

			// Copy prompt to new session, clear the null session prompt.
			newChat.session.prompt = session.prompt;
			session.prompt = '';

			id = newChat.id;
			session = newChat.session;
		}

		return session.provideChatResponse();
	}

	buildChatContext() {
		const inst = this._variableService.activePositronVariablesInstance as PositronVariablesInstance;

		return {
			console: {
				language: this._consoleService.activePositronConsoleInstance?.session.runtimeMetadata.languageName ?? '',
				version: this._consoleService.activePositronConsoleInstance?.session.runtimeMetadata.languageVersion ?? ''
			},
			variables: inst.variableItems.map((item) => {
				return {
					name: item.displayName,
					value: item.displayValue,
					type: item.displayType,
				};
			}),
		};
	}

	initialize(): void { }
}

// Register the Positron assistant service.
registerSingleton(
	IPositronAssistantService,
	PositronAssistantService,
	InstantiationType.Delayed
);
