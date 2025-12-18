import { useRef, useState } from "react";
import { Editor, Instance } from "../editor";
import { IStep } from "../editor/expr";
import { inputConver } from "../../extensions/datastudio/graph-database";
import styles from "./version-model-drawer.module.less";

interface ModelDrawerProps {
  value?: any;
}

export const VersionDetailsView = ({ value }: ModelDrawerProps) => {
  const editorInstance = useRef<Instance>(null);
  const [steps, setSteps] = useState<IStep[]>(
    // 图数据库处理
    inputConver(value?.steps || [])
  );

  return (
    <div
      className={styles["preview-audit-flow"]}
      onClick={(e) => e.stopPropagation()}
    >
      <Editor
        ref={editorInstance}
        type="preview"
        value={steps}
        className={styles["preview-audit-content"]}
        onChange={(steps: IStep[]) => {
          console.log("我是流程的配置", steps);

          setSteps(steps);
        }}
      />
    </div>
  );
};
