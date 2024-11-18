/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./ChatInput';
import React from 'react';
/**
 * ChatInput interface.
 */
export interface ChatInputProps { }

/**
 * ChatInput component.
 * @param props A ChatInputProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatInput = (props: React.PropsWithChildren<ChatInputProps>) => {
	return <div className='positron-assistant-chat-input'>
		<button className='positron-assistant-chat-stop'>Cancel</button>
		<div className='editable' contentEditable='true' translate='no' tabIndex={0}>
			Ask me anything!
		</div>
		<div className='chat-bottom-toolbar'>
			<div>
				<select>
					<option>Assistant 1 <span className='codicon codicon-positron-drop-down-arrow'></span></option>
					<option>Assistant 2 <span className='codicon codicon-positron-drop-down-arrow'></span></option>
				</select>
			</div>
			<div className='chat-hint'>Shift + Enter to chat</div>
		</div>
	</div>;
};
