namespace DataConnectType {
  export interface BinData {
    catalog_name?: string; // 数据源catalog名称，除excel, tingyun, anyshare7外
    data_view_source?: string; // 数据视图源，除excel, tingyun, anyshare7外
    database_name?: string; // 数据库名称，除excel, tingyun, anyshare7外
    connect_protocol: string; // 连接方式，当前支持 http (tingyun) https (excel, tingyun, anyshare7)
    //  thrift (hive) jdbc (除excel, tingyun, anyshare7外)
    schema?: string; // 数据库模式，主要针对数据源opengauss, gaussdb, postgresql, oracle, sqlserver, holodesk, kingbase
    host: string; // 地址
    port: number; // 端口
    account?: string; // 除inceptor数据源外必传，excel, anyshare7数据源应用账户id，tingyun数据源为用户名，其他数据源为用户名
    password?: string; // 密码，除inceptor数据源外必传
    token?: string; // token认证，当前仅inceptor数据源使用，和account/password 二选一认证
    storage_protocol?: string; // 存储介质，当前仅excel数据源使用
    storage_base?: string; // 存储路径，当前仅excel，anyshare7数据源使用
    replica_set?: string; // 副本集名称，仅副本集模式部署的Mongo数据源使用
  }

  export interface Data {
    id: string;
    name: string; // 数据源名称
    type: string; // 数据源类型，支持：oracle, postgresql, doris, sqlserver, hive, clickhouse,
    // mysql, maria, mongodb, dameng, holodesk, gaussdb, excel, opengauss, inceptorJdbc, kingbase, tingyun, anyshare7
    bin_data: BinData; // 数据源连接信息
    comment?: string; // 描述
    created_by_uid: string; // 创建人id
    created_by_username: string; // 创建人名称
    created_at: number; // 创建时间
    updated_at: number; // 更新时间
    updated_by_uid: string; // 修改人id
    updated_by_username: string; // 修改人名称
    allow_multi_table_scan: boolean; // 是否支持多表扫描
    is_built_in: boolean; // 是否内置数据源
    auth_method?: number; // 认证方式
    deploy_method?: number; // 部署方式
    operations?: string[]; // 操作权限，当前支持：view, edit, export, delete
    title: string; // 数据源分类名称
    icon: any; // 数据源分类图标
    key: string;
    paramType: string;
    isLeaf: true;
    deployMethod?: number;
    authMethod?: number;
    children?: Data[];
    metadata_obtain_level: number; // 元数据获取级别：1-支持数据源扫描和多表扫描，2-支持数据源不支持多表扫描，3-不支持扫描支持新增元数据，4-不支持扫描和新增元数据
  }

  export interface List {
    entries: Data[];
    total_count: number;
  }

  export interface Connectors {
    connectors: Connector[]; // 连接器数组
  }

  export interface Connector {
    connect_protocol: string; // 连接方式，多种以逗号分隔，当前支持 http (tingyun) https
    //  (excel, tingyun, anyshare7) thrift (hive) jdbc (除excel, tingyun, anyshare7外)
    olk_connector_name: string; // 原始数据源类型名称
    show_connector_name: string; // 显示数据源类型名称
    type: string; // 数据源分类，SQL、NoSQL、Files、BigData、Platforms
  }
}

export default DataConnectType;
