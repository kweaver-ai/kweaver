import { Drawer, Steps, Tooltip, Modal, message, Button, Popover, Spin } from "antd";
import styles from "./version-model-drawer.module.less";
import { useContext, useEffect, useRef, useState } from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import { formatDate } from "../../utils/format-number";
import recoverIcon from "./assets/recover.svg";
import viewIcon from "./assets/view-version.svg";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import ChangeVersionModal from "./change-version-modal";
import { PermissionType } from "./types";
import RenameModal from "./rename-modal";
import { VersionDetailsView } from "./version-details-view";
const { Step } = Steps;
const { confirm } = Modal;

interface ModelDrawerProps {
  dagId: string;
  popupContainer?: HTMLElement;
  onClose: () => void;
  permissionCheckInfo?: any;
  fetchTasks: () => void;
}

export const VersionModelDrawer = ({
  dagId,
  onClose,
  popupContainer,
  permissionCheckInfo,
  fetchTasks,
}: ModelDrawerProps) => {
  const t = useTranslate();
  const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();
  const [versionList, setVersionList] = useState<any>([]);
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const versionIdRef = useRef<any>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [rollbackInfo, serRollbackInfo] = useState<any>();
  const [flowDetail, setFlowDetail] = useState<any>();

  const getVersions = async () => {
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/dags/${dagId}/versions`
      );
      setVersionList(data);
    } catch (error: any) {
      handleErr({ error: error?.response });
    }
  };

  useEffect(() => {
    getVersions();
  }, []);

  const onStepClick = (index: number) => {
    setCurrent(index);
  };

  const rollbackVersions = async (item: any) => {
    try {
      await API.axios.post(
        `${prefixUrl}/api/automation/v1/dags/${dagId}/versions/${versionIdRef.current}/rollback`,
        {
          version: item?.version,
          change_log: item?.change_log,
          title: item?.title,
        }
      );
      message.success("还原此版本成功");
      setModalOpen(false);
      getVersions();
      onClose?.();
      fetchTasks?.();
    } catch (error: any) {
      const response = error?.response;
      if (response?.data?.code === "Public.Conflict") {
        serRollbackInfo(item);
        showConfirm();
      } else {
        handleErr({ error: response });
      }
    }
  };

  const showConfirm = () => {
    confirm({
      title: "此名称已被占用，请重新命名",
      icon: <ExclamationCircleOutlined />,
      getContainer: microWidgetProps?.container,
      onOk() {
       setRenameModalOpen(true)
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const clickView = async (item?: any) => {
    setFlowDetail({});
    const { id, version_id } = item;
    try {
      const {
        data: { title, steps, trigger_config },
      } = await API.axios.get(`${prefixUrl}/api/automation/v1/dag/${id}?version=${version_id}`);

      setFlowDetail({ id, title, steps, trigger_config });
    } catch (error: any) {
      handleErr({ error: error?.response });
    }
  };

  return (
    <>
      <Drawer
        open
        width={600}
        title={"版本信息"}
        className={styles["drawer"]}
        closable
        onClose={onClose}
        placement="right"
        maskClosable={false}
        getContainer={popupContainer}
        footer={null}
      >
        <Steps
          progressDot
          current={0}
          direction="vertical"
          className={styles["version-steps"]}
        >
          {versionList.map((item: any, index: number) => (
            <Step
              key={index}
              title={
                <div className={styles["version-steps-title"]}>
                  <div className={styles["version-steps-title-left"]}>
                    <div className={styles["version-steps-title-name"]}>
                      {item.version}
                    </div>
                    {index === 0 && (
                      <span className={styles["title-name-new"]}>最新</span>
                    )}
                  </div>
                  <div className={styles["version-steps-title-right"]}>
                    <Tooltip placement="top" title={"查看"}>
                      <Popover
                        content={flowDetail?.id ? <VersionDetailsView value={flowDetail} /> : <Spin />}
                        trigger="click"
                        overlayStyle={{ width: 650, height: 600 }}
                        placement="left"
                      >
                        <div
                          className={styles["version-steps-icon"]}
                          onClick={() => {
                            clickView(item);
                          }}
                        >
                          <img src={viewIcon} alt="icon" />
                        </div>
                      </Popover>
                    </Tooltip>
                    {index !== 0 &&
                      permissionCheckInfo?.includes(PermissionType.Modify) && (
                        <Tooltip placement="top" title={"还原"}>
                          <div
                            className={styles["version-steps-icon"]}
                            style={{ marginLeft: "6px" }}
                            onClick={() => {
                              setModalOpen(true);
                              versionIdRef.current = item?.version_id;
                            }}
                          >
                            <img src={recoverIcon} alt="icon" />
                          </div>
                        </Tooltip>
                      )}
                  </div>
                </div>
              }
              onClick={() => onStepClick(index)}
              style={{
                backgroundColor: index === current ? "#F7F9FD" : "transparent",
              }}
              description={
                <div className={styles["version-steps-desc"]}>
                  <p>更新人：{item.user_name}</p>
                  <p>更新时间：{formatDate(item.created_at)}</p>
                  <p>版本描述：{item.change_log || "暂无描述"}</p>
                </div>
              }
            ></Step>
          ))}
        </Steps>
        <Modal
          className={styles["version-modal"]}
          open={modalOpen}
          width={416}
          onCancel={() => setModalOpen(false)}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              取消
            </Button>,
            <ChangeVersionModal
              dagId={dagId}
              onSaveVersion={(data) => rollbackVersions(data)}
            >
              <Button key="confirm" type="primary">
                确 定
              </Button>
            </ChangeVersionModal>,
          ]}
        >
          <div className={styles["modal-content"]}>
            <span className={styles["modal-content-icon"]}>
              <ExclamationCircleOutlined />
            </span>{" "}
            <span className={styles["modal-content-desc"]}>
              您确定要还原此版本么?
            </span>
          </div>
        </Modal>
        {renameModalOpen && (
          <RenameModal
            rollbackInfo={rollbackInfo}
            onSave={(data) => rollbackVersions(data)}
            onClose={() => {
              setRenameModalOpen(false);
            }}
          />
        )}
      </Drawer>
    </>
  );
};
