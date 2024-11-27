/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatMessage';
import React, { useEffect, useRef } from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { IMarkdownString } from 'vs/base/common/htmlContent';
import { IPositronAssistantChatMessage } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';

/**
 * ChatMessage interface.
 */
export interface ChatMessageProps extends IPositronAssistantChatMessage {
	active: boolean;
}

/**
 * ChatMessage component.
 * @param props A ChatMessageProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatMessage = (props: React.PropsWithChildren<ChatMessageProps>) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { markdownRenderer } = positronAssistantContext;
	const messageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const markdown: IMarkdownString = {
			value: props.content,
		};
		const render = markdownRenderer.render(markdown);
		messageRef.current?.replaceChildren(render.element);
	}, [markdownRenderer, props.content]);

	return <div className={`positron-assistant-chat-message role-${props.role}`}>
		{props.active && <div className='message-slider'></div>}
		<div className='message-content' ref={messageRef}></div>
	</div>;
};
