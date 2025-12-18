import { DagDetail } from "@applet/api/lib/content-automation";
import { API, MicroAppContext, useEvent, useTranslate } from "@applet/common";
import { ConfigProvider, Modal, Button } from "antd";
import { useContext, useEffect, useRef, useState } from "react";
import { useHandleErrReq } from "../../utils/hooks";
import { IDocItem } from "../as-file-preview";
import { FileTriggerForm } from "../file-trigger-form";
import { useFormTriggerModal } from "../task-card/use-form-trigger-modal";
import { AssistantChat, AssistantChatRef } from "./assistant-chat";
import styles from "./assistant.module.less";
import { DagEditor } from "./dag-editor";
import { Dag, RelatedDagList, RelatedDagListRef } from "./related-dag";
import { Agent, AgentInfo, callAgent, getAgentAnswerText } from "../../utils/agents";
import useSWR from "swr";

export function Assistant() {
  const { microWidgetProps, functionid, container, message } = useContext(MicroAppContext);
  const [selectedItems, setSelectedItems] = useState<IDocItem[]>(() => Array.from(microWidgetProps.contextMenu?.getSelections || []));
  const t = useTranslate();

  const chatRef = useRef<AssistantChatRef>(null);
  const listRef = useRef<RelatedDagListRef>(null);
  const fileTriggerFormPopupContainerRef = useRef<HTMLDivElement>(null);

  const [dag, setDag] = useState<DagDetail>();

  const [containerId] = useState(() => `assistant-${Math.random().toString(16).slice(2)}`);

  useEffect(() => {
    microWidgetProps.sidebar?.onShow({
      functionid,
      once: false,
      callback({ selections }:any) {
        setSelectedItems(Array.from(selections));
      },
    });
  }, []);

  const handleErr = useHandleErrReq();

  const [fileTriggerDag, setFileTriggerDag] = useState<Dag>();
  const [getFormTriggerParameters, FormTriggerModalElement] = useFormTriggerModal();

  const runDag = useEvent(async (dagId: string) => {
    try {
      const { data } = await API.automation.dagDagIdGet(dagId);
      const triggerStep = data.steps[0];

      if (data.status !== "normal") {
        listRef.current?.reload();
        return;
      }

      switch (triggerStep.operator) {
        case "@trigger/manual": {
          await API.automation.runInstanceDagIdPost(dagId);

          message.success(t("run.success", "任务开始运行"));
          return;
        }

        case "@trigger/form":
          const parameters = await getFormTriggerParameters((data.steps[0].parameters as any).fields, data.title);

          await API.axios.post(`/api/automation/v1/run-instance-form/${data.id}`, {
            data: parameters,
          });
          break;

        case "@trigger/selected-file":
        case "@trigger/selected-folder":
          if ((data.steps[0]?.parameters as any)?.fields?.length) {
            setFileTriggerDag(data as any);
          } else {
            await API.axios.post(`/api/automation/v1/run-instance-with-doc/${data.id}`, {
              docid: selectedItems[0].docid,
              data: {},
            });
            message.success(t("run.success", "任务开始运行"));
          }
          return;
      }
    } catch (error: any) {
      if (!error) {
        return;
      }
      // 任务不存在
      if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title.run", "无法运行此任务"),
          message: t("err.task.notFound", "该任务已不存在。"),
          okText: t("ok", "确定"),
          onOk: () => {
            listRef.current?.reload();
          },
        });
        return;
      }
      // 触发器文件夹不存在
      if (error?.response?.data?.code === "ContentAutomation.TaskSourceNotFound") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title.run", "无法运行此任务"),
          message: t("err.trigger.notFound", "任务的执行目标已不存在。"),
          okText: t("ok", "确定"),
        });
        return;
      }
      // 对触发器文件夹没有权限
      if (error?.response?.data?.code === "ContentAutomation.TaskSourceNotPerm") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title.run", "无法运行此任务"),
          message: t("err.trigger.noPerm", "您对任务的执行目标没有显示权限。"),
          okText: t("ok", "确定"),
        });
        return;
      }
      // 任务状态已停用
      if (error?.response?.data?.code === "ContentAutomation.Forbidden.DagStatusNotNormal") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title.run", "无法运行此任务"),
          message: t("err.task.notNormal", "该任务已停用。"),
          okText: t("ok", "确定"),
          onOk: () => {
            listRef.current?.reload();
          },
        });
        return;
      }
      // 不是手动任务
      if (error?.response?.data?.code === "ContentAutomation.Forbidden.ErrorIncorretTrigger") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title.run", "无法运行此任务"),
          message: t("err.task.incorrectTrigger", "该任务不支持手动运行。"),
          okText: t("ok", "确定"),
          onOk() {
            listRef.current?.reload();
          },
        });
        return;
      }
      handleErr({ error: error?.response });
    }
  });

  const { data: agentIds } = useSWR(
    `/api/automation/v1/agents`,
    async (url) => {
      const { data } = await API.axios.get<AgentInfo[]>(url);
      const agentIds = Object.fromEntries(data.map((item) => [item.name, item.agent_id])) as Record<Agent, string>;

      try {
        const res = await callAgent(agentIds[Agent.Check], { query: "ok" });
        const content = getAgentAnswerText(res)
        if (content && /ok/.test(content)) {
          return agentIds;
        }
      } catch (e) {}
    },
    {
      revalidateOnReconnect: true,
      revalidateOnMount: true,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  if (!selectedItems.length) {
    return null;
  }

  return (
    <div className={styles.Assistant} id={containerId}>
      {agentIds ? <AssistantChat agentIds={agentIds} ref={chatRef} selectedItems={selectedItems} dag={dag} onDagChange={setDag} /> : null}
      {selectedItems.length === 1 ? <RelatedDagList ref={listRef} doc={selectedItems[0]} containerId={containerId} onRun={runDag} /> : null}
      <DagEditor
        dag={dag}
        onClose={() => setDag(undefined)}
        onFinish={(dagId) => {
          setDag(undefined);
          message.success(
            <div style={{ lineHeight: "15px" }}>
              {t("assistant.success", "新建成功")}
              <span
                style={{
                  color: "rgba(52, 97, 236, 0.75)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  microWidgetProps.history?.navigateToMicroWidget({
                    command: "content-automation",
                    path: `/details/${dagId}`,
                    isClose: false,
                    isNewTab: true,
                    isForceNewTab: true,
                  });
                }}
              >
                {t("assistant.goto", "前往查看>>")}
              </span>
              <span>{t("assistant.toView", " ")}</span>
            </div>,
            3
          );
          chatRef.current?.clearInput();
          listRef.current?.reload();
        }}
        onRun={runDag}
      />
      <Modal title={fileTriggerDag?.title} open={!!fileTriggerDag} destroyOnClose transitionName="" footer={null} bodyStyle={{ padding: "24px 0 0 0" }} onCancel={() => setFileTriggerDag(undefined)}>
        {fileTriggerDag ? (
          <ConfigProvider getPopupContainer={() => fileTriggerFormPopupContainerRef.current!}>
            <FileTriggerForm taskId={fileTriggerDag.id} selection={selectedItems} onBack={() => setFileTriggerDag(undefined)} onClose={() => setFileTriggerDag(undefined)} />
          </ConfigProvider>
        ) : null}
        <div ref={fileTriggerFormPopupContainerRef}></div>
      </Modal>
      {FormTriggerModalElement}
    </div>
  );
}
