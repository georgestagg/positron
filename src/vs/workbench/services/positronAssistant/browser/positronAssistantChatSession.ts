/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from 'vs/base/common/cancellation';
import { Emitter } from 'vs/base/common/event';
import { Disposable } from 'vs/base/common/lifecycle';
import { IPositronAssistantChatSession } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantChatSession';
import { IPositronAssistantChatMessage, IPositronAssistantChatRequest, IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';

/**
 * PositronAssistantChatSession class.
 */
export class PositronAssistantChatSession extends Disposable implements IPositronAssistantChatSession {
	private _active = false;
	private _cancellation?: CancellationTokenSource;

	// Event emitters
	private readonly _onChatResponse = this._register(new Emitter<IPositronAssistantChatMessage>);
	readonly onChatResponse = this._onChatResponse.event;

	// Display state
	readonly isNull: boolean = false;
	prompt: string = '';
	history: IPositronAssistantChatMessage[] = [];
	scrollTop: number = 0;
	title: string = 'Untitled Chat';
	summary?: string;

	constructor(
		private readonly _context: IPositronAssistantService,
	) {
		super();
	}

	get isActive() {
		return this._active;
	}

	cancel() {
		this._cancellation?.cancel();
		this.setInactive();
	}

	setActive() {
		this._active = true;
		this._cancellation = new CancellationTokenSource();
		return this._cancellation;
	}

	setInactive() {
		this._active = false;
		this._cancellation = undefined;
	}

	async provideChatResponse() {
		// Set active and generate a cancellation token
		const cancellation = this.setActive();

		// Build assistant request using current state of chat session
		const request: IPositronAssistantChatRequest = {
			prompt: this.prompt,
			history: [...this.history],
		};

		// Update session to reflect user submitted message and prepare for assistant response
		this.history.push({ role: 'user', content: this.prompt });
		this.history.push({ role: 'assistant', content: '' });
		this.prompt = '';
		this._onChatResponse.fire(this.history[this.history.length - 1]);

		// Handle streaming responses from the LLM: Stream response and update session details
		const response = (content: string) => {
			const idx = this.history.length - 1;
			this.history[idx].content += content;
			this._onChatResponse.fire(this.history[idx]);
		};

		// Get provider functions for the currently selected assistant
		const assistant = this._context.selectedAssistant;
		if (!assistant) {
			throw new Error('Can\'t provide chat response: No assistant selected');
		}

		const provider = this._context.registeredProviders.get(assistant);
		if (!provider) {
			throw new Error('Can\'t provide chat response: Assistant provider not registered');
		}

		// Provide the chat response
		try {
			await provider.provideChatResponse(request, response, cancellation.token);
		} finally {
			this.setInactive();
			// Final event to ensure a completed response once the provider has finished
			this._onChatResponse.fire(this.history[this.history.length - 1]);
		}
	}
}

/**
 * PositronAssistantNullChatSession class.
 */
export class PositronAssistantNullChatSession extends PositronAssistantChatSession {
	override readonly title = '';
	override readonly summary = '';
	override readonly history = [];
	override readonly isNull = true;

	override get isActive() {
		return false;
	}

	// Stubs
	override async provideChatResponse() {
		throw new Error('Null chat session cannot provide chat responses.');
	}
}
