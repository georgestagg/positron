/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatHistory';
import React from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { IPositronAssistantChatSession } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantChatSession';
/**
 * ChatSessionHistory interface.
 */
export interface ChatSessionHistoryProps { }

/**
 * ChatSessionHistory component.
 * @param props A ChatSessionHistoryProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatSessionHistory = (props: ChatSessionHistoryProps) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { assistantService } = positronAssistantContext;

	const sessions = Array.from(assistantService.chatSessions, ([key, value]) => {
		return <ChatSessionSummary
			key={key}
			onSelect={() => assistantService.selectChatSession(key)}
			session={value}
		/>;
	});

	return <div className='positron-assistant-chat-history'>
		<h1>Positron Assistant</h1>
		<p>AI assistants can make mistakes. Double check responses.</p>
		<h2>Previous Chats</h2>
		<div className='chat-history-list'>{sessions}</div>
	</div>;
};

/**
 * ChatSessionSummary interface.
 */
export interface ChatSessionSummaryProps {
	session: IPositronAssistantChatSession;
	onSelect: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * ChatSessionSummary component.
 * @param props A ChatSessionSummaryProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatSessionSummary = (props: ChatSessionSummaryProps) => {
	return <div onClick={props.onSelect} className='positron-assistant-chat-summary'>
		<div className='chat-summary-title'>{props.session.title}</div>
		<p className='chat-summary-content'>{props.session.summary || ''}</p>
	</div>;
};
