/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as positron from 'positron';
import { ModelConfig } from './config';

abstract class Assistant implements positron.ai.Assistant {
	public readonly name;
	public readonly identifier;
	constructor(protected readonly _config: ModelConfig) {
		this.identifier = _config.name.toLowerCase().replace(/\s+/g, '-');
		this.name = _config.name;
	}
	public abstract chatResponseProvider(request: positron.ai.ChatRequest, response: positron.ai.ChatResponse, token: vscode.CancellationToken): Promise<void>;
}

class EchoAssistant extends Assistant {
	async chatResponseProvider(request: positron.ai.ChatRequest, response: positron.ai.ChatResponse, token: vscode.CancellationToken) {
		response.write(`Context: ${JSON.stringify(request.context)}.`);
		for await (const i of request.prompt.split('')) {
			await new Promise(resolve => setTimeout(resolve, 10));
			response.write(i);
			if (token.isCancellationRequested) {
				return;
			}
		}
	}
}

class OpenAIAssistant extends Assistant {
	async chatResponseProvider(request: positron.ai.ChatRequest, response: positron.ai.ChatResponse, token: vscode.CancellationToken) {
		const messages = [
			{ role: 'system', content: 'You are a helpful coding assistant.' },
			...request.history.filter((message) => message.content),
			{ role: 'user', content: JSON.stringify(request.context) },
			{ role: 'assistant', content: 'Acknowledged. I won\t explicitly mention this context if it is irrelevant, but I will keep it in mind for my responses.' },
			{ role: 'user', content: request.prompt },
		];
		const controller = new AbortController();
		const rsp = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this._config.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: this._config.model,
				messages,
				stream: true,
			}),
			signal: controller.signal,
		});

		if (!rsp.ok) {
			const errorText = await rsp.text();
			throw new Error(`OpenAI API error (${rsp.status} ${rsp.statusText}): ${errorText}`);
		}

		if (!rsp.body) {
			throw new Error('Response body is null');
		}

		const disposable = token.onCancellationRequested(() => {
			controller.abort();
			disposable.dispose();
		});

		const reader = rsp.body.pipeThrough(new TextDecoderStream()).getReader();
		let buffer = '';

		while (!token.isCancellationRequested) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			buffer += value;
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) {
					continue;
				}

				if (line === 'data: [DONE]') {
					break;
				}

				try {
					const json = JSON.parse(line.substring(6));
					if ('content' in json.choices[0].delta) {
						response.write(json.choices[0].delta.content);
					}
				} catch (e) {
					throw new Error(`Error parsing chunk \`${line}\`: ${e}`);
				}
			}
		}
	}
}

class AnthropicAssistant extends Assistant {
	async chatResponseProvider(request: positron.ai.ChatRequest, response: positron.ai.ChatResponse, token: vscode.CancellationToken) {
		const messages = [
			...request.history.filter((message) => message.content),
			{ role: 'user', content: JSON.stringify(request.context) },
			{ role: 'assistant', content: 'Acknowledged. I won\t explicitly mention this context if it is irrelevant, but I will keep it in mind for my responses.' },
			{ role: 'user', content: request.prompt },
		];
		const controller = new AbortController();
		const rsp = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this._config.apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: this._config.model,
				messages,
				max_tokens: 4096,
				system: `You are a helpful coding assistant.`,
				stream: true,
			}),
			signal: controller.signal,
		});

		if (!rsp.ok) {
			const errorText = await rsp.text();
			throw new Error(`Anthropic API error (${rsp.status} ${rsp.statusText}): ${errorText}`);
		}

		if (!rsp.body) {
			throw new Error('Response body is null');
		}

		const disposable = token.onCancellationRequested(() => {
			controller.abort();
			disposable.dispose();
		});

		const reader = rsp.body.pipeThrough(new TextDecoderStream()).getReader();
		let buffer = '';

		while (!token.isCancellationRequested) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			buffer += value;
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) {
					continue;
				}

				if (line === 'data: [DONE]') {
					break;
				}

				try {
					const parsed = JSON.parse(line.substring(6));
					switch (parsed.type) {
						case 'content_block_delta':
							response.write(parsed.delta.text);
							break;
						case 'message_start':
						case 'content_block_start':
						case 'message_delta':
						default:
							break;
					}
				} catch (e) {
					throw new Error(`Error parsing chunk \`${line}\`: ${e}`);
				}
			}
		}
	}
}

export function newAssistant(config: ModelConfig): Assistant {
	const providerClasses = {
		'echo': EchoAssistant,
		'openai': OpenAIAssistant,
		'anthropic': AnthropicAssistant,
	};

	if (!providerClasses[config.provider]) {
		throw new Error(`Unsupported provider: ${config.provider}`);
	}

	return new providerClasses[config.provider](config);
}
