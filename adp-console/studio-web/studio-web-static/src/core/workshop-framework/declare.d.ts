import { RegistrableApp, AppMetadata, ObjectType } from "qiankun";

/**
 * 域信息
 */
export type Domain = {
    /**
     * 协议信息
     */
    protocol: string;
    /**
     * 主机信息
     */
    host: string;
    /**
     * 端口信息
     */
    port: string | number;
};

// 需要检查安装的服务
export const InstalledServices = {
    SuperAgent: "super_agent",
};

// registry-info接口中只用于检查服务是否安装成功，控制侧边栏显隐
export const registryCheckSubappNames = [InstalledServices.SuperAgent];
