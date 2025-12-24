import { RegistrableApp, AppMetadata, ObjectType } from "qiankun";

export type AppInfo = {
    // 路由
    pathname: string;
    // 中文翻译
    textZHCN: string;
    // 繁体翻译
    textZHTW: string;
    // 英文翻译
    textENUS: string;
    // 图标
    icon: string;
    // 打开方式
    openMethod?: OpenMethod;
    // 自定义显隐
    customVisible?: boolean;
    // 菜单类型
    type?: string;
    // 是否默认展开（仅在菜单项type为dictionary时生效）
    isDefaultOpen?: boolean;
};

export type SubApp = AppMetadata & {
    // 触发规则
    activeRule?: string;
    // 基础路由
    baseRouter?: string;
    // 子应用信息
    children: Children;
} & ObjectType;

export interface RegistryInfo {
    // 子应用唯一标识
    name: string;
    // 子应用的上层目录
    parent: string;
    // 子应用侧边栏显示顺序
    orderIndex: number;
    // 主应用信息
    app: AppInfo;
    // 子应用信息
    subapp: SubApp;
    // 是否显示在首页导航条底部
    bottom?: boolean;
    // 顶级操作页面对象tag
    pageTag?: string;
}

export interface Children {
    [key: string]: RegistryInfo;
}

export enum OpenMethod {
    Self = "self",
    Blank = "blank",
}
