/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/base/common/lifecycle';
import { IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';

/**
 * PositronAssistantService class.
 */
class PositronAssistantService extends Disposable implements IPositronAssistantService {
	declare readonly _serviceBrand: undefined;

	initialize(): void { }
}

// Register the Positron assistant service.
registerSingleton(
	IPositronAssistantService,
	PositronAssistantService,
	InstantiationType.Delayed
);
