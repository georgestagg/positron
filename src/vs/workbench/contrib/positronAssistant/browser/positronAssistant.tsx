/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect } from 'react';
import 'vs/css!./positronAssistant';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { PositronAssistantContextProvider } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantContext';
import { ChatSession } from 'vs/workbench/contrib/positronAssistant/browser/components/chatSession';
import { IReactComponentContainer } from 'vs/base/browser/positronReactRenderer';
import { PositronAssistantServices } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantState';
import { ActionBars } from 'vs/workbench/contrib/positronAssistant/browser/components/actionBars';

export interface PositronAssistantProps extends PositronAssistantServices {
	readonly reactComponentContainer: IReactComponentContainer;
}

export const PositronAssistant = (props: React.PropsWithChildren<PositronAssistantProps>) => {

	// Stubs for propagating height and width to the React component.
	const [width, setWidth] = React.useState(props.reactComponentContainer.width);
	const [height, setHeight] = React.useState(props.reactComponentContainer.height);

	useEffect(() => {
		const disposableStore = new DisposableStore();
		disposableStore.add(props.reactComponentContainer.onSizeChanged(size => {
			setWidth(size.width);
			setHeight(size.height);
		}));
		return () => disposableStore.dispose();
	}, [props.reactComponentContainer]);

	return (
		<div style={{ width: `${width}px`, height: `${height}px` }} className='positron-assistant'>
			<PositronAssistantContextProvider {...props}>
				<ActionBars {...props} />
				<ChatSession></ChatSession>
			</PositronAssistantContextProvider>
		</div>
	);
};
