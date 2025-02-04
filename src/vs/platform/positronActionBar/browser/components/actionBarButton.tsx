/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2022-2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

// CSS.
import './actionBarButton.css';

// React.
import React, { useRef, PropsWithChildren, useImperativeHandle, forwardRef } from 'react';

// Other dependencies.
import { usePositronActionBarContext } from '../positronActionBarContext.js';
import { Button, MouseTrigger } from '../../../../base/browser/ui/positronComponents/button/button.js';
import { optionalBoolean, optionalValue, positronClassNames } from '../../../../base/common/positronUtilities.js';

/**
 * ActionBarButtonProps interface.
 */
export interface ActionBarButtonProps {
	readonly fadeIn?: boolean;
	readonly iconId?: string;
	readonly iconFontSize?: number;
	readonly text?: string;
	readonly maxTextWidth?: number;
	readonly align?: 'left' | 'right';
	readonly tooltip?: string | (() => string | undefined);
	readonly dropdownTooltip?: string | (() => string | undefined);
	readonly checked?: boolean;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly dropdownAriaLabel?: string;
	readonly dropdownIndicator?: 'disabled' | 'enabled' | 'enabled-split';
	readonly mouseTrigger?: MouseTrigger;
	readonly onMouseEnter?: () => void;
	readonly onMouseLeave?: () => void;
	readonly onPressed?: () => void;
	readonly onDropdownPressed?: () => void;
}

/**
 * ActionBarButton component.
 * @param props A PropsWithChildren<ActionBarButtonProps> that contains the component properties.
 * @param ref A ref to the HTMLButtonElement.
 * @returns The rendered component.
 */
export const ActionBarButton = forwardRef<
	HTMLButtonElement,
	PropsWithChildren<ActionBarButtonProps>
>((props, ref) => {
	// Context hooks.
	const context = usePositronActionBarContext();

	// Reference hooks.
	const buttonRef = useRef<HTMLButtonElement>(undefined!);
	const dropdownButtonRef = useRef<HTMLButtonElement>(undefined!);

	// Imperative handle to ref.
	useImperativeHandle(ref, () => props.dropdownIndicator === 'enabled-split' ?
		dropdownButtonRef.current : buttonRef.current
	);

	// Create the icon style.
	let iconStyle: React.CSSProperties = {};
	if (props.iconId && props.iconFontSize) {
		iconStyle = { ...iconStyle, fontSize: props.iconFontSize };
	}

	// Aria-hide the inner elements and promote the button text to an aria-label in order to
	// avoid VoiceOver treating buttons as groups. See VSCode issue for more:
	// https://github.com/microsoft/vscode/issues/181739#issuecomment-1779701917
	const ariaLabel = props.ariaLabel ? props.ariaLabel : props.text;

	/**
	 * ActionBarButtonFace component.
	 * @returns The rendered component.
	 */
	const ActionBarButtonFace = () => {
		return (
			<div className='action-bar-button-face' aria-hidden='true'>
				{props.iconId && (
					<div
						className={positronClassNames(
							'action-bar-button-icon',
							props.dropdownIndicator,
							'codicon',
							`codicon-${props.iconId}`
						)}
						style={iconStyle}
					/>
				)}
				{props.text && (
					<div
						className='action-bar-button-text'
						style={{
							marginLeft: props.iconId ? 0 : 4,
							maxWidth: optionalValue(props.maxTextWidth, 'none')
						}}
					>
						{props.text}
					</div>
				)}
				{props.dropdownIndicator === 'enabled' && (
					<div className='action-bar-button-drop-down-container'>
						<div className='action-bar-button-drop-down-arrow codicon codicon-positron-drop-down-arrow' />
					</div>
				)}
			</div>
		);
	};

	// Render.
	if (props.dropdownIndicator !== 'enabled-split') {
		return (
			<Button
				ref={buttonRef}
				hoverManager={context.hoverManager}
				className={positronClassNames(
					'action-bar-button',
					{ 'fade-in': optionalBoolean(props.fadeIn) },
					{ 'checked': optionalBoolean(props.checked) }
				)}
				ariaLabel={ariaLabel}
				tooltip={props.tooltip}
				disabled={props.disabled}
				mouseTrigger={props.mouseTrigger}
				onMouseEnter={props.onMouseEnter}
				onMouseLeave={props.onMouseLeave}
				onPressed={props.onPressed}
			>
				<ActionBarButtonFace />
				{props.children}
			</Button>
		);
	} else {
		return (
			<div className={positronClassNames(
				'action-bar-button',
				{ 'fade-in': optionalBoolean(props.fadeIn) },
				{ 'checked': optionalBoolean(props.checked) }
			)}>
				<Button
					ref={buttonRef}
					hoverManager={context.hoverManager}
					className='action-bar-button-action-button'
					ariaLabel={ariaLabel}
					tooltip={props.tooltip}
					disabled={props.disabled}
					mouseTrigger={props.mouseTrigger}
					onMouseEnter={props.onMouseEnter}
					onMouseLeave={props.onMouseLeave}
					onPressed={props.onPressed}
				>
					<ActionBarButtonFace />
				</Button>
				<Button
					ref={dropdownButtonRef}
					hoverManager={context.hoverManager}
					className='action-bar-button-drop-down-button'
					ariaLabel={props.dropdownAriaLabel}
					tooltip={props.dropdownTooltip}
					mouseTrigger={MouseTrigger.MouseDown}
					onPressed={props.onDropdownPressed}
				>
					<div className='action-bar-button-drop-down-arrow codicon codicon-positron-drop-down-arrow' />
				</Button>
				{props.children}
			</div>
		);
	}
});

// Set the display name.
ActionBarButton.displayName = 'ActionBarButton';
