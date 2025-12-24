import { HeadNavigation } from "../../components/head-navigation";
import { Route, Routes, useNavigate } from "react-router-dom";
import { HomePage } from "./homepage";
import { TaskList } from "../../components/task-list";
import { TemplateList } from "../../components/template-list";
import styles from "./home.module.less";
import { useContext } from "react";
import { ServiceConfigContext } from "../../components/config-provider";
import { ModelPanel } from "../model-panel";
import { Executors } from "../executors";
import AuditTemplate from "./audit-template";
import AuditAgency from "./audit-agency";

export const Home = () => {
    // 获取插件开关状态
    const { config } = useContext(ServiceConfigContext);
    const navigate = useNavigate();

    if (config.isServiceOpen === false) {
        navigate("/disable");
    }

    return (
        <div className={styles["layout"]}>
            <HeadNavigation />
            <div className={styles["container"]}>
                <Routes>
                    <Route path="/list" element={<TaskList />} />
                    <Route path="/template" element={<TemplateList />} />
                    <Route path="/model" element={<ModelPanel />} />
                    <Route path="/model/*" element={<ModelPanel />} />
                    <Route path="/executors" element={<Executors />} />
                    <Route path="/auditTemplate" element={<AuditTemplate />}></Route>
                    <Route path="/doc-audit-client" element={<AuditAgency />}></Route>
                    {/* <Route path="/doc-audit-client/*" element={<AuditAgency />}></Route> */}
                    <Route path="*" element={<TaskList />} />
                </Routes>
            </div>
        </div>
    );
};
