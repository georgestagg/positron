/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable, Disposable, toDisposable } from 'vs/base/common/lifecycle';
import { IPositronAssistantService, IPositronAssistantProvider, IPositronAssistantChatRequest } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { ILogService } from 'vs/platform/log/common/log';
import { Emitter } from 'vs/base/common/event';
import { CancellationToken } from 'vs/base/common/cancellation';

/**
 * PositronAssistantService class.
 */
class PositronAssistantService extends Disposable implements IPositronAssistantService {
	declare readonly _serviceBrand: undefined;

	private readonly _providers = new Map<string, IPositronAssistantProvider>();

	// The event emitter for the onDidRegisterAssistant event.
	private readonly _onDidRegisterAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidRegisterAssistant = this._onDidRegisterAssistantEmitter.event;

	constructor(
		@ILogService private readonly _logService: ILogService
	) {
		super();
	}

	registerAssistant(id: string, provider: IPositronAssistantProvider): IDisposable {
		this._providers.set(id, provider);

		// Signal that the set of assistants has changed.
		this._onDidRegisterAssistantEmitter.fire(provider.name);

		this._logService.debug(`Assistant "${provider.name}" with identifier ${id} registered.`);

		return toDisposable(() => {
			this._logService.debug(`Assistant with identifier ${id} disposed.`);
			this._providers.delete(id);
		});
	}

	get registeredAssistants(): Map<string, string> {
		const assistants = new Map<string, string>();
		this._providers.forEach((provider, id) => {
			assistants.set(id, provider.name);
		});
		return assistants;
	}

	async provideChatResponse(id: string, request: IPositronAssistantChatRequest,
		handler: (content: string) => void, token: CancellationToken) {
		return this._providers.get(id)?.provideChatResponse(request, handler, token);
	}

	initialize(): void { }
}

// Register the Positron assistant service.
registerSingleton(
	IPositronAssistantService,
	PositronAssistantService,
	InstantiationType.Delayed
);
