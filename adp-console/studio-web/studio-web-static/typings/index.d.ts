declare module "@kweaver-ai/template" {
    const Template: any;
    export default Template;
}
declare module "rsa.min" {
    export class RSAKey {
        constructor();
        setPublic(n: string, e: string): void;
        encrypt(text: string): string;
        // 添加其他需要的方法和属性
    }

    export function hex2b64(hex: string): string;
}
declare module "@kweaver-ai/workshop-framework-studio" {
    export interface Config {
        /**
         * 导航
         */
        nav: {
            /**
             * logo(base64)
             */
            logo?: string;

            onLogoClick?: any;

            onBreadcrumbClick?: any;

            /**
             * logoSrc（图片src），不可同时存在
             */
            logoSrc?: string;

            /**
             * logo元素，不可同时存在
             */
            logoElement?: React.ReactElement;

            /**
             * 主题色
             */
            theme?: string;

            /**
             * 是否开启自定义主题色
             */
            customStyle?: boolean;

            /**
             * 账号
             */
            account?: AccountType;

            /**
             * 扩展元素
             */
            extraElements?: Array<ExtraElementsType>;

            /**
             * 导航信息
             */
            menu?: {
                /**
                 * 导航菜单数组
                 */
                items?: Array<MenuType>;

                /**
                 * 导航菜单函数，items 和 getItems 二选一
                 */
                getItems?: () => Array<MenuType>;

                /**
                 * 是否禁止调整菜单宽度，默认 false
                 */
                menuResizeDisabled?: boolean;

                /**
                 * 菜单是否收起，默认不收起
                 */
                defaultCollapsed?: boolean;

                /**
                 * 菜单展开、收起事件。collapsed - ture 收起；false 展开
                 */
                onCollapsedChange?: (collapsed: boolean) => void;

                /**
                 * 菜单宽度，默认220
                 */
                defaultMenuWidth?: number;

                /**
                 * 菜单宽度发生变化
                 */
                onMenuWidthChange?: (menuWidth: number) => void;

                /**
                 * 侧边栏相关方法
                 */
                sideBarMethods?: {
                    // 获取默认侧边栏配置
                    getDefaultSideBarConfig: () => object;
                    // 确认编辑侧边栏
                    editConfig: (payload: object) => void;
                    // 获取侧边栏配置
                    getSideBarConfig: () => object;
                };

                /**
                 * 菜单选中项发生变化
                 */
                onSelectedKeysChange?: (
                    keys: Array<string>,
                    updateRoute: (keys: Array<string>) => void,
                    toggleSideBarShow: (isShow: boolean) => void,
                    changeCustomPathComponent: (
                        customPathComponent: any
                    ) => void
                ) => void;

                /**
                 * 路由发生变化
                 */
                onPathChange?: (param: {
                    keys: Array<string>;
                    path: string;
                    isPathExist: boolean;
                }) => void;

                /**
                 * 自定义查看全部菜单的按钮
                 */
                viewAllIcon?: {
                    /**
                     * icon
                     */
                    icon: React.ReactElement;

                    /**
                     * label
                     */
                    label: string;

                    /**
                     * 内容
                     */
                    content:
                        | React.ReactElement
                        | ((props: Record<string, any>) => React.ReactElement);

                    /**
                     * 是否显示关闭按钮，默认false
                     */
                    closeIcon?: boolean;

                    /**
                     * 遮罩层的z-index，默认1
                     */
                    maskZIndex?: number;
                };
            };

            /**
             * 主题模式(深色 or 浅色)
             */
            themeMode?: ThemeModeType;

            /**
             * 顶栏样式
             */
            headBarStyle?: Record<string, any>;

            getHideSideBar?: () => boolean;

            // 切换侧边栏显隐
            toggleSideBarShow?: any;

            // 修改顶部栏自定义路径
            changeCustomPathComponent?: any;

            /**
             * 路由模式，默认browser
             */
            routerMode?: RouterMode;

            /**
             * 基准url，browser路由时可传递
             */
            routerBasename?: string;

            /**
             * path匹配模式
             */
            pathMatchMode?: PathMatchMode;

            /**
             * 无导航时的内容, menus和MainContentComponent有且只有一个存在
             */
            MainContentComponent?: (
                props: Record<string, any>
            ) => React.ReactElement;

            /**
             * 语言环境：中文、繁体、英文（默认中文）
             */
            locale?: Locale;

            // 菜单自定义组件
            CustomComponent?: React.ReactElement;

            // 所属业务域
            businessDomainText?: string;
        };

        /**
         * 传递给内容页（子应用 or 主应用的组件）的信息,
         * 比如语言，主题色等等
         */
        appProps?: Record<string, any>;

        /**
         * 微应用的配置信息，比如{ sandbox: xxx }
         */
        microfrontedConfiguration?: Record<string, any>;

        /**
         * 微应用的加载模式
         */
        microfrontedLoadingMode?: MicrofrontedLoadingMode;
    }

    export interface MenuType {
        /**
         * key
         */
        key: string;

        /**
         * 内容
         */
        label: React.ReactNode;

        /**
         * 设置收缩时展示的悬浮标题
         */
        title?: string;

        /**
         * icon
         */
        icon?: React.ReactElement;

        /**
         * 路由
         */
        path?: string;

        /**
         * 子应用或者主应用组件
         */
        app?: AppType;

        /**
         * 路由数组（when 一个菜单对应多个路由）
         */
        paths?: Array<string>;

        /**
         * 子应用或者主应用组件数组（when 一个菜单对应多个路由），和paths一一对应
         */
        apps?: Array<AppType>;

        /**
         * 和path一起使用，代表path是否在菜单中。默认true。
         */
        isInMenu?: boolean;

        /**
         * 当前页的样式，和path、app一起的
         */
        style?: Record<string, any>;

        /**
         * 子项。当path、app存在时，没有子项.
         */
        children?: Array<MenuType>;
    }
}
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.bmp";
declare module "*.gif";
declare module "*.avif";

declare module "*.svg" {
    export const ReactComponent: React.FunctionComponent<
        React.SVGAttributes<SVGElement>
    >;
}

declare module "*.sass" {
    const content: Record<string, string>;
    export default content;
}

declare module "*.scss" {
    const content: Record<string, string>;
    export default content;
}

declare module "*.less" {
    const content: Record<string, string>;
    export default content;
}

declare module "*.css" {
    const content: Record<string, string>;
    export default content;
}
