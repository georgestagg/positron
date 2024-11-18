/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef } from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { IMarkdownString } from 'vs/base/common/htmlContent';

/**
 * ChatResponse interface.
 */
export interface ChatResponseProps {
	markdown: IMarkdownString;
}

/**
 * ChatResponse component.
 * @param props A ChatResponseProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatResponse = (props: React.PropsWithChildren<ChatResponseProps>) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { markdownRenderer } = positronAssistantContext;
	const messageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messageRef.current?.replaceChildren(markdownRenderer.render(props.markdown).element);
	}, [markdownRenderer, props.markdown]);

	return <div className='positron-assistant-chat-response'>
		<div ref={messageRef}></div>
	</div>;
};
