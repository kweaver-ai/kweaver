import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "../public-path";
import "../element-scroll-polyfill";
import { enableES5 } from "immer";
import "@applet/common/es/style";
import ReactDOM from "react-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import enUS from "../locales/en-us.json";
import viVN from "../locales/vi-vn.json";
import { Routes, Route, MemoryRouter } from "react-router";
import { OemConfigProvider } from "../components/oem-provider";
import { FileTriggerPage } from "../components/file-trigger-form";

enableES5();

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

function render({
    container = document.body,
    microWidgetProps = {} as any,
} = {}) {
    ReactDOM.render(
        <MicroAppProvider
            microWidgetProps={microWidgetProps}
            container={container}
            translations={translations}
            prefixCls={ANT_PREFIX}
            iconPrefixCls={ANT_ICON_PREFIX}
            supportCustomNavigation={false}
        >
            <OemConfigProvider>
                <MemoryRouter
                    basename="/"
                    initialEntries={[
                        microWidgetProps.config.systemInfo.homepage,
                    ]}
                >
                    <Routes>
                        <Route path="*" element={<FileTriggerPage />} />
                    </Routes>
                </MemoryRouter>
            </OemConfigProvider>
        </MicroAppProvider>,
        container.querySelector("#content-automation-root")
    );
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
    render();
}

export async function bootstrap() { }

export async function mount(props: any = {}) {
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
