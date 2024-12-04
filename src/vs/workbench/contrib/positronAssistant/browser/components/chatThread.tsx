/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatThread';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';

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
	const positronAssistantContext = usePositronAssistantContext();
	const { selectedChatSession } = positronAssistantContext;

	const threadRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Autoscroll the messages thread when already near the bottom and content updates
	useEffect(() => {
		const onHeightChange = () => {
			const thread = threadRef.current;
			if (thread && thread.scrollTop + thread.clientHeight > thread.scrollHeight - 100) {
				thread.scrollTop = thread.scrollHeight;
			}
		};

		const resizeObserver = new ResizeObserver(onHeightChange);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}
		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	/**
	 * Track the scroll position of current chat session.
	 * TODO: Can we do this without setTimeout. It seems to need to wait for message rendering.
	 */
	useLayoutEffect(() => {
		const thread = threadRef.current;
		if (!thread) {
			return;
		}

		const timeoutId = setTimeout(() => {
			thread.scrollTop = selectedChatSession.scrollTop;
		}, 50);

		const handleScroll = () => {
			selectedChatSession.scrollTop = thread.scrollTop;
		};
		thread.addEventListener('scroll', handleScroll);

		return () => {
			clearTimeout(timeoutId);
			thread.removeEventListener('scroll', handleScroll);
		};
	}, [selectedChatSession]);

	return <div ref={threadRef} className='positron-assistant-chat-thread'>
		<div ref={containerRef}>
			{props.children}
		</div>
	</div>;
};
