/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable, Disposable, toDisposable } from 'vs/base/common/lifecycle';
import { IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { ILogService } from 'vs/platform/log/common/log';
import { Emitter } from 'vs/base/common/event';

/**
 * PositronAssistantService class.
 */
class PositronAssistantService extends Disposable implements IPositronAssistantService {
	declare readonly _serviceBrand: undefined;

	private readonly _registeredAssistants = new Map<string, string>();

	// The event emitter for the onDidRegisterAssistant event.
	private readonly _onDidRegisterAssistantEmitter = this._register(new Emitter<string>);
	readonly onDidRegisterAssistant = this._onDidRegisterAssistantEmitter.event;

	constructor(
		@ILogService private readonly _logService: ILogService
	) {
		super();
	}

	registerAssistant(id: string, name: string): IDisposable {
		if (this._registeredAssistants.has(name)) {
			return toDisposable(() => { });
		}

		this._registeredAssistants.set(id, name);

		// Signal that the set of assistants has changed.
		this._onDidRegisterAssistantEmitter.fire(name);

		this._logService.debug(`Assistant "${name}" with identifier ${id} registered.`);

		return toDisposable(() => {
			this._registeredAssistants.delete(id);
		});
	}

	unregisterAssistant(id: string): void {
		this._logService.debug(`Assistant with identifier ${id} unregistered.`);
		this._registeredAssistants.delete(id);
	}

	get registeredAssistants(): string[] {
		return Array.from(this._registeredAssistants.values());
	}

	initialize(): void { }
}

// Register the Positron assistant service.
registerSingleton(
	IPositronAssistantService,
	PositronAssistantService,
	InstantiationType.Delayed
);
