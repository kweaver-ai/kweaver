/**
 * 服务信息信息
 */
export interface ServiceInfo {
    /**
     * 可用的包名
     */
    available_package: string;
    /**
     * 可获用的版本
     */
    available_version: string;
    /**
     * 已安装的包名
     */
    install_package: string;
    /**
     * 已安装的包名
     */
    installed_package: string;
    /**
     * 已安装的版本
     */
    installed_version: string;
    /**
     * 已安装的微服务 列表
     */
    installed_micro_services: Array<string> | [];
    /**
     * 微服务 列表
     */
    micro_services: Array<string> | [];
    /**
     * 集群节点列表
     */
    nodes: Array<string> | [];
    /**
     * 集群副本数
     */
    replicas: number;
    /**
     *
     */
    require: boolean;
    /**
     * 服务名称
     */
    service_name: string;
    /**
     * 第三方依赖 列表
     */
    third_app_service: Array<string> | [];
}

/**
 * 连接信息
 */
interface AccessAddress {
    /**
     * 主机地址
     */
    host: string;
    /**
     * 端口
     */
    port: string;
    /**
     * 前缀
     */
    path: string;
    /**
     * 协议
     */
    scheme: string;
}
