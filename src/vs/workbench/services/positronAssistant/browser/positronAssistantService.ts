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
	private _selectedAssistant: string | null;

	// Event emitters
	private readonly _onDidRegisterAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidRegisterAssistant = this._onDidRegisterAssistantEmitter.event;

	private readonly _onDidSelectAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidSelectAssistant = this._onDidSelectAssistantEmitter.event;

	constructor(
		@ILogService private readonly _logService: ILogService
	) {
		super();
		this._selectedAssistant = null;
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

	get registeredAssistants(): Map<string, string> {
		const assistants = new Map<string, string>();
		this._providers.forEach((provider, id) => {
			assistants.set(id, provider.name);
		});
		return assistants;
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
