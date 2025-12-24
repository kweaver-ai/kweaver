export interface Props {
    // 头部
    header: React.ReactNode;

    // 内容区
    content: React.ReactNode;

    // 底部
    footer: React.ReactNode | null;

    // 版本信息
    about: React.ReactNode;

    // 背景图片
    background?: string;

    // 字体类型
    fontStyle?: FontStyle | string;

    // 样式
    className?: string;

    // oauth2-ui登录框高度
    loginHeight?: number;
}
