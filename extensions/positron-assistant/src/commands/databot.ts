/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024-2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as positron from 'positron';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { EXTENSION_ROOT_DIR } from '../constants';
import { toLanguageModelChatMessage } from '../utils';
import { executeToolAdapter } from '../tools';

const mdDir = `${EXTENSION_ROOT_DIR}/src/md/`;

export async function databotHandler(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	response: vscode.ChatResponseStream,
	token: vscode.CancellationToken
) {
	const system = await fs.promises.readFile(`${mdDir}/prompts/chat/default.md`, 'utf8');
	const toolOptions: Record<string, any> = {};
	const tools: vscode.LanguageModelChatTool[] = [executeToolAdapter.toolData];

	const messages: vscode.LanguageModelChatMessage[] = toLanguageModelChatMessage(context.history);
	messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

	const modelResponse = await request.model.sendRequest(messages, {
		tools,
		modelOptions: {
			toolInvocationToken: request.toolInvocationToken,
			toolOptions,
			system
		},
	}, token);

	for await (const chunk of modelResponse.stream) {
		if (token.isCancellationRequested) {
			break;
		}

		if (chunk instanceof vscode.LanguageModelTextPart) {
			response.markdown(chunk.value);
		}
	}

	return {
		metadata: {
			modelId: request.model.id
		},
	};
}
