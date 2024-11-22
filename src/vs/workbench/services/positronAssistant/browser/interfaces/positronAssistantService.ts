/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'vs/base/common/event';
import { IDisposable } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { CancellationToken } from 'vs/base/common/cancellation';

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
	history: string[];
}

/**
 * IPositronAssistantService interface.
 */
export interface IPositronAssistantService {
	/**
	 * Needed for service branding in dependency injector.
	 */
	readonly _serviceBrand: undefined;

	readonly onDidRegisterAssistant: Event<string>;

	/**
	 * Assistants registered with the assistant service.
	 */
	registeredAssistants: Map<string, string>;

	/**
	 * Register a new assistant.
	 */
	registerAssistant(id: string, provider: IPositronAssistantProvider): IDisposable;

	/**
	 * Provide a chat response for a specified chat request to the specified assistant.
	 */
	provideChatResponse(id: string, request: IPositronAssistantChatRequest,
		handler: (text: string) => void, token: CancellationToken): void;

	/**
	 * Placeholder that gets called to "initialize" the PositronAssistantService.
	 */
	initialize(): void;

}
