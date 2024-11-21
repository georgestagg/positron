/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore } from 'vs/base/common/lifecycle';
import { ExtHostAiFeaturesShape, ExtHostPositronContext, MainPositronContext, MainThreadAiFeaturesShape } from '../../common/positron/extHost.positron.protocol';
import { extHostNamedCustomer, IExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers';
import { IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';

@extHostNamedCustomer(MainPositronContext.MainThreadAiFeatures)
export class MainThreadAiFeatures implements MainThreadAiFeaturesShape {

	private readonly _disposables = new DisposableStore();
	private readonly _proxy: ExtHostAiFeaturesShape;

	constructor(
		extHostContext: IExtHostContext,
		@IPositronAssistantService private readonly _positronAssistantService: IPositronAssistantService,
	) {
		// Create the proxy for the extension host.
		this._proxy = extHostContext.getProxy(ExtHostPositronContext.ExtHostAiFeatures);
		console.log(this._proxy);
	}

	dispose(): void {
		this._disposables.dispose();
	}

	$registerAssistant(id: string, name: string): void {
		this._positronAssistantService.registerAssistant(id, name);
	}

	$unregisterAssistant(id: string): void {
		this._positronAssistantService.unregisterAssistant(id);
	}
}
