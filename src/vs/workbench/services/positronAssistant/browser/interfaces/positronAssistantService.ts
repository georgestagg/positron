/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'vs/base/common/event';
import { IDisposable } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { CancellationToken } from 'vs/base/common/cancellation';
import { IPositronAssistantChatSession } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantChatSession';

// Create the decorator for the Positron assistant service (used in dependency injection).
export const IPositronAssistantService = createDecorator<IPositronAssistantService>('positronAssistantService');

export interface IPositronAssistantProvider {
	name: string;
	provideChatResponse(request: IPositronAssistantChatRequest, handler: (content: string) => void,
		token: CancellationToken): Promise<void>;
}

export interface IPositronAssistantChatTask {
	handler: (content: string) => void;
}

export interface IPositronAssistantChatMessage {
	role: string;
	content: string;
}

export interface IPositronAssistantChatRequest {
	prompt: string;
	history: IPositronAssistantChatMessage[];
}

/**
 * IPositronAssistantService interface.
 */
export interface IPositronAssistantService {
	/**
	 * Needed for service branding in dependency injector.
	 */
	readonly _serviceBrand: undefined;

	/**
	 * Notifies subscribers when a new assistant has been registered.
	 */
	readonly onDidRegisterAssistant: Event<string>;

	/**
	 * Notifies subscribers when a new assistant has been selected.
	 */
	readonly onDidSelectAssistant: Event<string>;

	/**
	 * Notifies subscribers when an existing chat session has been selected. A `null` ID represents
	 * deselection.
	 */
	readonly onDidSelectChatSession: Event<IPositronAssistantChatSession>;

	/**
	 * Names of assistants registered with the assistant service.
	 */
	readonly registeredAssistants: Map<string, string>;

	/**
	 * Provider functions for assistants registered with the assistant service.
	 */
	readonly registeredProviders: Map<string, IPositronAssistantProvider>;

	/**
	 * Stored sessions.
	 */
	readonly chatSessions: Map<string, IPositronAssistantChatSession>;

	/**
	 * The ID of the currently selected assistant.
	 */
	readonly selectedAssistant: string | null;

	/**
	 * The ID of the currently selected chat session.
	 */
	readonly selectedChatSession: IPositronAssistantChatSession;


	/**
	 * Register a new assistant.
	 */
	registerAssistant(id: string, provider: IPositronAssistantProvider): IDisposable;

	/**
	 * Select an assistant by ID.
	 */
	selectAssistant(id: string): void;

	/**
	 * Select a chat session by ID.
	 */
	selectChatSession(id: string | null): void;

	/**
	 * Start a new chat session.
	 */
	newChatSession(): { id: string; session: IPositronAssistantChatSession };

	/**
	 * Provide a chat response for the currently selected assistant and chat session.
	 */
	provideChatResponse(): Promise<void>;

	/**
	 * Placeholder that gets called to "initialize" the PositronAssistantService.
	 */
	initialize(): void;

}
