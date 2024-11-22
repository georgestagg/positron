/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, DisposableMap } from 'vs/base/common/lifecycle';
import { ExtHostAiFeaturesShape, ExtHostPositronContext, MainPositronContext, MainThreadAiFeaturesShape } from '../../common/positron/extHost.positron.protocol';
import { extHostNamedCustomer, IExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers';
import { IPositronAssistantChatTask, IPositronAssistantProvider, IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { generateUuid } from 'vs/base/common/uuid';

@extHostNamedCustomer(MainPositronContext.MainThreadAiFeatures)
export class MainThreadAiFeatures extends Disposable implements MainThreadAiFeaturesShape {

	private readonly _proxy: ExtHostAiFeaturesShape;
	private readonly _registrations = this._register(new DisposableMap<string>());
	private readonly _tasks = new Map<string, IPositronAssistantChatTask>();

	constructor(
		extHostContext: IExtHostContext,
		@IPositronAssistantService private readonly _positronAssistantService: IPositronAssistantService,
	) {
		super();
		// Create the proxy for the extension host.
		this._proxy = extHostContext.getProxy(ExtHostPositronContext.ExtHostAiFeatures);
	}

	$registerAssistant(id: string, name: string): void {
		const provider: IPositronAssistantProvider = {
			name,
			provideChatResponse: async (request, handler, token) => {
				const taskId = generateUuid();
				this._tasks.set(taskId, { handler });
				try {
					return await this._proxy.$provideChatResponse(id, request, taskId, token);
				} finally {
					this._tasks.delete(taskId);
				}
			}
		};
		const disposable = this._positronAssistantService.registerAssistant(id, provider);
		this._registrations.set(id, disposable);
	}

	$unregisterAssistant(id: string): void {
		this._registrations.deleteAndDispose(id);
	}

	$handleChatResponse(taskId: string, content: string) {
		const task = this._tasks.get(taskId);
		if (!task) {
			throw new Error('Chat response task not found.');
		}
		task.handler(content);
	}
}
