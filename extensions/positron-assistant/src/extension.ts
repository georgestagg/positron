/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as positron from 'positron';
import { getModelConfigurations } from './config';
import { newAssistant } from './assistants';

export function activate(context: vscode.ExtensionContext) {
	try {
		const modelConfigs = getModelConfigurations();
		modelConfigs.forEach(config => {
			const assistant = newAssistant(config);
			const disposable = positron.ai.registerAssistant(context.extension, assistant);
			context.subscriptions.push(disposable);
		});
	} catch (error) {
		vscode.window.showErrorMessage(
			`Positron Assistant: Failed to load model configurations - ${error}`
		);
	}
}
