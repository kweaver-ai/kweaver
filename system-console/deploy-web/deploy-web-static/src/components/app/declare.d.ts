import { UserInfo } from "../../api/oauth/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { ServiceInfo } from "../../api/deploy-manager/declare";
import { Domain } from "../../core/workshop-framework/declare";
import {
    Config as WorkShopFrameWorkConfig,
    Locale,
} from "@kweaver-ai/workshop-framework-system";

export interface Props extends React.ClassAttributes<any> {
    /**
     * 语言
     */
    lang: Locale;
    /**
     * 域信息
     */
    domain: Domain;
    /**
     * 用户信息
     */
    userInfo: UserInfo;
    /**
     * oem配置
     */
    oemConfig: OemConfigInfo;
    /**
     * 默认app配置
     */
    defaultAppConfig: WorkShopFrameWorkConfig;
    /**
     * 模块配置
     */
    moduleConfigs: any;
    /**
     * 新的侧边栏
     */
    menusItems: any;
    /**
     *
     */
    item: any;
    /**
     * 前缀
     */
    prefix: string;
}
