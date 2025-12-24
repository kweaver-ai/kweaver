import { IStep } from "../editor/expr";

export interface FlowDetail {
    id?: string,
    title?: string,
    steps?: IStep[],
    trigger_config?: any,
}

export interface ICreateParams {
    title: string;
    description: string;
    steps?: IStep[];
}

export interface IDataFlowDesignerProps {
    value: ICreateParams;
}

export enum TriggerType {
    CRON = 'cron',
    MANUALLY = 'manually',
    EVENT = 'event',
}

export interface ITaskItem {
    title: string;
    trigger: TriggerType;
    updated_at: string;
    status: string;
    id: string;
}

export interface IOriginal {
    id: string;
    name: string;
}

export interface IUser {
    id: string;
    name: string;
    type: number;  // 0 表示部门
    original?: IOriginal;
}

export interface ITrigger {
    operator: string;
    dataSource: {
        operator: string;
        parameters: {
            docids: string[];
            depth: number;
        }
    }
    cron: string;
    [key: string]: any;
}

export interface IDagParams {
    title: string;
    status?: string;
    trigger?: ITrigger;
    steps: IStep[];
}

export interface ITaskParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    type?: string;
    title?: string;
    trigger_type?: string;
}
