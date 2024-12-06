/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { MarkdownRenderOptions, MarkedOptions } from 'vs/base/browser/markdownRenderer';
import { IMarkdownString } from 'vs/base/common/htmlContent';
import { isCodeEditor } from 'vs/editor/browser/editorBrowser';
import { IMarkdownRendererOptions, IMarkdownRenderResult, MarkdownRenderer } from 'vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';

export class PositronAssistantMarkdownRenderer extends MarkdownRenderer {
	constructor(
		options: IMarkdownRendererOptions | undefined,
		@ILanguageService languageService: ILanguageService,
		@IOpenerService openerService: IOpenerService,
		@IClipboardService private readonly clipboardService: IClipboardService,
		@IEditorService private readonly editorService: IEditorService,

	) {
		super(options ?? {}, languageService, openerService);
	}

	addPositronAssistantCodeblockActions(parent: HTMLElement, codeblock: HTMLElement) {
		// Create container
		const actionsDiv = document.createElement('div');
		actionsDiv.className = 'code-actions';

		// Copy contents of codeblock as text to clipboard
		const handleCopy = (content: string) => {
			this.clipboardService.writeText(content);
		};

		// Copy contents of codeblock as text to active editor
		const handleInsert = (content: string) => {
			const activeEditorPane = this.editorService.activeEditorPane;
			if (!activeEditorPane) {
				return;
			}

			const textEditor = activeEditorPane.getControl();
			if (textEditor && isCodeEditor(textEditor)) {
				const selection = textEditor.getSelection();
				if (!selection) {
					return;
				}

				textEditor.executeEdits('source', [{
					range: selection,
					text: content,
					forceMoveMarkers: true
				}]);

				const position = selection.getEndPosition();
				textEditor.setPosition(position);
			}
		};


		// Create copy button
		const copyButton = document.createElement('button');
		const copyIcon = document.createElement('i');
		copyIcon.className = 'codicon codicon-copy';
		copyButton.appendChild(copyIcon);
		copyButton.onclick = () => handleCopy(codeblock.innerText);

		// Create insert button
		const insertButton = document.createElement('button');
		const insertIcon = document.createElement('i');
		insertIcon.className = 'codicon codicon-insert';
		insertButton.appendChild(insertIcon);
		insertButton.onclick = () => handleInsert(codeblock.innerText);

		// Add buttons to container
		actionsDiv.appendChild(copyButton);
		actionsDiv.appendChild(insertButton);

		parent.insertBefore(actionsDiv, codeblock);
	}

	override render(markdown: IMarkdownString, options?: MarkdownRenderOptions, markedOptions?: MarkedOptions): IMarkdownRenderResult {
		const renderResult = super.render(markdown, options, markedOptions);

		// For each codeblock in the resulting markdown render, add action buttons
		const codeDivs = renderResult.element.querySelectorAll('div[data-code]') as NodeListOf<HTMLElement>;
		codeDivs.forEach(div => this.addPositronAssistantCodeblockActions(renderResult.element, div));

		return renderResult;
	}
}
