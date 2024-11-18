/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { MarkdownRenderOptions, MarkedOptions } from 'vs/base/browser/markdownRenderer';
import { IMarkdownString } from 'vs/base/common/htmlContent';
import { IMarkdownRendererOptions, IMarkdownRenderResult, MarkdownRenderer } from 'vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { IOpenerService } from 'vs/platform/opener/common/opener';

export class PositronAssistantMarkdownRenderer extends MarkdownRenderer {
	constructor(
		options: IMarkdownRendererOptions | undefined,
		@ILanguageService languageService: ILanguageService,
		@IOpenerService openerService: IOpenerService,
	) {
		super(options ?? {}, languageService, openerService);
	}
	override render(markdown: IMarkdownString, options?: MarkdownRenderOptions, markedOptions?: MarkedOptions): IMarkdownRenderResult {
		return super.render(markdown, options, markedOptions);
	}
}
