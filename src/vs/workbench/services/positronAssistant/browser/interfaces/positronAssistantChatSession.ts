/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'vs/base/common/event';
import { IPositronAssistantChatMessage } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';

export interface IPositronAssistantChatSession {
	cancel: () => void;
	provideChatResponse: () => Promise<void>;
	onChatResponse: Event<IPositronAssistantChatMessage>;
	isActive: boolean;
	scrollTop: number;
	title: string;
	history: IPositronAssistantChatMessage[];
	prompt: string;
	summary?: string;
	isNull: boolean;
}
