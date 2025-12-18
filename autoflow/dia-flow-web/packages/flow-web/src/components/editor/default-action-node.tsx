import { FC, useContext } from "react";
import { ExecutorActionNodeProps, TriggerActionNodeProps } from "../extension";
import styles from "./editor.module.less";
import { RightOutlined } from "@ant-design/icons";
import { ExtensionContext } from "../extension-provider";
import { isFunction } from "lodash";
import { CheckCircleOutlined } from "@ant-design/icons";

export const DefaultActionNode: FC<
  ExecutorActionNodeProps | TriggerActionNodeProps
> = ({ action, t }) => {
  const { globalConfig } = useContext(ExtensionContext);
  const actionName =
    action.title ||
    (isFunction(action.name) ? t(action.name(globalConfig)) : t(action.name));

  return (
    <div className={styles.actionNode}>
      {action.icon ? (
        <img className={styles.actionIcon} src={action.icon} alt={actionName} />
      ) : (
        <CheckCircleOutlined style={{ fontSize: "16px" }} />
      )}

      <div className={styles.actionName} title={actionName}>
        {actionName}
      </div>
      <RightOutlined className={styles.actionArrow} />
    </div>
  );
};
