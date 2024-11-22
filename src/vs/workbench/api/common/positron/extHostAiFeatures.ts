/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/workbench/api/common/extHostTypes';
import * as extHostProtocol from './extHost.positron.protocol';
import * as positron from 'positron';
import * as vscode from 'vscode';

class ChatResponse implements positron.ai.ChatResponse {
	private _isClosed: boolean;

	constructor(
		private readonly _proxy: extHostProtocol.MainThreadAiFeaturesShape,
		private readonly _taskId: string,
	) {
		this._isClosed = false;
	}

	write(content: string): void {
		if (this._isClosed) {
			throw new Error('Response stream is closed');
		}
		this._proxy.$handleChatResponse(this._taskId, content);
	}

	close(): void {
		this._isClosed = true;
	}
}

export class ExtHostAiFeatures implements extHostProtocol.ExtHostAiFeaturesShape {

	private readonly _proxy: extHostProtocol.MainThreadAiFeaturesShape;
	private readonly _registeredAssistants = new Map<string, positron.ai.Assistant>();

	constructor(
		mainContext: extHostProtocol.IMainPositronContext
	) {
		// Trigger creation of proxy to main thread
		this._proxy = mainContext.getProxy(extHostProtocol.MainPositronContext.MainThreadAiFeatures);
	}

	registerAssistant(extension: vscode.Extension<any>, assistant: positron.ai.Assistant): Disposable {
		// Unique ID for each extension-assistant combination
		const id = `${extension.id}-${assistant.identifier}`;
		this._registeredAssistants.set(id, assistant);
		this._proxy.$registerAssistant(id, assistant.name);

		return new Disposable(() => {
			this._proxy.$unregisterAssistant(assistant.identifier);
			this._registeredAssistants.delete(assistant.identifier);
		});
	}

	async $provideChatResponse(id: string, request: positron.ai.ChatRequest, taskId: string,
		token: vscode.CancellationToken): Promise<void> {

		const assistant = this._registeredAssistants.get(id);
		if (!assistant) {
			throw new Error('Assistant not found.');
		}

		const response = new ChatResponse(this._proxy, taskId);

		try {
			const response = new ChatResponse(this._proxy, taskId);
			await assistant.chatResponseProvider(request, response, token);
		} finally {
			response.close();
		}

	}
}
