import React from "react";

export interface PolicyParam {
    forbidForm?: boolean;
}

export const PolicyContext = React.createContext<PolicyParam>({
    forbidForm: false,
});