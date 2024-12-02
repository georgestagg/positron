/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	IReactComponentContainer,
	ISize,
	PositronReactRenderer,
} from 'vs/base/browser/positronReactRenderer';
import { Emitter, Event } from 'vs/base/common/event';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IHoverService } from 'vs/platform/hover/browser/hover';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IViewPaneOptions } from 'vs/workbench/browser/parts/views/viewPane';
import { PositronViewPane } from 'vs/workbench/browser/positronViewPane/positronViewPane';
import { IViewDescriptorService } from 'vs/workbench/common/views';
import * as DOM from 'vs/base/browser/dom';
import * as React from 'react';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { PositronAssistant } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistant';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { IPositronAssistantService } from 'vs/workbench/services/positronAssistant/browser/interfaces/positronAssistantService';
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences';

export class PositronAssistantView
	extends PositronViewPane
	implements IReactComponentContainer {

	private onSizeChangedEmitter = this._register(new Emitter<ISize>());
	private onVisibilityChangedEmitter = this._register(new Emitter<boolean>());
	private onSaveScrollPositionEmitter = this._register(new Emitter<void>());
	private onRestoreScrollPositionEmitter = this._register(new Emitter<void>());
	private onFocusedEmitter = this._register(new Emitter<void>());

	private positronAssistantContainer!: HTMLElement;
	private positronReactRenderer?: PositronReactRenderer;

	onFocused: Event<void> = this.onFocusedEmitter.event;
	onSizeChanged: Event<ISize> = this.onSizeChangedEmitter.event;
	onVisibilityChanged: Event<boolean> = this.onVisibilityChangedEmitter.event;
	onSaveScrollPosition: Event<void> = this.onSaveScrollPositionEmitter.event;
	onRestoreScrollPosition: Event<void> =
		this.onRestoreScrollPositionEmitter.event;

	private _width = 0;
	private _height = 0;

	get height() {
		return this._height;
	}

	get width() {
		return this._width;
	}

	get containerVisible() {
		return false;
	}

	takeFocus() {
		this.focus();
	}

	constructor(
		options: IViewPaneOptions,
		@IClipboardService private readonly clipboardService: IClipboardService,
		@ICommandService private readonly commandService: ICommandService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IEditorService private readonly editorService: IEditorService,
		@IHoverService hoverService: IHoverService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IKeybindingService keybindingService: IKeybindingService,
		@ILanguageService private readonly languageService: ILanguageService,
		@ILayoutService private readonly layoutService: ILayoutService,
		@INotificationService private readonly notificationService: INotificationService,
		@IOpenerService openerService: IOpenerService,
		@IPositronAssistantService private readonly assistantService: IPositronAssistantService,
		@IPreferencesService private readonly preferencesService: IPreferencesService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
	) {
		super(
			options,
			keybindingService,
			contextMenuService,
			configurationService,
			contextKeyService,
			viewDescriptorService,
			instantiationService,
			openerService,
			themeService,
			telemetryService,
			hoverService
		);

		this._register(this.onDidChangeBodyVisibility(visible => {
			if (!visible) {
				this.onSaveScrollPositionEmitter.fire();
			} else {
				this.onRestoreScrollPositionEmitter.fire();
			}
			this.onVisibilityChangedEmitter.fire(visible);
		}));
	}

	protected override renderBody(container: HTMLElement): void {
		// Call the base class's method.
		super.renderBody(container);

		this.positronAssistantContainer = DOM.$('.positron-assistant-container');
		container.appendChild(this.positronAssistantContainer);

		// Create the PositronReactRenderer for the PositronAssistant component and render it.
		this.positronReactRenderer = new PositronReactRenderer(this.positronAssistantContainer);
		this._register(this.positronReactRenderer);
		this.positronReactRenderer.render(
			<PositronAssistant
				assistantService={this.assistantService}
				clipboardService={this.clipboardService}
				commandService={this.commandService}
				configurationService={this.configurationService}
				contextKeyService={this.contextKeyService}
				contextMenuService={this.contextMenuService}
				editorService={this.editorService}
				hoverService={this.hoverService}
				keybindingService={this.keybindingService}
				languageService={this.languageService}
				layoutService={this.layoutService}
				notificationService={this.notificationService}
				openerService={this.openerService}
				preferencesService={this.preferencesService}
				reactComponentContainer={this}
			/>
		);
	}

	protected override layoutBody(height: number, width: number): void {
		// Call the base class's method.
		super.layoutBody(height, width);

		// Set the width and height.
		this._width = width;
		this._height = height;

		// Raise the onSizeChanged event.
		this.onSizeChangedEmitter.fire({
			width,
			height
		});
	}
}

