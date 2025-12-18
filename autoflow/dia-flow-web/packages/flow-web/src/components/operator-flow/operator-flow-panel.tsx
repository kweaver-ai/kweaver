import React, { useContext } from "react";
import styles from "./operator-flow-panel.module.less";
import DataFlowDesigner from "./data-flow-designer";
import { message } from "antd";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";

const OperatorFlowPanel: React.FC = () => {
  const t = useTranslate();
  const handleErr = useHandleErrReq();
  const { microWidgetProps } = useContext(MicroAppContext);
  const { extend_info, operator_id, version } =
    microWidgetProps?.selectoperator || {};

  const handleBack = () => {
    //  microWidgetProps?.history.navigateToMicroWidget({
    //     name: 'my-operator',
    //     path: `/`,
    //     isNewTab: false,
    //     isClose: false,
    //   });
    microWidgetProps?.closeModal?.();
    // setIsDataFlowDesignerVisible(false);
  };

  const handleFlowSave = async (flowDetail: any) => {
    saveFlow(flowDetail);
  };
  const saveFlow = async (flowDetal: any) => {
    const outputs: any = [];
    const newSteps = flowDetal?.steps.map((item: any) => {
      if (
        item.operator === "@internal/return" &&
        Array.isArray(item.parameters.fields)
      ) {
        const paramsObj: any = {};
        // 将fields数组中的每个对象转换为键值对对象
        item.parameters.fields.forEach((field: any) => {
          const { name, description, type, key } = field;
          outputs.push({ name, description, type, key });
          paramsObj[field.key] = field.value;
        });
        item.parameters = paramsObj;
      }
      return item;
    });

    flowDetal.steps = newSteps;
    flowDetal.outputs = outputs;

    if (extend_info?.dag_id) {
      // 编辑
      try {
        await API.axios.put(
          `/api/automation/v1/operators/${extend_info?.dag_id}`,
          {
            ...flowDetal,
            operator_id: operator_id,
            version: version,
          }
        );
        message.success(t("edit.success", "编辑成功"));
        microWidgetProps?.closeModal?.({ operator_id, ...flowDetal });
      } catch (error: any) {
        handleErr({ error: error?.response });
      }
    } else {
      // 新建
      try {
        const { data } = await API.axios.post(`/api/automation/v1/operators`, {
          ...flowDetal,
        });
        message.success(t("assistant.success", "保存成功"));
        microWidgetProps?.closeModal?.({ operator_id: data?.operator_id, ...flowDetal });
      } catch (error: any) {
        handleErr({ error: error?.response });
      }
    }
  };

  return (
    <div className={styles["task-panel"]}>
      <DataFlowDesigner
        selectoperator={microWidgetProps?.selectoperator}
        onBack={handleBack}
        onSave={handleFlowSave}
      />
    </div>
  );
};

export default OperatorFlowPanel;
