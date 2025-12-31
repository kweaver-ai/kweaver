import { FC, useEffect, useState } from "react";
import { Layout, PageHeader } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { API, useTranslate } from "@applet/common";
import styles from "./task-detail.module.less";
import { createPortal } from "react-dom";
import { TaskStatistics } from "./task-statistics";
import { defaultState, useDataStudio } from "./data-studio-provider";

interface ITaskDetailProps {
  id: string;
  onBack: (needRefresh?: boolean) => void;
  onShowLog: (record: any) => void;
}

export const TaskDetail: FC<ITaskDetailProps> = ({ id, onBack, onShowLog }) => {
    const [data, setData] = useState<any>(null);
    const { setTaskDetailState } = useDataStudio();
    const t = useTranslate();

    async function fetchTaskDetail(taskId: string) {
        const { data } = await API.automation.dagDagIdGet(taskId);
        setData(data);
    }
  
    useEffect(() => {
        fetchTaskDetail(id);
    }, [id]);
  
    const back = () => {
        setTaskDetailState(defaultState);
        onBack();
    };

    // const handleDisable = () => {
    //     // navigate("/disable");
    //     console.log("handleDisable");
    // }; 
  
    return createPortal(
        <Layout className={styles["container"]} id="content-automation-root-layout">
            <PageHeader
                title={
                    <div title={data?.title} className={styles["title"]}>
                    {data?.title || " "}
                    </div>
                }
                className={styles["header"]}
                backIcon={
                    <LeftOutlined
                        className={styles["back-icon"]}
                        title={t("task.back", "返回任务列表")}
                    />
                }
                onBack={back}
            />
    
            <Layout.Content className={styles["content"]}>
                <TaskStatistics
                    taskId={id}
                    onShowLog={onShowLog}
                    onBack={back}
                />
            </Layout.Content>
        </Layout>,
        document.getElementById('content-automation-root') || document.body
    );
};
