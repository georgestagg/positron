/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export interface ModelConfig {
	apiKey: string;
	name: string;
	model: string;
	provider: 'openai' | 'anthropic' | 'echo';
}

export function getModelConfigurations(): ModelConfig[] {
	const config = vscode.workspace.getConfiguration('positron.assistant');
	const models = config.get<ModelConfig[]>('models');

	if (!models || models.length === 0) {
		throw new Error('No model configurations found');
	}

	return models;
}
