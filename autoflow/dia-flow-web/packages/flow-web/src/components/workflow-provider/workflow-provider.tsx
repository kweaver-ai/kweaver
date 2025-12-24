import React from "react";
import { AuditPageTarget, WorkflowAuditStatus } from "./type";

export interface workflowProps {
    apply_id?: string;
    target?: AuditPageTarget;
    audit_status?: WorkflowAuditStatus;
    process?: any;
    apply_time?: string;
    data?: any;
}

export const WorkflowContext = React.createContext<workflowProps>({});

export const WorkflowProvider: React.FC<workflowProps> = ({
    apply_id,
    target,
    audit_status,
    process,
    apply_time,
    data,
    children,
}) => {
    return (
        <WorkflowContext.Provider
            value={{
                process,
                data,
                apply_id,
                target,
                audit_status,
                apply_time,
            }}
        >
            {children}
        </WorkflowContext.Provider>
    );
};
