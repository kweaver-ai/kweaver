import "../public-path";

import { MicroAppProvider } from "@applet/common";
import "@applet/common/es/style";
import { enableES5 } from "immer";
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import ReactDOM from "react-dom";
import { MemoryRouter } from "react-router";
import { Assistant } from "../components/assistant/assistant";
import { ExtensionProvider } from "../components/extension-provider";
import { OemConfigProvider } from "../components/oem-provider";
import "../element-scroll-polyfill";
import enUS from "../locales/en-us.json";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import viVN from "../locales/vi-vn.json";


enableES5();

const translations = {
  "zh-cn": zhCN,
  "zh-tw": zhTW,
  "en-us": enUS,
  "vi-vn": viVN
};

function render({ container = document.body, microWidgetProps = {} } = {}) {
  ReactDOM.render(
    <MicroAppProvider
      microWidgetProps={microWidgetProps}
      container={container}
      translations={translations}
      prefixCls={ANT_PREFIX}
      iconPrefixCls={ANT_ICON_PREFIX}
      supportCustomNavigation={false}
    >
      <ExtensionProvider>
        <OemConfigProvider>
          <MemoryRouter>
            <Assistant />
          </MemoryRouter>
        </OemConfigProvider>
      </ExtensionProvider>
    </MicroAppProvider>,
    container.querySelector("#content-automation-root")
  );
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() { }

export async function mount(props = {}) {
  render(props);
}

export async function unmount({ container = document } = {}) {
  ReactDOM.unmountComponentAtNode(
    container.querySelector("#content-automation-root")!
  );
}

export const lifecycle = {
  bootstrap,
  mount,
  unmount,
};
