export interface Props extends React.ClassAttributes<void> {
    // 语言
    lang: string;

    // oauth2-ui的登录框最小高度
    loginHeight: number;
}

export interface State {
    // logo
    logo: string;

    // 显示图片还是iframe
    loginError: string;
}
