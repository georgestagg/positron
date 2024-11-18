/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatThread';
import { ChatResponse } from 'vs/workbench/contrib/positronAssistant/browser/components/chatResponse';
import { ChatMessage } from 'vs/workbench/contrib/positronAssistant/browser/components/chatMessage';

import React from 'react';
/**
 * ChatThread interface.
 */
export interface ChatThreadProps { }

/**
 * ChatThread component.
 * @param props A ChatThreadProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatThread = (props: React.PropsWithChildren<ChatThreadProps>) => {
	return <div className='positron-assistant-chat-thread'>
		<ChatMessage markdown={{ value: `foo bar baz` }}></ChatMessage>
		<ChatResponse markdown={{ value: `one one two three five eight` }}></ChatResponse>
	</div>;
};
