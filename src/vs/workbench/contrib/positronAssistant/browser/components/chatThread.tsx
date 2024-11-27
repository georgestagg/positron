/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatThread';
import React, { useEffect, useRef } from 'react';

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

	return <div ref={threadRef} className='positron-assistant-chat-thread'>
		<div ref={containerRef}>
			{props.children}
		</div>
	</div>;
};
