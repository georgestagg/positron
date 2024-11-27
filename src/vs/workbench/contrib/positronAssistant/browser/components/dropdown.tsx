/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./dropdown';
import React, { useRef } from 'react';
import { Action, IAction } from 'vs/base/common/actions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';

/**
 * Dropdown interface.
 */
export interface DropdownProps {
	contextMenuService: IContextMenuService;
	items: Map<string, string>;
	onChange: (id: string) => void;
	selected?: string;
	className?: string;
}

/**
 * DropDown component.
 * @param props A DropdownProps that contains the component properties.
 * @returns The rendered component.
 */
export const DropDown = (props: DropdownProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const items = Array.from(props.items.entries());
	const itemLabel = props.selected ? props.items.get(props.selected) : undefined;

	const actions: IAction[] = items.map(([id, label]) => {
		return new Action(id, label, undefined, true, () => {
			props.onChange(id);
		});
	});

	const handleClick = () => {
		const div = ref.current;
		if (div) {
			props.contextMenuService.showContextMenu({
				getAnchor: () => div,
				getActions: () => actions,
			});
		}
	};
	return <div className={`positron-dropdown ${props.className}`} onClick={handleClick}>
		<div ref={ref} />
		{props.selected && <div
			key={props.selected}
			className='positron-dropdown-label'
		>{itemLabel}</div>}
		<div className='codicon codicon-positron-drop-down-arrow'></div>
	</div>;
};
