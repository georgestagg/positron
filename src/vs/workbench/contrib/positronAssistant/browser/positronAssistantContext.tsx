/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { PropsWithChildren, createContext, useContext } from 'react';
import { PositronAssistantServices, PositronAssistantState, usePositronAssistantState } from 'vs/workbench/contrib/positronAssistant/browser/positronAssistantState';

const PositronAssistantContext = createContext<PositronAssistantState>(undefined!);

export const PositronAssistantContextProvider = (
	props: PropsWithChildren<PositronAssistantServices>
) => {
	const positronAssistantState = usePositronAssistantState(props);

	return (
		<PositronAssistantContext.Provider value={positronAssistantState}>
			{props.children}
		</PositronAssistantContext.Provider>
	);
};

export const usePositronAssistantContext = () => useContext(PositronAssistantContext);
