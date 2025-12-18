export interface IntelliinfoPutOut {
    graph_id: number,
    entities: readonly {
        action: string,
        name: string,
        fields: readonly PropertyFieldOut[]
    }[],
    edges: readonly EdgeFieldOut[]
}

export interface Intelliinfo {
    action: string,
    graph_id: number,
    entities: readonly {
        entity: string,
        property: readonly { name: string, value: string }[]
        edges: readonly { edge: string, name: string, value: string }[]
    }[]
}

export interface EdgeFieldOut {
    key: string,
    type: string,
    value: string,
    name: string,
    entity: string
}

export interface PropertyFieldOut {
    key: string,
    type: string,
    value: string
}

export enum DbAction {
    Upsert = 'upsert',
    Delete = 'delete'
}
export enum SyncModeType {
    Full = 'full',
    Incremental = 'incremental'
}