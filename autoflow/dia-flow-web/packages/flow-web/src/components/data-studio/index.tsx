import { Tabs } from "antd";
import DataStudioPanel from "./data-studio-panel";
import styles from "./index.module.less";
import { Overview } from "./overview";
import { useContext, useEffect, useState, memo } from "react";
import overview from "./assets/overview.png";
import { useHandleErrReq } from "../../utils/hooks";
import { API, MicroAppContext } from "@applet/common";
import { PermissionType } from "./types";

export const DataStudioIndex = memo(() => {
  const handleErr = useHandleErrReq();
  const { prefixUrl } = useContext(MicroAppContext);
  const [activeTab, setActiveTab] = useState<string>();
  const [observabilityShow, setObservabilityShow] = useState<boolean>(false);
  const [permissionCheckInfo, setIsPermissionCheckInfo] =
    useState<Array<PermissionType>>();

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const observabilityVisible = async () => {
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/observability/visible`
      );
      setObservabilityShow(data?.visible);
    } catch (error: any) {
      handleErr({ error: error?.response });
    }
  };

  const permissionsCheck = async () => {
    try {
      const { data } = await API.axios.post(
        `${prefixUrl}/api/automation/v1/permissions/check`,
        { resource_ids: ["dataflow_page:o11y"] }
      );
      setIsPermissionCheckInfo(data?.perms);
    } catch (error) {}
  };

  useEffect(() => {
    observabilityVisible();
    permissionsCheck();
  }, []);

  useEffect(() => {
    if (
      observabilityShow &&
      permissionCheckInfo?.includes(PermissionType.Display)
    ) {
      setActiveTab("1");
    } else {
      setActiveTab("2");
    }
  }, [observabilityShow, permissionCheckInfo]);

  return (
    <div
      className={styles["data-studio-index"]}
      style={{
        backgroundImage: activeTab === "1" ? `url(${overview})` : "",
      }}
    >
      <Tabs
        className={styles["data-studio-tabs"]}
        onChange={onChange}
        activeKey={activeTab}
      >
        {observabilityShow &&
          permissionCheckInfo?.includes(PermissionType.Display) && (
            <Tabs.TabPane tab="概览" key="1">
              {activeTab === "1" && <Overview />}
            </Tabs.TabPane>
          )}
        <Tabs.TabPane tab="管道" key="2">
          {activeTab === "2" && <DataStudioPanel />}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
});
