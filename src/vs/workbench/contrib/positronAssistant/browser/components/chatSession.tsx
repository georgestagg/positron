/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';

import { ChatThread } from 'vs/workbench/contrib/positronAssistant/browser/components/chatThread';
import { ChatInput } from 'vs/workbench/contrib/positronAssistant/browser/components/chatInput';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { ChatSessionHistory } from 'vs/workbench/contrib/positronAssistant/browser/components/chatHistory';
import { IPositronAssistantChatMessage } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { ChatMessage } from 'vs/workbench/contrib/positronAssistant/browser/components/chatMessage';
import { DisposableStore } from 'vs/base/common/lifecycle';

/**
 * ChatSession interface.
 */
export interface ChatSessionProps { }

/**
 * ChatSession component.
 * @param props A ChatSessionProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatSession = (props: ChatSessionProps) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { selectedChatSession } = positronAssistantContext;

	const [messages, setMessages] = useState<IPositronAssistantChatMessage[]>([]);

	// Update the session if the selected chat session changes, or a response is streaming in
	useEffect(() => {
		setMessages(selectedChatSession.history);

		const disposableStore = new DisposableStore();
		disposableStore.add(selectedChatSession.onChatResponse(() => {
			setMessages([...selectedChatSession.history]);
		}));

		return () => disposableStore.dispose();
	}, [selectedChatSession]);

	// Build selected session's message thread
	const thread = messages.map((message, idx) => <ChatMessage
		key={idx}
		{...message}
		active={selectedChatSession.isActive && idx === messages.length - 2}
	/>);

	return <div className='positron-assistant-chat-session'>
		{selectedChatSession.isNull
			? <ChatSessionHistory />
			: <ChatThread>{thread}</ChatThread>}
		<ChatInput />
	</div>;
};
