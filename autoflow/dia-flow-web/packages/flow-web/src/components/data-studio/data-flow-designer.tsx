import { Button } from "antd";
import { Editor, Instance } from "../editor";
import { FlowDetail } from "./types";
import { createPortal } from "react-dom";
import styles from "./data-flow-designer.module.less";
import { useContext, useRef, useState } from "react";
import { IStep } from "../editor/expr";
import {
  inputConver,
  outputConver,
} from "../../extensions/datastudio/graph-database";
import gobackSVG from "./assets/goback.svg";
import { isFunction } from "lodash";
import ChangeVersionModal from "./change-version-modal";
import { hasOperatorMessage, hasTargetOperator } from "./utils";
import { MicroAppContext } from "@applet/common";

export interface IFlowParams {
  title: string;
  description: string;
  steps: IStep[];
}

interface IDataFlowDesignerProps {
  value: FlowDetail | null;
  onBack: () => void;
  onSave: (val: FlowDetail, dataSourceChanged: boolean) => void;
}

const DataFlowDesigner = ({
  value,
  onBack,
  onSave,
}: IDataFlowDesignerProps) => {
  const [steps, setSteps] = useState<IStep[]>(
    // 图数据库处理
    inputConver(value?.steps || [])
  );

  const editorInstance = useRef<Instance>(null);
  const { microWidgetProps } = useContext(MicroAppContext);

  const handleBack = () => {
    onBack();
  };

  const handleSave = async (data?: any) => {
    const newSteps = outputConver(steps);
    if (!hasTargetOperator(newSteps)) {
      const confirm = await hasOperatorMessage(microWidgetProps?.container);
      if (!confirm) {
        return;
      }
    }
    
    if (isFunction(editorInstance?.current?.validate)) {
      const isValid = await editorInstance?.current?.validate();

      if (!isValid) {
        return;
      }
    }

    // 数据源节点是否变动（结构与非结构）
    // const dataSourceChanged = !value || getDataSourceType[newSteps[0]?.operator] !== getDataSourceType[value?.steps?.[0]?.operator ?? '']
    const dataSourceChanged =
      !value || newSteps[0]?.operator !== value?.steps?.[0]?.operator;

    onSave(
      {
        ...value,
        // 图数据库处理
        steps: newSteps,
        ...data,
      },
      dataSourceChanged
    ); 
  };

  return createPortal(
    <div className={styles["studio-designer"]}>
      <header className={styles["studio-designer-header"]}>
        <div className={styles["left-section"]}>
          <span className={styles["back-button"]} onClick={handleBack}>
            <img src={gobackSVG} alt="返回" className={styles["back-icon"]} />
            返回
          </span>
          <span className={styles["separator"]}>|</span>
          <span className={styles["new-model-button"]}>
            {value?.title || "新建"}
          </span>
        </div>
        <div className={styles["right-section"]}>
          {!value || outputConver(steps)[0]?.operator !== value?.steps?.[0]?.operator ? (
            <Button
              type="primary"
              className={styles["save-button"]}
              onClick={() => handleSave()}
            >
              保存
            </Button>
          ) : (
            <ChangeVersionModal
              dagId={value?.id}
              placement="bottomRight"
              onSaveVersion={(data) => handleSave(data)}
            >
              <Button type="primary" className={styles["save-button"]}>
                保存
              </Button>
            </ChangeVersionModal>
          )}
        </div>
      </header>
      <Editor
        ref={editorInstance}
        value={steps}
        className={styles["studio-designer-editor"]}
        onChange={(steps: IStep[]) => {
          console.log("我是流程的配置", steps);

          setSteps(steps);
        }}
      />
    </div>,
    document.getElementById("content-automation-root") || document.body
  );
};

export default DataFlowDesigner;
