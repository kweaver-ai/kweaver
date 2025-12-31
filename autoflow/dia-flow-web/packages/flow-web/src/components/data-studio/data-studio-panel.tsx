import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Table,
  Empty,
  Space,
  Dropdown,
  Menu,
  Drawer,
  Modal,
  message,
  Select,
  Upload,
  Form,
  Input,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DownOutlined,
  CloseOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import DataFlowDesigner from "./data-flow-designer";
import { FlowDetail, ITaskItem, ITaskParams, PermissionType } from "./types";
import styles from "./data-studio-panel.module.less";
import AlertSetting from "./alert-setting";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import moment from "moment";
import { TaskDetail } from "./task-detail";
import emptyList from "../../assets/empty.png";
import emptySearch from "../../assets/empty-search.png";
import SearchInput from "../search-input";
import CreateModeDrawer, { CreateMode } from "./create-mode-drawer";
import type { FilterDropdownProps } from "antd/es/table/interface";
import clsx from "clsx";
import { LogPanel } from "./log-panel";
import { Trigger, TriggerConfig } from "./trigger-config";
import CreateModal from "./create-modal";
import drawerStyles from "./styles/data-studio-drawer.module.less";
import CronTriggerSVG from "../../extensions/cron/assets/trigger-clock.svg";
import ManualTriggerSVG from "../../extensions/internal/assets/trigger-manual.svg";
import FlowEventTriggerSVG from "../../assets/flow-trigger-event.svg";
import editSVG from "../../assets/edit.svg";
import triggerSVG from "../../assets/trigger.svg";
import renameSVG from "../../assets/rename.svg";
import alertSVG from "../../assets/alert.svg";
import editFlowSVG from "../../assets/edit-flow.svg";
import runSVG from "../../assets/run.svg";
import runStatisticsSVG from "../../assets/run-statistics.svg";
import deleteSVG from "../../assets/delete.svg";
import { useFormTriggerModal } from "../task-card/use-form-trigger-modal";
import _ from "lodash";
import { useHandleErrReq } from "../../utils/hooks";
import exportIcon from "./assets/export.svg";
import importIcon from "./assets/import.svg";
import versionIcon from "./assets/version.svg";
import viewIcon from "./assets/view.svg";
import { VersionModelDrawer } from "./version-model-drawer";
import { hasOperatorMessage, hasTargetOperator } from "./utils";

// filterMenu checkbox backup
// const filterMenu = () => {
//     return (
//         <Menu className={styles["filter-menu"]}>
//           <Menu.Item key="all">
//             <Checkbox
//               checked={selectedKeys?.length === 0}
//               onChange={() => {
//                 setSelectedKeys([]);
//               }}
//             >
//               {t("filter.all", "全部")}
//             </Checkbox>
//           </Menu.Item>
//           {filters!.map(({ text, value }) => {
//             const checked = selectedKeys?.includes(value as string);
//             return (
//               <Menu.Item key={String(value)}>
//                 <Checkbox
//                   checked={checked}
//                   onChange={() => {
//                     if (!checked) {
//                       setSelectedKeys([...selectedKeys, value as string]);
//                     } else {
//                       setSelectedKeys(
//                         selectedKeys?.filter((key) => key !== value)
//                       );
//                     }
//                   }}
//                 >
//                   {text}
//                 </Checkbox>
//               </Menu.Item>
//             );
//           })}
//           <Button
//             type="primary"
//             size="small"
//             className={clsx(
//               styles["filter-confirm-btn"],
//               "automate-oem-primary-btn"
//             )}
//             onClick={() => {
//               confirm();
//             }}
//           >
//             {t("ok", "确定")}
//           </Button>
//         </Menu>
//     )
// }

interface IData {
  dags: ITaskItem[];
  total: number;
}

export const triggerIcons = {
  cron: CronTriggerSVG,
  event: FlowEventTriggerSVG,
  manually: ManualTriggerSVG,
};

