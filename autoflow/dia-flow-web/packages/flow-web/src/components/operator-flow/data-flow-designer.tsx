import { Button, message } from "antd";
import { Editor, Instance } from "../editor/operator-editor";
import { FlowDetail } from "./types";
import { createPortal } from "react-dom";
import styles from "./data-flow-designer.module.less";
import { useEffect, useRef, useState } from "react";
import { IStep } from "../editor/expr";
import {
  inputConver,
  outputConver,
} from "../../extensions/datastudio/graph-database";
import gobackSVG from "./assets/goback.svg";
import SaveOperatorModal from "../editor/operator-editor/save-operator-modal";
import { API } from "@applet/common";
import editorStore from "../editor/store/editorStore";

export interface IFlowParams {
  title: string;
  description: string;
  steps: IStep[];
}

interface IDataFlowDesignerProps {
  selectoperator: any;
  onBack: () => void;
  onSave: (val: FlowDetail) => void;
}

const DataFlowDesigner = ({
  selectoperator,
  onBack,
  onSave,
}: IDataFlowDesignerProps) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [value, setValue] = useState<any>();
  const [steps, setSteps] = useState<IStep[]>(
    // 图数据库处理
    inputConver(value?.steps || [])
  );

  useEffect(() => {
    setSteps([]);
    const fetchConfig = async () => {
      try {
        const { data } = await API.axios.get(
          `/api/automation/v1/dag/${selectoperator?.extend_info?.dag_id}`
        );
        setValue(data);
        const newData = data?.steps.map((item: any) => {
          if (item.operator === "@internal/return") {
            const fields = data?.outputs?.map((str: any) => {
              return {
                ...str,
                value: item?.parameters?.[str.key],
              };
            });

            return {
              ...item,
              parameters: {
                fields,
              },
            };
          }
          return item;
        });
        setSteps(newData);
      } catch (error: any) {
        console.error(error);
      }
    };
    if (selectoperator?.extend_info?.dag_id) fetchConfig();
  }, [selectoperator]);

  const editorInstance = useRef<Instance>(null);

  const handleBack = () => {
    onBack();
  };
  const closeModal = () => {
    setIsSaveModalOpen(false);
  };
  const handleSave = async () => {
    const hasForm = steps?.some(
      (item) =>
        item.operator === "@trigger/form" && item?.parameters?.fields?.length
    );
    if (!hasForm) {
      message.warning("开始算子不能为空！");
      return;
    }

    const hasReturn = steps?.some(
      (item) => item.operator === "@internal/return" && item?.parameters
    );
    if (!hasReturn) {
      message.warning("结束算子不能为空！");
      return;
    }
    setIsSaveModalOpen(true);

    // if (isFunction(editorInstance?.current?.validate)) {
    //   const isValid = await editorInstance?.current?.validate();

    //   if (!isValid) {
    //     return;
    //   }
    // }
  };

  const saveOperator = async (value?: any) => {
    const newSteps = outputConver(steps);

    onSave({
      ...value,
      // 图数据库处理
      steps: newSteps,
    });
  };

  return createPortal(
    <div className={styles["studio-designer"]}>
      <header className={styles["studio-designer-header"]}>
        <div className={styles["left-section"]}>
          <span className={styles["back-button"]} onClick={handleBack}>
            <img src={gobackSVG} alt="返回" className={styles["back-icon"]} />
          </span>
          <span className={styles["new-model-button"]}>
            {value?.title || "未命名算子"}
          </span>
        </div>
        <div className={styles["right-section"]}>
          <Button
            type="primary"
            className={styles["save-button"]}
            onClick={handleSave}
          >
            保存
          </Button>
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
      {isSaveModalOpen && (
        <SaveOperatorModal
          isSaveModalOpen={isSaveModalOpen}
          closeModal={closeModal}
          saveOperator={saveOperator}
          value={value}
        />
      )}
    </div>,
    document.getElementById("content-automation-root") || document.body
  );
};

export default DataFlowDesigner;
