export interface Props extends React.ClassAttributes<void> {
    // 语言
    lang: string;

    loginHeight?: number;
}

export interface State {
    // logo
    logo: string;

    // 显示图片还是iframe
    loginError: string;

    iframeVisible: boolean;
}
