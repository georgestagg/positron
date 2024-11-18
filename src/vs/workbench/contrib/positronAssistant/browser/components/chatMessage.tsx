/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatMessage';
import React, { useEffect, useRef } from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { IMarkdownString } from 'vs/base/common/htmlContent';

/**
 * ChatMessage interface.
 */
export interface ChatMessageProps {
	markdown: IMarkdownString;
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
		messageRef.current?.replaceChildren(markdownRenderer.render(props.markdown).element);
	}, [markdownRenderer, props.markdown]);

	return <div className='positron-assistant-chat-message'>
		<div ref={messageRef}></div>
	</div>;
};
