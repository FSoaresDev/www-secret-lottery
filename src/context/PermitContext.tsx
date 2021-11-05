import React, { useState, createContext } from "react";

export const PermitContext = createContext<any>(null);
export const PermitDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [PermitState, setPermitState] = useState<any>(null)

    return (
        <PermitContext.Provider value={PermitState}>
            <PermitDispatchContext.Provider value={setPermitState}>
                {props.children}
            </PermitDispatchContext.Provider>
        </PermitContext.Provider>
    );
}