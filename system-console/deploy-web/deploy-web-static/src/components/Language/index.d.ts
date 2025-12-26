export interface Props extends React.ClassAttributes<void> {
    /**
     * 是否是登录页
     */
    indexView?: boolean;

    //是否为初始化主模块页面
    isInstallMainModule?: boolean;

    //模块配置
    moduleConfigs: any;
}

export interface State {
    /**
     * 语言菜单项
     */
    languageList: ReadonlyArray<any>;

    /**
     * 当前语言
     */
    currentLang: string;
}