const limitRanges = ["10", "20", "50", "100"];

const DataStudioPanel: React.FC = () => {
  const [data, setData] = useState<IData>({
    dags: [],
    total: 0,
  });
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDataFlowDesignerVisible, setIsDataFlowDesignerVisible] =
    useState(false);
  const [isAlertSettingVisible, setIsAlertSettingVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ITaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterParams, setFilterParams] = useState<ITaskParams>({
    page: 0,
    limit: 50,
    type: "data-flow",
  });
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [isTaskLogVisible, setIsTaskLogVisible] = useState(false);
  const [recordId, setRecordId] = useState("");

  const [isTriggerConfigVisible, setIsTriggerConfigVisible] = useState(false);
  const currentFlowDetail = useRef<FlowDetail | null>(null);

  const [isCreateModelVisible, setIsCreateModelVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [getFormTriggerParameters, FormTriggerModalElement] =
    useFormTriggerModal();

  const [permissionCheckInfo, setIsPermissionCheckInfo] =
    useState<Array<PermissionType>>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportJsonData, setExportJsonData] = useState({});
  const [form] = Form.useForm();
  const [isVersionOpen, setIsVersionOpen] = useState(false);

  const searchInputRef = useRef<{
    cleanValue: () => void;
  }>(null);

  const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
  const t = useTranslate();
  const handleErr = useHandleErrReq();
  const userId = microWidgetProps?.config?.userInfo?.id;

  // 触发方式选项
  const triggerOptions = [
    { text: t("datastudio.trigger.type.cron", "定时"), value: "cron" },
    { text: t("datastudio.trigger.type.event", "事件"), value: "event" },
    { text: t("datastudio.trigger.type.manually", "手动"), value: "manually" },
  ];

  const task = useMemo(
    () => ({
      isEditTrigger: false,
    }),
    []
  );

  // 获取数据
  const fetchTasks = async (params?: ITaskParams) => {
    setLoading(true);
    setSelectedRows([]);
    if (!params?.title) {
      setSearchKey("");
      searchInputRef.current?.cleanValue?.();
    }
    try {
      const data = await API.axios.get(`${prefixUrl}/api/automation/v2/dags`, {
        params: {
          page: params?.page || 0,
          limit: params?.limit || 50,
          sortby: "updated_at",
          order: params?.sortOrder || "desc",
          type: "data-flow",
          keyword: params?.title,
          trigger_type: params?.trigger_type,
        },
      });

      setData(data?.data);
    } catch (error) {
      message.error(t("error.fetchTasks", "获取任务列表失败"));
    } finally {
      setLoading(false);
    }
  };

  // 将表格重置到第一页
  const resetPage = () => {
    setFilterParams((prevState) => ({
      ...prevState,
      page: 0,
    }));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: t("datastudio.table.column.name", "管道名称"),
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string, record: ITaskItem) => {
        return (
          <div className={styles["task-table-title"]} title={title}>
            <img
              src={triggerIcons[record.trigger]}
              alt={record.title}
              className={styles["task-icon"]}
            />
            {title}
          </div>
        );
      },
    },
    {
      title: t("datastudio.table.column.trigger", "触发方式"),
      dataIndex: "trigger",
      key: "trigger",
      filters: triggerOptions,
      filteredValue: filterParams.trigger_type
        ? [filterParams.trigger_type]
        : null,
      width: 150,
      filterIcon: <DownOutlined />,
      render: (trigger: string) => {
        const triggerMap: Record<string, string> = {
          cron: t("datastudio.trigger.type.cron", "定时"),
          event: t("datastudio.trigger.type.event", "事件"),
          manually: t("datastudio.trigger.type.manually", "手动"),
        };
        return triggerMap[trigger] || trigger;
      },
      filterDropdown: ({
        filters,
        selectedKeys,
        setSelectedKeys,
        confirm,
      }: FilterDropdownProps) => (
        <Menu className={styles["filter-menu"]}>
          <Menu.Item
            key="all"
            onClick={() => {
              setSelectedKeys([]);
              confirm();
            }}
            className={clsx(styles["filter-item"], {
              [styles["selected"]]: selectedKeys?.length === 0,
            })}
          >
            {t("filter.all", "全部")}
          </Menu.Item>
          {filters!.map(({ text, value }) => {
            const isSelected = selectedKeys?.includes(value as string);
            return (
              <Menu.Item
                key={String(value)}
                onClick={() => {
                  setSelectedKeys([value as string]);
                  confirm();
                }}
                className={clsx(styles["filter-item"], {
                  [styles["selected"]]: isSelected,
                })}
              >
                {text}
              </Menu.Item>
            );
          })}
        </Menu>
      ),
    },
    {
      title: "创建人",
      dataIndex: "creator",
      key: "creator",
      width: 200,
    },
    {
      title: t("datastudio.table.column.updateTime", "更新时间"),
      dataIndex: "updated_at",
      key: "updated_at",
      width: 200,
      render: (timestamp: number) =>
        moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss"),
      sorter: (a: ITaskItem, b: ITaskItem) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
  ];

  const handleBack = () => {
    setIsDataFlowDesignerVisible(false);
  };

  const handleFlowSave = async (
    flowDetail: FlowDetail,
    dataSourceChanged: boolean
  ) => {
    const { id } = flowDetail;
    // if (!hasTargetOperator(flowDetail?.steps)) {
    //   const confirm = await hasOperatorMessage(microWidgetProps?.container);
    //   if (!confirm) {
    //     return;
    //   }
    // }

    setIsDataFlowDesignerVisible(false);
    task.isEditTrigger = false;

    if (dataSourceChanged) {
      currentFlowDetail.current = {
        ...flowDetail,
        trigger_config: { operator: "" },
      };

      setIsTriggerConfigVisible(true);

      return;
    } else {
      currentFlowDetail.current = {
        ...currentFlowDetail.current,
        ...flowDetail,
      };

      if (id) {
        // 仅编辑流程
        saveFlow(currentFlowDetail.current);
      } else {
        // 新建流程
        setIsTriggerConfigVisible(true);
      }
    }
  };

  // 保存流程配置
  const saveFlow = async (flowDetal: FlowDetail, type?: boolean) => {
    const { id, ...flow } = flowDetal;

    if (!id) {
      // 新建
      try {
        await API.axios.post(`${prefixUrl}/api/automation/v1/data-flow/flow`, {
          ...flow,
        });

        message.success(t("assistant.success", "新建成功"));
      } catch (error: any) {
        handleErr({ error: error?.response });
        if (
          error?.response?.data?.code === "ContentAutomation.DuplicatedName" &&
          type
        ) {
          const { data } = await API.axios.get(
            `${prefixUrl}/api/automation/v1/dag/suggestname/${flow?.title}`
          );
          form.setFieldValue("name", data?.name);
          setIsModalOpen(true);
        }
      }
    } else {
      // 编辑
      await API.axios.put(
        `${prefixUrl}/api/automation/v1/data-flow/flow/${id}`,
        { ...flow }
      );
      message.success(t("edit.success", "编辑成功"));
    }

    fetchTasks();
    resetPage();
  };
  const handleAlertSettingClose = () => {
    setIsAlertSettingVisible(false);
  };

  const rowSelection = {
    onChange: (_: React.Key[], selectedRows: ITaskItem[]) => {
      setSelectedRows(selectedRows);
    },
    selectedRowKeys: selectedRows.map((item) => item.id),
  };
  const handleView = () => {
    setIsViewVisible(true);
  };

  const handleRun = async () => {
    try {
      const errors: { id: string; error: any }[] = [];

      await Promise.all(
        selectedRows.map(async (row: any) => {
          const isTriggerForm = row?.actions?.includes("@trigger/form");
          try {
            if (isTriggerForm) {
              const {
                data: { steps },
              } = await API.axios.get(
                `${prefixUrl}/api/automation/v1/dag/${row.id}`
              );
              const parameters = await getFormTriggerParameters(
                (steps[0].parameters as any).fields,
                row.title
              );

              await API.axios.post(
                `/api/automation/v1/run-instance-form/${row.id}`,
                {
                  data: parameters,
                }
              );
            } else {
              await API.axios.post(
                row.trigger === "manually"
                  ? `${prefixUrl}/api/automation/v1/run-instance/${row.id}`
                  : `${prefixUrl}/api/automation/v1/trigger/cron/${row.id}`,
                {}
              );
            }
          } catch (error) {
            errors.push({
              id: row.id,
              error: error,
            });
          }
        })
      );
      // 如果有失败的任务，显示错误信息
      if (errors.length > 0) {
        if (
          errors.some(
            (error) =>
              error.error.response.data.code ===
              "ContentAutomation.TaskNotFound"
          )
        ) {
          message.error(t("datastudio.edit.taskNotFound", "任务已不存在"));
          fetchTasks();
          resetPage();
        } else {
          message.error(t("status.someFailed", "部分任务运行失败"));
        }
      } else {
        message.success(t("status.success", "运行成功"));
      }
    } catch (error) {
      console.error("运行数据产品失败:", error);
      // message.error(t("status.failed", "运行失败"));
    }
  };

  const handleDelete = () => {
    const names = selectedRows.map((row) => row.title).join("、");
    Modal.confirm({
      title: t("deleteTitle", "确认删除"),
      getContainer:
        document.getElementById("content-automation-root") || document.body,
      content: t("confirm.delete.content", `确定删除工作流“${names}”吗？`, {
        name: names,
      }),
      okText: t("ok", "确定"),
      cancelText: t("ancel", "取消"),
      onOk: async () => {
        try {
          await Promise.all(
            selectedRows.map((row) =>
              API.axios.delete(
                `${prefixUrl}/api/automation/v1/data-flow/flow/${row.id}`
              )
            )
          );
          message.success(t("delete.success", "删除成功"));
        } catch (error) {
          Modal.error({
            title: t("delete.failed", "删除失败"),
            content: t("error.delete.content", "删除工作流失败，请稍后重试"),
          });
        } finally {
          await fetchTasks({
            ...filterParams,
            page: 0,
          });

          resetPage();
          setSelectedRows([]);
        }
      },
    });
  };

  const handleViewBack = (needRefresh?: boolean) => {
    setIsViewVisible(false);
    if (needRefresh) {
      fetchTasks();
      resetPage();
    }
  };

  const handleSearch = (value: string) => {
    setSearchKey(value);
    fetchTasks({
      title: value,
      ...filterParams,
      page: 0,
    });

    resetPage();
  };

  const hasRun = (task: ITaskItem) => {
    return task.trigger === "cron" || task.trigger === "manually";
  };

  // 编辑流程配置
  const editFlow = async (type: string) => {
    const { id } = selectedRows[0];
    try {
      const {
        data: { title, steps, trigger_config },
      } = await API.axios.get(`${prefixUrl}/api/automation/v1/dag/${id}`);

      if (
        type === "flow" &&
        trigger_config?.dataSource &&
        !trigger_config?.dataSource?.operator
      )
        trigger_config.dataSource.operator = "";

      currentFlowDetail.current = { id, title, steps, trigger_config };

      if (type === "flow") {
        setIsDataFlowDesignerVisible(true);
      }

      if (type === "trigger") {
        task.isEditTrigger = true;
        setIsTriggerConfigVisible(true);
      }
      if (type === "name") {
        setIsCreateModelVisible(true);
      }
    } catch (error: any) {
      if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
        message.error(t("datastudio.edit.taskNotFound", "任务已不存在"));
        resetPage();
        fetchTasks();
      }
    }
  };

  const BatchActions = () => {
    const editMenu = (
      <Menu>
        <Menu.Item key="edit-flow" onClick={() => editFlow("flow")}>
          <img
            src={editFlowSVG}
            alt="编辑流程配置"
            className={styles["edit-icon"]}
          />
          {t("datastudio.edit.flow", "编辑流程配置")}
        </Menu.Item>
        <Menu.Item key="edit-trigger" onClick={() => editFlow("trigger")}>
          <img
            src={triggerSVG}
            alt="更改触发方式"
            className={styles["edit-icon"]}
          />
          {t("datastudio.edit.trigger", "更改触发方式")}
        </Menu.Item>
        <Menu.Item key="edit-trigger-name" onClick={() => editFlow("name")}>
          <img src={renameSVG} alt="重命名" className={styles["edit-icon"]} />
          {t("datastudio.edit.rename", "重命名")}
        </Menu.Item>
      </Menu>
    );

    const viewMenu = (
      <Menu className={styles["menu-button"]}>
        {permissionCheckInfo?.includes(PermissionType.RunStatistics) && (
          <Menu.Item key="edit-flow" onClick={handleView}>
            <img
              src={runStatisticsSVG}
              alt="运行统计"
              className={styles["edit-icon"]}
            />
            {t("datastudio.button.runStatistics", "运行统计")}
          </Menu.Item>
        )}
        {permissionCheckInfo?.includes(PermissionType.View) && (
          <Menu.Item key="edit-trigger" onClick={() => setIsVersionOpen(true)}>
            <img
              src={versionIcon}
              alt="版本信息"
              className={styles["edit-icon"]}
            />
            版本信息
          </Menu.Item>
        )}
      </Menu>
    );

    const exportJson = async () => {
      message.info("正在导出...");
      try {
        const { id } = selectedRows[0];
        const { data } = await API.axios.get(
          `${prefixUrl}/api/automation/v1/dag/${id}`
        );
        const jsonData = _.pick(data, [
          "title",
          "description",
          "steps",
          "trigger_config",
          "userid",
        ]);
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const href = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = href;
        link.download = `${jsonData?.title}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      } catch {
        message.error("导出失败");
      }
    };

    if (selectedRows.length === 1) {
      return (
        <Space className={styles["space-button"]}>
          {hasRun(selectedRows[0]) &&
            permissionCheckInfo?.includes(PermissionType.ManualExec) && (
              <Button
                icon={
                  <img
                    src={runSVG}
                    alt="运行"
                    className={styles["edit-icon"]}
                  />
                }
                onClick={handleRun}
              >
                {t("datastudio.button.run", "运行")}
              </Button>
            )}
          {permissionCheckInfo?.includes(PermissionType.Modify) && (
            <Dropdown overlay={editMenu} placement="bottom">
              <Button
                icon={
                  <img
                    src={editSVG}
                    alt="编辑流程配置"
                    className={styles["edit-icon"]}
                  />
                }
              >
                {t("datastudio.button.edit", "编辑")}
                <CaretDownOutlined />
              </Button>
            </Dropdown>
          )}
          {(permissionCheckInfo?.includes(PermissionType.View) ||
            permissionCheckInfo?.includes(PermissionType.RunStatistics)) && (
            <Dropdown overlay={viewMenu} placement="bottom">
              <Button
                icon={
                  <img
                    src={viewIcon}
                    alt="查看"
                    className={styles["edit-icon"]}
                  />
                }
              >
                {t("view", "查看")}
                <CaretDownOutlined />
              </Button>
            </Dropdown>
            // <Button
            //   icon={
            //     <img
            //       src={runStatisticsSVG}
            //       alt="运行统计"
            //       className={styles["edit-icon"]}
            //     />
            //   }
            //   onClick={handleView}
            // >
            //   {t("datastudio.button.runStatistics", "运行统计")}
            // </Button>
          )}
          {permissionCheckInfo?.includes(PermissionType.View) && (
            <Button
              icon={
                <img
                  src={exportIcon}
                  alt="icon"
                  className={styles["edit-icon"]}
                />
              }
              onClick={() => {
                exportJson();
              }}
            >
              导出
            </Button>
          )}
          {permissionCheckInfo?.includes(PermissionType.Delete) && (
            <Button
              danger
              icon={
                <img
                  src={deleteSVG}
                  alt="删除"
                  className={styles["edit-icon"]}
                />
              }
              onClick={handleDelete}
            >
              {t("datastudio.button.delete", "删除")}
            </Button>
          )}
        </Space>
      );
    }

    return (
      <Space>
        {selectedRows.every((task) => hasRun(task)) &&
          permissionCheckInfo?.includes(PermissionType.ManualExec) && (
            <Button icon={<PlayCircleOutlined />} onClick={handleRun}>
              {t("datastudio.button.run", "运行")}
            </Button>
          )}
        {permissionCheckInfo?.includes(PermissionType.Delete) && (
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            {t("datastudio.button.delete", "删除")}
          </Button>
        )}
      </Space>
    );
  };

  const handleSelectMode = (mode: CreateMode) => {
    setIsCreateModalVisible(false);
    if (mode === CreateMode.Blank) {
      currentFlowDetail.current = null;
      setIsDataFlowDesignerVisible(true);
    }
  };

  const handleCloseCreateModeDrawer = () => {
    setIsCreateModalVisible(false);
  };

  // 完成触发方式配置
  const handleTriggerConfigOk = async (trigger_config: Trigger) => {
//  if (!hasTargetOperator(currentFlowDetail.current?.steps)) {
//    const confirm = await hasOperatorMessage(microWidgetProps?.container);
//    if (!confirm) {
//      return;
//    }
//  }
    currentFlowDetail.current = {
      ...currentFlowDetail.current,
      trigger_config,
    } as FlowDetail;

    setIsTriggerConfigVisible(false);

    if (!task.isEditTrigger) {
      setIsCreateModelVisible(true);
    } else {
      handleEditTrigger(currentFlowDetail.current);
    }
  };

  const handleShowLog = (record: any) => {
    setRecordId(record.id);
    setIsViewVisible(false);
    setIsTaskLogVisible(true);
  };

  const handleLogBack = () => {
    setIsTaskLogVisible(false);
    setIsViewVisible(true);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSelectedRows([]);
    const triggerType = filters.trigger ? filters.trigger.join(",") : undefined;
    const page = pagination.current > 1 ? pagination.current - 1 : 0;
    const sortOrder = sorter.order === "ascend" ? "asc" : "desc";

    fetchTasks({
      ...filterParams,
      page,
      limit: pagination.pageSize,
      sortBy: sorter.field,
      sortOrder,
      trigger_type: triggerType,
      title: searchKey,
    });

    setFilterParams((prevState) => ({
      ...prevState,
      page,
      limit: pagination.pageSize,
      sortBy: sorter.field,
      sortOrder,
      trigger_type: triggerType,
    }));
  };

  const handleEditTrigger = async (flowDetal: FlowDetail) => {
    const { id, ...flow } = flowDetal;

    try {
      await API.axios.put(
        `${prefixUrl}/api/automation/v1/data-flow/flow/${id}`,
        { ...flow }
      );
      message.success(t("edit.success", "编辑成功"));
      fetchTasks(); // 刷新列表
      resetPage();
    } catch (error) {
      message.error(t("edit.error", "编辑失败"));
    }

    fetchTasks(); // 刷新列表
    resetPage();
  };

  const handleSubmit = async () => {
    handleCloseCreateModeDrawer();
    fetchTasks(); // 刷新列表
    resetPage();
  };

  const handleCreateModelOk = () => {
    setIsCreateModelVisible(false);
    fetchTasks();
    resetPage();
  };

  const handleCreateModelCancel = () => {
    setIsCreateModelVisible(false);
  };

  const handleLimitChange = (value: string) => {
    setSelectedRows([]);
    fetchTasks({
      ...filterParams,
      page: 0,
      limit: Number(value),
      title: searchKey,
    });

    setFilterParams((prevState) => ({
      ...prevState,
      page: 0,
      limit: Number(value),
    }));
  };

  // 权限判断
  useEffect(() => {
    if (selectedRows?.length) {
      const result = selectedRows.map((item) => `${item.id}:${item.type}`);
      permissionsCheck(result);
    } else {
      permissionsCheck(["*"]);
    }
  }, [selectedRows]);

  const permissionsCheck = async (resource_ids: any) => {
    try {
      const { data } = await API.axios.post(
        `${prefixUrl}/api/automation/v1/permissions/check`,
        { resource_ids }
      );
      setIsPermissionCheckInfo(data?.perms);
    } catch (error) {}
  };

  // 上传配置
  const uploadProps = {
    name: "file",
    multiple: false,
    fileList,
    showUploadList: false,
    accept: ".json",
    beforeUpload: (file: any) => {
      // 验证文件类型
      const isJson =
        file.type === "application/json" || file.name.endsWith(".json");
      if (!isJson) {
        message.error("只能上传JSON文件!");
        return Upload.LIST_IGNORE;
      }

      // 验证文件大小
      const isLt5M = file.size / 1024 / 1024 < 20;
      if (!isLt5M) {
        message.error("文件大小不能超过20MB!");
        return Upload.LIST_IGNORE;
      }

      // 文件验证通过，立即上传
      handleUpload(file);
      return false; // 阻止自动上传
    },
    onChange: ({ fileList }: any) => {
      setFileList(fileList.slice(-1)); // 只保留最新文件
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  // 导入掉创建接口
  const handleUpload = async (file: any) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data?.userid !== userId)
          _.unset(data?.trigger_config?.dataSource?.parameters, "docs");
        _.unset(data, "userid");
        setExportJsonData(data);
        saveFlow(data, true);
      } catch (err) {
        message.error("解析JSON文件失败");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    const data: any = exportJsonData;
    data.title = form.getFieldValue("name");
    saveFlow(data, true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles["task-panel"]}>
      {/* <div className={styles["task-panel-header"]}>
        <div className={styles["task-panel-header-left"]}>
          <div className={styles["task-panel-header-left-title"]}>
            {t("datastudio.panel.title", "数据处理")}
          </div>
          <span className={styles["task-panel-header-left-desc"]}>
            {t(
              "datastudio.panel.desc",
              "自动将各类文档数据和元数据转换为统一格式，为上层文档业务提供高效、标准化的底层数据支持"
            )}
          </span>
        </div>
        <span
          onClick={() => setIsAlertSettingVisible(true)}
          className={styles["alert"]}
        >
          <img src={alertSVG} alt="告警设置" className={styles["alert-icon"]} />
          {t("datastudio.alert.settings", "告警设置")}
        </span>
      </div> */}

      <div className={styles["task-panel-toolbar"]}>
        <div>
          {selectedRows.length === 0 ? (
            <>
              {permissionCheckInfo?.includes(PermissionType.Create) && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      currentFlowDetail.current = null;
                      setIsCreateModalVisible(true);
                    }}
                    style={{ marginRight: "8px" }}
                  >
                    {t("datastudio.button.create", "新建")}
                  </Button>
                  <Upload {...uploadProps}>
                    <Button
                      icon={
                        <img
                          src={importIcon}
                          alt="icon"
                          className={styles["edit-icon"]}
                        />
                      }
                      loading={uploading}
                    >
                      导入
                    </Button>
                  </Upload>
                </>
              )}
            </>
          ) : (
            <BatchActions />
          )}
        </div>
        <Space>
          <SearchInput
            ref={searchInputRef}
            placeholder={t("datastudio.search.placeholder", "搜索工作流名称")}
            onSearch={handleSearch}
          />
        </Space>
      </div>

      <Table
        rowKey="id"
        className={styles["dags-table"]}
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
          checkStrictly: true,
        }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedRows([record]);
          },
        })}
        pagination={{
          current: filterParams.page! + 1,
          pageSize: filterParams.limit,
          total: data?.total,
          showSizeChanger: false,
          showTotal: (total) => (
            <Space>
              <span>
                {t("pagination.count", `共${total?.toLocaleString()}条`, {
                  count: total?.toLocaleString(),
                })}
              </span>
              <Select
                className={styles["limit-select"]}
                popupClassName={styles["limit-popup"]}
                value={filterParams.limit?.toString()}
                style={{ width: 100, height: 24 }}
                onChange={handleLimitChange}
                options={limitRanges.map((item: string) => ({
                  value: item,
                  label: t(`limit.${item}`, `${item}条/页`),
                }))}
              />
            </Space>
          ),
        }}
        columns={columns}
        dataSource={data?.dags}
        loading={loading}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <div className={styles["empty-container"]}>
              <Empty
                image={!!searchKey ? emptySearch : emptyList}
                description={
                  !!searchKey
                    ? t("datastudio.table.emptySearch", "抱歉，未找到相关内容")
                    : t("datastudio.table.empty", "列表为空")
                }
              />
            </div>
          ),
        }}
        scroll={{ y: "calc(100vh - 300px)" }}
      />

      {isCreateModalVisible && (
        <CreateModeDrawer
          onClose={handleCloseCreateModeDrawer}
          onSelectMode={handleSelectMode}
          onSubmit={handleSubmit}
        />
      )}
      {isDataFlowDesignerVisible && (
        <DataFlowDesigner
          value={currentFlowDetail.current}
          onBack={handleBack}
          onSave={handleFlowSave}
        />
      )}
      {isAlertSettingVisible && (
        <AlertSetting onClose={handleAlertSettingClose} />
      )}

      {isViewVisible && (
        <TaskDetail
          id={selectedRows[0].id}
          onBack={handleViewBack}
          onShowLog={handleShowLog}
        />
      )}

      {isTaskLogVisible && (
        <LogPanel
          taskId={selectedRows[0].id}
          recordId={recordId}
          onClose={handleLogBack}
        />
      )}
      {isTriggerConfigVisible && (
        <Drawer
          title={
            <div className={drawerStyles["drawer-title"]}>
              {t("datastudio.trigger.event.mode", "触发方式")}
            </div>
          }
          open={true}
          placement="right"
          footer={null}
          width={528}
          className={drawerStyles["data-studio-drawer"]}
          headerStyle={{ borderBottom: "none" }}
          closeIcon={
            <CloseOutlined className={drawerStyles["drawer-close-icon"]} />
          }
          onClose={() => {
            currentFlowDetail.current = null;
            setIsTriggerConfigVisible(false);
          }}
        >
          <TriggerConfig
            flowDetail={currentFlowDetail.current!}
            onFinish={handleTriggerConfigOk}
            onCancel={() => {
              currentFlowDetail.current = null;
              setIsTriggerConfigVisible(false);
            }}
            isEditTrigger={task.isEditTrigger}
          />
        </Drawer>
      )}
      {isCreateModelVisible && (
        <CreateModal
          value={currentFlowDetail.current!}
          onClose={handleCreateModelCancel}
          onSave={handleCreateModelOk}
        />
      )}
      {FormTriggerModalElement}
      <Modal
        title="更改名称"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p style={{ color: "red" }}>已存在同名任务,请更换名称重试</p>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="管道名称">
            <Input placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
      {isVersionOpen && (
        <VersionModelDrawer
          dagId={selectedRows[0].id}
          permissionCheckInfo={permissionCheckInfo}
          onClose={() => {
            setIsVersionOpen(false);
          }}
          fetchTasks={fetchTasks}
        />
      )}
    </div>
  );
};

export default DataStudioPanel;
