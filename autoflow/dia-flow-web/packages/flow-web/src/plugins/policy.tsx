import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "../public-path";
import "../element-scroll-polyfill";
import "../crypto-polyfill";
import { enableES5 } from "immer";
import "@applet/common/es/style";
import ReactDOM from "react-dom";
import {
    API,
    MicroAppContext,
    MicroAppProvider,
    useTranslate,
} from "@applet/common";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import enUS from "../locales/en-us.json";
import viVN from "../locales/vi-vn.json";
import { ConsoleDefaultSteps, Editor, Instance } from "../components/editor";
import { IStep } from "../components/editor/expr";
import { Routes, Route } from "react-router";
import { BrowserRouter } from "react-router-dom";
import styles from "./styles/policy.module.less";
import "../index.less";
import {
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { ExtensionContext, ExtensionProvider } from "../components/extension-provider";
import { OemConfigProvider } from "../components/oem-provider";
import { Layout, message } from "antd";
import { useHandleErrReq } from "../utils/hooks";
import { Position } from "react-scaleable";
import { StrategyMode } from "../extensions/workflow/approval-executor-action";
import {
    permTemplate,
    defaultUploadTemplate,
    securityUploadTemplate,
    deleteTemplate,
    renameTemplate,
    moveTemplate,
    copyTemplate,
    folderPropertiesTemplate,
} from "./policy-template";
import { PolicyContext } from "./context";

enableES5();

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

interface PolicyProps {
    value?: IStep[];
    type?: string;
    mode?: StrategyMode;
    dagId: string;
    forbidForm?: boolean;
    onChange?: (params: {
        value: IStep[];
        onVerify?: () => Promise<boolean>;
    }) => void;
}

function Policy({
    value,
    onChange,
    type,
    mode,
    dagId: taskId,
    forbidForm,
}: PolicyProps) {
    const [steps, setSteps] = useState<IStep[]>([]);
    const editorRef = useRef<Instance>(null);
    const popupContainer = useRef<HTMLDivElement>(null);
    const { message, prefixUrl, isSecretMode } = useContext(MicroAppContext);
    const { globalConfig } = useContext(ExtensionContext);
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const onVerify: any = async () => {
        if (editorRef?.current?.validate) {
            return editorRef.current.validate();
        }
    };

    const zoomCenter = (
        delay = 100,
        scale = false,
        left = "center" as Position,
        top = "center" as Position
    ) => {
        if (editorRef?.current?.zoomCenter) {
            editorRef?.current?.zoomCenter({ delay, scale, left, top });
        }
    };

    const isControlled = typeof value !== "undefined" && value?.length;

    useEffect(() => {
        // 初始化模板
        if (!taskId && (!value || value?.length === 0)) {
            const handleCenter = () => {
                setTimeout(() => {
                    zoomCenter(100, false, "center", "content-start");
                }, 10);
            };
            // 根据管控操作mode加载模板
            let template = ConsoleDefaultSteps;
            switch (mode) {
                case StrategyMode.perm:
                    template = permTemplate;
                    break;
                case StrategyMode.upload:
                    template = defaultUploadTemplate;
                    if (isSecretMode === true && globalConfig["@anyshare/doc/setallowsuffixdoc"] === true) {
                        template = securityUploadTemplate;
                    }
                    if (forbidForm === true) {
                        template = [
                            {
                                id: "0",
                                operator: "@trigger/security-policy",
                                parameters: {
                                    fields: [],
                                },
                            },
                        ];
                    }
                    break;
                case StrategyMode.delete:
                    template = deleteTemplate;
                    break;
                case StrategyMode.rename:
                    template = renameTemplate;
                    break;
                case StrategyMode.move:
                    template = moveTemplate;
                    break;
                case StrategyMode.copy:
                    template = copyTemplate;
                    break;
                case StrategyMode.modify_folder_property:
                    template = folderPropertiesTemplate;
                    break;
                default:
                    template = ConsoleDefaultSteps;
            }
            setSteps(template);
            // 等待获取到涉密开关后再更新模板
            if (typeof isSecretMode === "boolean") {
                onChange && onChange({ value: template, onVerify });
            }
            handleCenter();
        }
    }, [mode, isSecretMode, globalConfig]);

    useLayoutEffect(() => {
        if (isControlled) {
            setSteps(value);
        }
    }, [isControlled, value]);

    useEffect(() => {
        async function getTaskInfo() {
            try {
                const data = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/security-policy/flows/${taskId}`
                );
                setSteps(data?.data.steps as any);
                setTimeout(() => {
                    if (type === "preview") {
                        zoomCenter(100, true);
                    } else {
                        zoomCenter(100, false, "center", "content-start");
                    }
                }, 10);
                if (typeof onChange === "function") {
                    onChange({ value: data?.data.steps as any, onVerify });
                }
            } catch (error: any) {
                // 任务不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    message.info(t("err.dag.notFound", "该流程已不存在"));
                    return;
                }
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    message.warning(
                        t("notEnable", "当前工作流未开启，请联系管理员")
                    );
                    return;
                }
                handleErr({ error: error?.response });
            }
        }
        // 初始化时获取信息
        if (taskId && !isControlled) {
            getTaskInfo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId, isControlled]);

    return (
        <Layout
            className={styles["editor-container"]}
            style={
                process.env.NODE_ENV === "development"
                    ? { maxHeight: window.innerHeight }
                    : undefined
            }
        >
            <Editor
                ref={editorRef}
                type={type}
                mode={mode}
                value={steps}
                onChange={(value: IStep[]) => {
                    if (!isControlled) {
                        setSteps(value);
                    }
                    if (typeof onChange === "function") {
                        onChange({
                            value,
                            onVerify,
                        });
                    }
                }}
                getPopupContainer={() => popupContainer.current!}
                className={styles["content"]}
            />
            <div ref={popupContainer}></div>
        </Layout>
    );
}

function render(props?: any) {
    const microWidgetProps = props?.microWidgetProps
        ? props?.microWidgetProps
        : props;

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
            platform="console"
            strategyMode={props?.mode}
            supportCustomNavigation={false}
        >
            <ExtensionProvider>
                <OemConfigProvider>
                    <PolicyContext.Provider
                        value={{ forbidForm: props?.forbidForm }}
                    >
                        <BrowserRouter>
                            <Routes>
                                <Route
                                    path="*"
                                    element={
                                        <Policy
                                            value={props?.value}
                                            onChange={props?.onChange}
                                            type={props?.type}
                                            mode={props?.mode}
                                            dagId={props?.dagId}
                                            forbidForm={props?.forbidForm}
                                        />
                                    }
                                />
                            </Routes>
                        </BrowserRouter>
                    </PolicyContext.Provider>
                </OemConfigProvider>
            </ExtensionProvider>
        </MicroAppProvider>,
        (props?.container || document.body).querySelector(
            "#content-automation-root"
        )
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
