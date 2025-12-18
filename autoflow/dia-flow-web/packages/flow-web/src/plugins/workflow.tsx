import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "../public-path";
import "../element-scroll-polyfill";
import "../crypto-polyfill";
import { enableES5 } from "immer";
import ReactDOM from "react-dom";
import { MicroAppProvider } from "@applet/common";
import "@applet/common/es/style";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import enUS from "../locales/en-us.json";
import viVN from "../locales/vi-vn.json";
import "../index.less";
import { message } from "antd";
// @ts-ignore
import { apis } from "@dip/components";
import "@dip/components/dist/dip-components.full.css";
import App from "../App";
enableES5();

const translations = {
  "zh-cn": zhCN,
  "zh-tw": zhTW,
  "en-us": enUS,
  "vi-vn": viVN,
};

function render(props?: any) {
  const microWidgetProps = props?.microWidgetProps
    ? props?.microWidgetProps
    : props;

  message.config({
    getContainer: () => props?.container || document.body,
  });

  const getToken = () => microWidgetProps?.token?.getToken?.access_token;

  apis.setup({
    protocol: microWidgetProps?.config?.systemInfo?.location?.protocol,
    host: microWidgetProps?.config?.systemInfo?.location?.hostname,
    port: microWidgetProps?.config?.systemInfo?.location?.port || 443,
    lang: microWidgetProps?.lang,
    getToken,
    prefix: microWidgetProps?.prefix,
    theme: microWidgetProps?.theme || "#126ee3",
    popupContainer: microWidgetProps?.container,
    refreshToken: microWidgetProps?.token?.refreshOauth2Token,
    onTokenExpired: microWidgetProps?.token?.onTokenExpired,
  });

  ReactDOM.render(
        <MicroAppProvider
            microWidgetProps={microWidgetProps}
            container={props?.container || document.body}
            translations={translations}
            prefixCls={ANT_PREFIX}
            iconPrefixCls={ANT_ICON_PREFIX}
            // platform="dataflow"
        >
            <App />
        </MicroAppProvider>,
    (props?.container || document.body).querySelector(
      "#content-automation-root"
    )
  );
}

export async function bootstrap() {}

export async function mount(props: any = {}) {
  render(props);
}

export async function unmount({ container = document } = {}) {
  ReactDOM.unmountComponentAtNode(
    container.querySelector("#content-automation-root")!
  );
}

export async function update(props: any = {}) {
  ReactDOM.unmountComponentAtNode(
    (props?.container || document.body)?.querySelector(
      "#content-automation-root"
    )
  );
  render(props);
}

export const lifecycle = {
  bootstrap,
  mount,
  unmount,
  update,
};

if ((window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__ == null) {
  render();
}
