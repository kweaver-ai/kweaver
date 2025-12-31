import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "../public-path";
import "../element-scroll-polyfill";
import "../crypto-polyfill";
import { enableES5 } from "immer";
import ReactDOM from "react-dom";
import { MicroAppProvider } from "@applet/common";
import "@applet/common/es/style";
import { message } from "antd";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import enUS from "../locales/en-us.json";
import viVN from "../locales/vi-vn.json";
import "../index.less";
import { OemConfigProvider } from "../components/oem-provider";
import { Routes, Route } from "react-router";
import { BrowserRouter } from "react-router-dom";
// @ts-ignore
import { apis } from "@dip/components";
import "@dip/components/dist/dip-components.full.css";
import { ExtensionProvider } from "../components/extension-provider";
import OperatorFlowPanel from "../components/operator-flow/operator-flow-panel";

enableES5();

const translations = {
  "zh-cn": zhCN,
  "zh-tw": zhTW,
  "en-us": enUS,
  "vi-vn": viVN,
};

function OperatorFlow(microWidgetProps: any) {
  const props = microWidgetProps;
  return (
    <BrowserRouter
      basename={props.microWidgetProps.history?.getBasePath || "/"}
    >
      <Routes>
        <Route path="*" element={<OperatorFlowPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

function render(props?: any) {
  const microWidgetProps = props?.microWidgetProps
    ? props?.microWidgetProps
    : props;

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

  message.config({
    getContainer: () => props?.container || document.body,
  });

  ReactDOM.render(
    <MicroAppProvider
      microWidgetProps={microWidgetProps}
      container={props?.container || document.body}
      translations={translations}
      prefixCls={ANT_PREFIX}
      iconPrefixCls={ANT_ICON_PREFIX}
      platform="operator"
      strategyMode={props?.mode}
      supportCustomNavigation={false}
    >
      <ExtensionProvider isOperator>
        <OemConfigProvider>
          <OperatorFlow microWidgetProps={microWidgetProps} />
        </OemConfigProvider>
      </ExtensionProvider>
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
