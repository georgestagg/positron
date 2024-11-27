/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';

import { ChatThread } from 'vs/workbench/contrib/positronAssistant/browser/components/chatThread';
import { ChatInput } from 'vs/workbench/contrib/positronAssistant/browser/components/chatInput';
import { CancellationTokenSource } from 'vs/base/common/cancellation';
import { IPositronAssistantChatMessage, IPositronAssistantChatRequest } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { ChatMessage } from 'vs/workbench/contrib/positronAssistant/browser/components/chatMessage';

/**
 * ChatSession interface.
 */
export interface ChatSessionProps { }

export type ChatSessionActiveState = {
	isActive: true;
	cancellation: CancellationTokenSource;
} | { isActive: false };

/**
 * ChatSession component.
 * @param props A ChatSessionProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatSession = (props: ChatSessionProps) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { assistantService, positronAssistants } = positronAssistantContext;

	// Ensure that we're always selecting a registered assistant
	const [selectedAssistant, setSelectedAssistant] = useState<string | undefined>();
	useEffect(() => {
		if (selectedAssistant && positronAssistants.has(selectedAssistant)) {
			return;
		}
		setSelectedAssistant(positronAssistants.keys().next().value);
	}, [positronAssistants, selectedAssistant]);


	/**
	 * TODO: This state should be stored in the PositronAssistantState context, and/or reduced for
	 * persistent storage in the Positron Assistant service. That way, we can restore history later.
	 */
	const [activeState, setActiveState] = useState<ChatSessionActiveState>({ isActive: false });
	const [messages, setMessages] = useState<IPositronAssistantChatMessage[]>([]);
	const provideResponse = async (prompt: string) => {
		const tokenSource = new CancellationTokenSource();
		if (selectedAssistant) {
			const request: IPositronAssistantChatRequest = {
				prompt,
				history: messages,
			};
			setActiveState({ isActive: true, cancellation: tokenSource });

			setMessages((prevMessages) => {
				const messages = [...prevMessages];
				messages.push({ role: 'user', content: prompt });
				messages.push({ role: 'assistant', content: '' });
				return messages;
			});

			try {
				await assistantService.provideChatResponse(selectedAssistant, request,
					(content: string) => setMessages((prevMessages) => {
						const messages = [...prevMessages];
						messages[messages.length - 1] = {
							role: 'assistant',
							content: messages[messages.length - 1]?.content + content
						};
						return messages;
					}), tokenSource.token);
			} finally {
				setActiveState({ isActive: false });
			}
		}
	};

	const messageElements = messages.map((message, idx) => <ChatMessage
		key={idx}
		{...message}
		active={activeState.isActive && idx === messages.length - 2}
	/>);

	return <div className='positron-assistant-chat-session'>
		<ChatThread>
			{messageElements}
		</ChatThread>
		<ChatInput
			onSubmit={provideResponse}
			assistant={selectedAssistant}
			setAssistant={setSelectedAssistant}
			activeState={activeState}
		></ChatInput>
	</div>;
};
