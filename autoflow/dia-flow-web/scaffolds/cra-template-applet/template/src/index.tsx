import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "./public-path";
import "@applet/common/es/style";
import ReactDOM from "react-dom";
import App from "./App";
import { MicroAppProvider } from "@applet/common";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
};

function render({ container = document.body, microWidgetProps = {} } = {}) {
    ReactDOM.render(
        <MicroAppProvider
            microWidgetProps={microWidgetProps}
            container={container}
            translations={translations}
            prefixCls={ANT_PREFIX}
            iconPrefixCls={ANT_ICON_PREFIX}
        >
            <App />
        </MicroAppProvider>,
        container.querySelector("#root")
    );
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
    render();
}

export async function bootstrap() {}

export async function mount(props = {}) {
    render(props);
}

export async function unmount({ container = document } = {}) {
    ReactDOM.unmountComponentAtNode(container.querySelector("#root")!);
}
