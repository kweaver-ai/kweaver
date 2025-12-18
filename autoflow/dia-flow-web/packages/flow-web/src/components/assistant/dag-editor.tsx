import { LeftOutlined, SettingOutlined } from "@ant-design/icons";
import { DagDetail } from "@applet/api/lib/content-automation";
import { API, MicroAppContext, useEvent, useTranslate } from "@applet/common";
import { Button, ConfigProvider, Drawer, Layout, Modal, PageHeader, Space, Typography } from "antd";
import clsx from "clsx";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PromiseWithResolvers, promiseWithResolvers } from "../../utils/async";
import { useHandleErrReq } from "../../utils/hooks";
import { Editor, Instance } from "../editor";
import { IStep } from "../editor/expr";
import { FormValue, RefProps, TaskInfoModal } from "../header-bar/task-form";
import styles from "./dag-editor.module.less";

export interface DagEditorProps {
  dag?: DagDetail;
  onClose?(): void;
  onRun(dagId: string): void;
  onFinish?(dagId: string): void;
}

export function DagEditor({ dag, onClose, onFinish, onRun }: DagEditorProps) {
  const { container, microWidgetProps } = useContext(MicroAppContext);
  const t = useTranslate();
  const [title, setTitle] = useState(dag?.title);
  const [steps, setSteps] = useState<IStep[] | undefined>(dag?.steps as IStep[]);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<RefProps>(null);
  const [taskInfo, setTaskInfo] = useState<PromiseWithResolvers<FormValue>>();
  const [taskInfoHasError, setTaskInfoHasError] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useLayoutEffect(() => {
    setTitle(dag?.title);
    setSteps(dag?.steps as IStep[]);
  }, [dag]);

  const triggerOperator = steps?.[0].operator;
  const isManual = triggerOperator === "@trigger/manual";

  const editorInstance = useRef<Instance>(null);

  useEffect(() => {
    setTimeout(() => {
      if (dag?.steps) {
        editorInstance?.current?.validate();
      }
    }, 100);
  }, [dag]);

  const handleErr = useHandleErrReq();

  const handleError = useEvent((error: any) => {
    if (error?.response?.data?.code === "ContentAutomation.DuplicatedName") {
      microWidgetProps?.components?.messageBox({
        type: "info",
        title: t("err.title.save", "无法保存自动任务"),
        message: t("err.duplicatedName", "已存在同名任务。"),
        okText: t("ok", "确定"),
      });
      return;
    }
    if (error?.response?.data?.code === "ContentAutomation.InvalidParameter") {
      microWidgetProps?.components?.messageBox({
        type: "info",
        title: t("err.title.save", "无法保存自动任务"),
        message: t("err.invalidParameter", "请检查参数。"),
        okText: t("ok", "确定"),
      });
      return;
    }
    // 自动化未启用
    if (error?.response?.data?.code === "ContentAutomation.Forbidden.ServiceDisabled") {
      microWidgetProps?.components?.messageBox({
        type: "info",
        title: t("err.title.save", "无法保存自动任务"),
        okText: t("ok", "确定"),
      });
      return;
    }

    if (error?.response?.data?.code === "ContentAutomation.Forbidden.NumberOfTasksLimited") {
      microWidgetProps?.components?.messageBox({
        type: "info",
        title: t("err.title.save", "无法保存自动任务"),
        message: t("err.tasksExceeds", "您新建的自动任务数已达上限。（最多允许新建50个）"),
        okText: t("ok", "确定"),
      });
      return;
    }
    handleErr({ error: error?.response });
  });

  const save = useEvent(async (runImmediately?: boolean) => {
    const isValid = await editorInstance?.current?.validate?.();
    if (!isValid) {
      microWidgetProps?.components?.toast.error(t("save.fail", "保存失败"));
      return;
    }

    if (!steps?.length || steps.length < 2) {
      microWidgetProps?.components?.messageBox({
        type: "info",
        title: t("err.title.save", "无法保存自动任务"),
        message: t("err.invalidParameter.onlyOne", "一个自动任务至少需包含一个执行节点"),
        okText: t("ok", "确定"),
      });
      return;
    }

    let dagId = dag?.id;

    try {
      if (dagId) {
        await API.automation.dagDagIdPut(dagId, {
          steps: steps as any,
        });
      } else {
        const taskInfo = promiseWithResolvers<FormValue>();
        setTaskInfo(taskInfo);

        let formValue: FormValue = {
          taskName: title!,
          description: "",
          isNormal: true,
        };

        try {
          const {
            data: { name },
          } = await API.automation.dagSuggestnameNameGet(title!);

          formValue.taskName = name;
          setTitle(name);

          if (triggerOperator === "@trigger/form" || triggerOperator === "@trigger/selected-file" || triggerOperator === "@trigger/selected-folder") {
            const { data } = await API.efast.eacpV1UserGetPost();
            formValue.accessors = [
              {
                type: "user",
                id: data.userid,
                name: data.name,
              },
            ];
          }

          formRef.current?.form.setFieldsValue(formValue);

          formValue = await taskInfo.promise;
          setTitle(formValue.taskName);
        } catch (e) {
          return;
        } finally {
          setTaskInfo(undefined);
        }

        const {
          data: { id },
        } = await API.automation.dagPost({
          title: formValue.taskName,
          description: formValue.description,
          status: formValue.isNormal ? "normal" : "stopped",
          steps: steps as any,
          create_by: "direct",
          accessors: formValue.accessors,
        });

        dagId = id!;
      }

      onFinish?.(dagId);

      if (isManual && runImmediately) {
        onRun(dagId);
      }
    } catch (error: any) {
      handleError(error);
    }
  });

  const showDrawer = useEvent(async () => {
    if (!dag) return;

    setDrawerVisible(true);

    let dagDetail = dag;
    try {
      const { data } = await API.automation.dagDagIdGet(dag.id!);
      dagDetail = data;
    } catch (e) {}

    formRef.current?.form.setFieldsValue({
      taskName: dagDetail.title!,
      description: dagDetail.description!,
      isNormal: dagDetail.status === "normal",
      accessors: (dagDetail as any).accessors || [],
    });
  });

  const drawerSave = useEvent(async (formValue: FormValue) => {
    try {
      await API.automation.dagDagIdPut(dag!.id!, {
        title: formValue.taskName!.trim(),
        description: formValue.description?.trim?.() || "",
        status: formValue.isNormal ? "normal" : "stopped",
        accessors: formValue.accessors,
        steps: steps as any,
      });

      setDrawerVisible(false);
    } catch (error: any) {
      handleError(error);
    }
  });

  if (!dag) return null;

  return (
    <ConfigProvider getPopupContainer={() => popupContainerRef.current!}>
      <Layout className={styles.DagEditorContainer}>
        <PageHeader
          title={
            <Typography.Text ellipsis title={title} className={styles.Title}>
              {title}
            </Typography.Text>
          }
          className={styles.Header}
          backIcon={<LeftOutlined className={styles.BackIcon} />}
          onBack={onClose}
          extra={
            <Space>
              {dag.id ? <Button type="text" title={t("header.setting", "任务设置")} icon={<SettingOutlined />} onClick={showDrawer} /> : null}
              <Button type="primary" onClick={() => save()}>
                {t("save", "保存")}
              </Button>
            </Space>
          }
        ></PageHeader>
        <Layout.Content>
          <Editor
            ref={editorInstance}
            className={styles.Editor}
            value={steps}
            onChange={(steps) => {
              setSteps(steps);
            }}
            getPopupContainer={() => popupContainerRef.current!}
          />
          <div ref={popupContainerRef}></div>
        </Layout.Content>
      </Layout>

      {dag.id ? (
        <Drawer
          open={drawerVisible}
          title={<div className={styles["drawer-title"]}>{t("saveTask.title", "保存任务设置")}</div>}
          className={styles["drawer"]}
          width={560}
          placement="right"
          maskClosable={false}
          footer={
            <div className={styles["drawer-footer"]}>
              <Button
                className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")}
                onClick={() => {
                  formRef.current && formRef.current.form.submit();
                }}
                type="primary"
                disabled={taskInfoHasError}
              >
                {t("ok", "确定")}
              </Button>
              <Button className={styles["footer-btn-cancel"]} onClick={() => setDrawerVisible(false)} type="default">
                {t("cancel", "取消")}
              </Button>
            </div>
          }
          onClose={() => setDrawerVisible(false)}
        >
          {drawerVisible ? <TaskInfoModal ref={formRef} steps={steps || []} onSubmit={drawerSave} handleValidateError={setTaskInfoHasError} /> : null}
        </Drawer>
      ) : (
        <Modal
          open={!!taskInfo}
          title={<div className={styles["modal-title"]}>{t("saveTask.title", "保存任务设置")}</div>}
          className={styles["modal"]}
          width={520}
          onCancel={taskInfo?.reject}
          centered
          closable
          maskClosable={false}
          footer={
            <div className={styles["modal-footer"]}>
              <Button
                className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")}
                onClick={() => {
                  formRef.current && formRef.current.form.submit();
                }}
                type="primary"
                disabled={taskInfoHasError}
              >
                {t("ok", "确定")}
              </Button>
              <Button className={styles["footer-btn-cancel"]} onClick={taskInfo?.reject} type="default">
                {t("cancel", "取消")}
              </Button>
            </div>
          }
          transitionName=""
          destroyOnClose
        >
          {taskInfo ? <TaskInfoModal ref={formRef} steps={steps || []} onSubmit={taskInfo.resolve} handleValidateError={setTaskInfoHasError} /> : null}
        </Modal>
      )}
    </ConfigProvider>
  );
}
