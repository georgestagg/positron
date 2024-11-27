/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./chatInput';
import React, { useState, useRef } from 'react';
import { usePositronAssistantContext } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { ChatSessionActiveState } from 'vs/workbench/contrib/positronAssistant/browser/components/chatSession';
import { DropDown } from 'vs/workbench/contrib/positronAssistant/browser/components/dropdown';

/**
 * ChatInput interface.
 */
export interface ChatInputProps {
	onSubmit: (prompt: string) => void;
	assistant: string | undefined;
	setAssistant: React.Dispatch<React.SetStateAction<string | undefined>>;
	activeState: ChatSessionActiveState;
}

/**
 * ChatInput component.
 * @param props A ChatInputProps that contains the component properties.
 * @returns The rendered component.
 */
export const ChatInput = (props: ChatInputProps) => {
	const positronAssistantContext = usePositronAssistantContext();
	const { positronAssistants, contextMenuService } = positronAssistantContext;
	const editorRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState<string>('');

	// Allow modifier shortcuts to work in editor
	const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}

		if (e.shiftKey && e.key === 'Enter') {
			e.stopPropagation();
			e.preventDefault();
			handleSubmit();
		}

		if ((e.ctrlKey || e.metaKey) && 'zyaxcv'.includes(e.key)) {
			e.stopPropagation();
			e.preventDefault();
			switch (e.key.toLowerCase()) {
				case 'z':
					if (e.shiftKey) {
						editor.ownerDocument.execCommand('redo');
					} else {
						editor.ownerDocument.execCommand('undo');
					}
					break;
				case 'y':
					editor.ownerDocument.execCommand('redo');
					break;
				case 'a':
					editor.ownerDocument.execCommand('selectAll');
					break;
				case 'x':
					editor.ownerDocument.execCommand('cut');
					break;
				case 'c':
					editor.ownerDocument.execCommand('copy');
					break;
				case 'v':
					editor.ownerDocument.execCommand('paste');
					break;
			}
		}
	};

	// Force pasting in plain text
	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const text = e.clipboardData?.getData('text/plain');
		const selection = editorRef.current?.ownerDocument.getSelection();
		if (selection?.rangeCount && text) {
			e.preventDefault();
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(document.createTextNode(text));
			selection.collapseToEnd();
			setInput(e.currentTarget.innerText);
		}
	};

	// Handle UI button interactions
	const handleCancel = () => {
		if (props.activeState.isActive) {
			props.activeState.cancellation.cancel();
		}
	};

	// Submit input and clear editor component
	const handleSubmit = () => {
		const editor = editorRef.current;
		if (editor && !props.activeState.isActive && input.trim() !== '') {
			props.onSubmit(input);
			while (editor && editor.firstChild) {
				editor.removeChild(editor.firstChild);
			}
			setInput('');

			// Return focus for follow up inputs
			editor.focus();
		}
	};

	const placeholderText = 'Ask me anything';

	return <div className='positron-assistant-chat-input'>
		<div className='chat-top-toolbar'>
			{props.activeState.isActive &&
				<button
					className='positron-assistant-chat-stop'
					onClick={handleCancel}
				>Cancel generation</button>}
		</div>
		<div className='positron-assistant-chat-editor'>
			<div
				ref={editorRef}
				onInput={(e) => setInput(e.currentTarget.innerText.replace(/\n$/, ''))}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				className='editor-editable'
				contentEditable='true'
				translate='no'
				autoCapitalize='off'
				spellCheck='false'
				tabIndex={0}
				role='textbox'
			></div>
			{input === '' && <div className='positron-assistant-editor-placeholder'>
				{placeholderText}
			</div>}
		</div>
		<div className='chat-bottom-toolbar'>
			<DropDown
				className='positron-assistant-selector'
				contextMenuService={contextMenuService}
				items={positronAssistants}
				selected={props.assistant}
				onChange={(id) => props.setAssistant(id)}
			/>
			<button
				className='positron-assistant-chat-submit'
				onClick={(e) => handleSubmit()}
				aria-label='Chat'
				tabIndex={0}
			>&#8679;&#9166;&nbsp;chat</button>
		</div>
	</div>;
};
