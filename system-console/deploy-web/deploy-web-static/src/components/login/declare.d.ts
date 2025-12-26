import { ServiceInfo } from "../../api/deploy-manager/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";

export interface Props extends React.ClassAttributes<any> {
    /**
     * 路径
     */
    pathname: string;

    /**
     * 应用ip
     */
    appIp: string;

    /**
     * 语言
     */
    lang: string;

    /**
     * 域名
     */
    hostname: string;

    /**
     * oem配置
     */
    oemConfigs: OemConfigInfo;

    /**
     * 模块配置
     */
    moduleConfigs: any;
}
