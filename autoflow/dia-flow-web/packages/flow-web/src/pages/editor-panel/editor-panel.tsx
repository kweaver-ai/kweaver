import {
    createContext,
    Dispatch,
    useContext,
    useEffect,
    useReducer,
    useRef,
    useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import { Layout } from "antd";
import { Step } from "@applet/api/lib/content-automation";
import {
    API,
    AsUserSelectItem,
    MicroAppContext,
    useTranslate,
} from "@applet/common";
import { Editor, Instance } from "../../components/editor";
import { useHandleErrReq } from "../../utils/hooks";
import { HeaderBar } from "../../components/header-bar";
import { IStep } from "../../components/editor/expr";
import OfflineTip from "../../components/table-empty/offline-tip";
import styles from "./editor-panel.module.less";
import { Position } from "react-scaleable";

export enum TaskStatus {
    Normal = "normal",
    Stopped = "stopped",
}

interface IDetail {
    title?: string;
    description?: string;
    status?: string;
    steps?: Step[];
    accessors?: AsUserSelectItem[];
    shortcuts?: string[];
}
interface IAction {
    type:
        | "initial"
        | "title"
        | "description"
        | "status"
        | "steps"
        | "accessors"
        | "shortcuts";
    initialValue?: IDetail;
    /**
     * 任务名称,不能包含 / : * ? \" < > | 特殊字符，长度不能超过128个字符
     * @type {string}
     * @memberof DagDetail
     */
    title?: string;
    /**
     * 详情描述,不允许换行输入,不允许超过300个字符
     * @type {string}
     * @memberof DagDetail
     */
    description?: string;
    /**
     * 任务状态,默认启用  - normal: 启用中   - stopped: 已停用
     * @type {string}
     * @memberof DagDetail
     */
    status?: string;
    /**
     * 自动化流程定义
     * @type {Array<Step>}
     * @memberof DagDetail
     */
    steps?: Step[];

    accessors?: AsUserSelectItem[];
    shortcuts?: string[];
}

export interface TaskInfoContextType {
    mode: "new" | "edit";
    hasChanges: boolean;
    title: string;
    description?: string;
    accessors: AsUserSelectItem[];
    shortcuts: string[];
    status: string;
    steps: Step[];
    handleChanges?: (changed: boolean) => void;
    handleDisable?: () => void;
    onUpdate?: Dispatch<IAction>;
    onVerify?: () => Promise<boolean> | undefined;
    zoomCenter?: (params: {
        delay: number;
        scale: boolean;
        left: Position;
        top: Position;
    }) => void;
}

export const TaskInfoContext = createContext<TaskInfoContextType>({
    mode: "new",
    hasChanges: false,
    title: "",
    accessors: [],
    shortcuts: [],
    description: "",
    status: TaskStatus.Normal,
    steps: [],
});

export const reducer = (state: IDetail | undefined, action: IAction) => {
    switch (action.type) {
        case "title":
            return { ...state, title: action.title };
        case "description":
            return { ...state, description: action.description };
        case "status":
            return { ...state, status: action.status };
        case "steps":
            return { ...state, steps: action.steps };
        case "accessors":
            return { ...state, accessors: action.accessors };
        case "shortcuts":
            return { ...state, shortcuts: action.shortcuts };
        case "initial":
            return action.initialValue;
        default:
            throw new Error("Unexpected action");
    }
};

export const EditorPanel = () => {
    const { id: taskId = "" } = useParams<{ id: string }>();
    const [hasChanges, setHasChanges] = useState(false);
    const [hasError, setHasError] = useState(false);
    const editorRef = useRef<Instance>(null);
    const popupContainer = useRef<HTMLDivElement>(null);
    const t = useTranslate();
    const navigate = useNavigate();
    const handleErr = useHandleErrReq();
    const { microWidgetProps } = useContext(MicroAppContext);
    const editorReducer = (state: IDetail | undefined, action: IAction) => {
        setHasChanges(true);
        return reducer(state, action);
    };
    const [data, dispatch] = useReducer(editorReducer, undefined);

    useEffect(() => {
        async function getTaskInfo() {
            try {
                const data = await API.automation.dagDagIdGet(taskId);
                dispatch({
                    type: "initial",
                    initialValue: data?.data as IDetail,
                });
                // 编辑时第一次加载数据不算修改
                setHasChanges(false);
                // 内容居中
                if (typeof editorRef?.current?.zoomCenter === "function") {
                    editorRef.current.zoomCenter({
                        delay: 0,
                        scale: false,
                        left: "center",
                        top: "content-start",
                    });
                }
            } catch (error: any) {
                // 任务不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t("err.task.notFound", "该任务已不存在。"),
                        okText: t("task.back", "返回任务列表"),
                        onOk: () => navigate("/nav/list"),
                    });
                    return;
                }
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    navigate("/disable");
                    return;
                }
                setHasError(true);
                handleErr({ error: error?.response });
            }
        }
        // 编辑任务时获取信息
        if (taskId) {
            getTaskInfo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    return (
        <TaskInfoContext.Provider
            value={{
                hasChanges,
                mode: taskId ? "edit" : "new",
                title: data?.title || "",
                description: data?.description || "",
                status: data?.status || TaskStatus.Normal,
                accessors: data?.accessors || [],
                shortcuts: data?.shortcuts || [],
                steps: data?.steps || [],
                handleChanges: (changed: boolean) => setHasChanges(changed),
                handleDisable: () => {
                    navigate("/disable");
                },
                onUpdate: dispatch,
                onVerify: editorRef?.current?.validate,
                zoomCenter: editorRef?.current?.zoomCenter,
            }}
        >
            <Layout className={styles["container"]}>
                <HeaderBar />
                {!hasError ? (
                    <Editor
                        ref={editorRef}
                        value={(data?.steps as IStep[]) || []}
                        onChange={(value) => {
                            dispatch({
                                type: "steps",
                                steps: value as Step[],
                            });
                        }}
                        getPopupContainer={() => popupContainer.current!}
                        className={styles["content"]}
                    />
                ) : (
                    <div className={styles["error-tip"]}>
                        <OfflineTip />
                    </div>
                )}
                <div ref={popupContainer}></div>
            </Layout>
        </TaskInfoContext.Provider>
    );
};
