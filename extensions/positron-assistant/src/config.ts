/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024-2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as positron from 'positron';
import { randomUUID } from 'crypto';
import { languageModels } from './models';
import { completionModels } from './completion';
import { CopilotCoordinator } from './copilot';

interface StoredModelConfig extends Omit<positron.ai.LanguageModelConfig, 'apiKey'> {
	id: string;
}

export interface ModelConfig extends StoredModelConfig {
	apiKey: string;
	name: string;
	model: string;
	extension: vscode.ExtensionContext;
}

export function getStoredModels(): StoredModelConfig[] {
	const config = vscode.workspace.getConfiguration('positron.assistant');
	const storedConfigs = config.get<StoredModelConfig[]>('models') || [];
	return storedConfigs;
}

export async function getModelConfigurations(context: vscode.ExtensionContext): Promise<ModelConfig[]> {
	const storedConfigs = getStoredModels();

	// Grab API keys for models that require key auth
	let fullConfigs: ModelConfig[] = await Promise.all(
		storedConfigs.map(async (config) => {
			const apiKey = await context.secrets.get(`apiKey-${config.id}`);
			return {
				...config,
				apiKey: apiKey ?? '',
				name: config.name ?? '',
				model: config.model ?? '',
				extension: context,
			};
		})
	);

	// For the copilot chat provider, add the multiple supported models
	const copilotConfig = fullConfigs.find((config) => config.provider === 'copilot' && config.type === positron.PositronLanguageModelType.Chat);
	if (copilotConfig) {
		fullConfigs = [
			...fullConfigs.filter((config) => config.provider !== 'copilot'),
		];

		const copilot = CopilotCoordinator.getInstance(context);
		const models = await copilot.getModels();
		models
			.filter((model) => !model.scopes.includes('completion'))
			.forEach((model) => {
				fullConfigs.push({
					id: `${copilotConfig.id}-${model.id}`,
					type: positron.PositronLanguageModelType.Chat,
					apiKey: '',
					provider: 'copilot',
					name: model.modelName,
					model: model.modelFamily,
					extension: context,
				});
			});

		const completion = models.find((model) => model.scopes.includes('completion'))!;
		fullConfigs.push({
			id: `${copilotConfig.id}-${completion.id}`,
			type: positron.PositronLanguageModelType.Completion,
			apiKey: '',
			provider: 'copilot',
			name: completion.modelName,
			model: completion.modelFamily,
			extension: context,
		});
	}
	return fullConfigs;
}

export async function showConfigurationDialog(context: vscode.ExtensionContext) {
	// Gather model sources
	const sources = [...languageModels, ...completionModels].map((provider) => provider.source);

	// Show a modal asking user for configuration details
	return positron.ai.showLanguageModelConfig(sources, async (userConfig) => {
		const { provider, apiKey, ...otherConfig } = userConfig;

		// Create unique ID for the configuration
		const id = randomUUID();

		// Check for required fields
		sources
			.filter((source) => source.type === userConfig.type)
			.find((source) => source.provider.id === userConfig.provider)?.supportedOptions
			.forEach((option) => {
				if (!(option in userConfig)) {
					throw new Error(vscode.l10n.t(
						`Can't save configuration with missing required option: ${option}`
					));
				}
			});

		// Store API key in secret storage
		if (apiKey) {
			await context.secrets.store(`apiKey-${id}`, apiKey);
		}

		// Get existing configurations
		const config = vscode.workspace.getConfiguration('positron.assistant');
		const existingConfigs = config.get<StoredModelConfig[]>('models') || [];

		// Add new configuration
		const newConfig: StoredModelConfig = {
			id,
			provider,
			...otherConfig,
		};

		// Update settings.json
		await config.update(
			'models',
			[...existingConfigs, newConfig],
			vscode.ConfigurationTarget.Global
		);

		vscode.window.showInformationMessage(
			vscode.l10n.t(`Language Model "{0}" has been added successfully.`, provider)
		);
	});

}

export async function deleteConfiguration(context: vscode.ExtensionContext, id: string) {
	const config = vscode.workspace.getConfiguration('positron.assistant');
	const existingConfigs = config.get<StoredModelConfig[]>('models') || [];
	const updatedConfigs = existingConfigs.filter(config => config.id !== id);

	await config.update(
		'models',
		updatedConfigs,
		vscode.ConfigurationTarget.Global
	);

	await context.secrets.delete(`apiKey-${id}`);
}
