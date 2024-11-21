/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/workbench/api/common/extHostTypes';
import * as extHostProtocol from './extHost.positron.protocol';
import * as positron from 'positron';


export class ExtHostAiFeatures implements extHostProtocol.ExtHostAiFeaturesShape {

	private readonly _proxy: extHostProtocol.MainThreadAiFeaturesShape;
	private readonly _registeredAssistants = new Map<string, positron.ai.Assistant>();

	constructor(
		mainContext: extHostProtocol.IMainPositronContext
	) {
		// Trigger creation of proxy to main thread
		this._proxy = mainContext.getProxy(extHostProtocol.MainPositronContext.MainThreadAiFeatures);
	}

	registerAssistant(assistant: positron.ai.Assistant): Disposable {
		this._proxy.$registerAssistant(assistant.identifier, assistant.name);

		this._registeredAssistants.set(assistant.identifier, assistant);

		return new Disposable(() => {
			this._proxy.$unregisterAssistant(assistant.identifier);
			this._registeredAssistants.delete(assistant.identifier);
		});
	}
}
