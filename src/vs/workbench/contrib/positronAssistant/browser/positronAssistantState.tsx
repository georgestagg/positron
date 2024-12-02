/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useMemo, useState } from 'react';  // eslint-disable-line no-duplicate-imports
import { DisposableStore } from 'vs/base/common/lifecycle';
import { IReactComponentContainer } from 'vs/base/browser/positronReactRenderer';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IHoverService } from 'vs/platform/hover/browser/hover';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { PositronAssistantMarkdownRenderer } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantMarkdownRenderer';
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences';

export interface PositronAssistantServices {
	readonly assistantService: IPositronAssistantService;
	readonly clipboardService: IClipboardService;
	readonly commandService: ICommandService;
	readonly configurationService: IConfigurationService;
	readonly contextKeyService: IContextKeyService;
	readonly contextMenuService: IContextMenuService;
	readonly editorService: IEditorService;
	readonly hoverService: IHoverService;
	readonly keybindingService: IKeybindingService;
	readonly languageService: ILanguageService;
	readonly layoutService: ILayoutService;
	readonly notificationService: INotificationService;
	readonly openerService: IOpenerService;
	readonly preferencesService: IPreferencesService;
	readonly reactComponentContainer: IReactComponentContainer;
}

export interface PositronAssistantState extends PositronAssistantServices {
	readonly markdownRenderer: PositronAssistantMarkdownRenderer;
	readonly availableAssistants: Map<string, string>;
	readonly selectedAssistant: string | null;
}

/**
 * The usePositronAssistantState custom hook.
 * @returns The hook.
 */
export const usePositronAssistantState = (services: PositronAssistantServices): PositronAssistantState => {
	const [selectedAssistant, setSelectedAssistant] = useState<string | null>(
		services.assistantService.selectedAssistant
	);
	const [availableAssistants, setAvailableAssistants] = useState<Map<string, string>>(
		services.assistantService.registeredAssistants
	);

	// Create a Markdown renderer that can be accessed through the PositronAssistant context
	const markdownRenderer = useMemo(() => {
		return new PositronAssistantMarkdownRenderer(
			undefined,
			services.languageService,
			services.openerService
		);
	}, [services]);

	// Add event handlers
	useEffect(() => {
		const disposableStore = new DisposableStore();

		// Update the list of assistants as extensions are loaded
		disposableStore.add(services.assistantService.onDidRegisterAssistant(() => {
			setAvailableAssistants(services.assistantService.registeredAssistants);
		}));

		// Update the selected assistant
		disposableStore.add(services.assistantService.onDidSelectAssistant(() => {
			setSelectedAssistant(services.assistantService.selectedAssistant);
		}));

		return () => disposableStore.dispose();
	}, [services.assistantService]);

	return {
		...services,
		markdownRenderer,
		availableAssistants,
		selectedAssistant,
	};
};
