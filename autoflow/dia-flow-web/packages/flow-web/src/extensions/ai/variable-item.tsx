import { FC, useContext, useMemo, useState } from "react";
import styles from "../../components/editor/editor.module.less";
import { useTranslate } from "@applet/common";
import { isFunction } from "lodash";
import {
  ExtensionContext,
  useExtensionTranslateFn,
  useTranslateExtension,
} from "../../components/extension-provider";
import {
  DataSourceStepNode,
  ExecutorStepNode,
  TriggerStepNode,
} from "../../components/editor/expr";
import { EditorContext } from "../../components/editor/editor-context";
import { Output } from "../../components/extension";

export const VariableItem: FC<any> = ({ value, onChange, variable }) => {
  const t = useTranslate();
  const et = useExtensionTranslateFn();
  const { globalConfig } = useContext(ExtensionContext);
  const { pickVariable, stepNodes, stepOutputs } = useContext(EditorContext);
  const [variableVal, setVariableVal] = useState(variable);

  const [isVariable, stepNode, stepOutput] = useMemo<
    [
      boolean,
      (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
      Output?
    ]
  >(() => {
    if (typeof value === "string") {
      const result = /^\{\{(__(\w+).*)\}\}$/.exec(value);
      if (result) {
        const [, key, id] = result;
        const newID = !isNaN(Number(id)) ? id : "1000";

        // 找到最精确的匹配项（最长的匹配前缀）
        let bestMatch: any = null;
        
        Object.entries(stepOutputs).forEach(([id, val]) => {
          if (key.startsWith(id)) {
            const differentPart = key.substring(id.length);
            // 检查是否比当前最佳匹配更精确（匹配长度更长）
            if (!bestMatch || id.length > bestMatch.id.length) {
              bestMatch = {
                id,
                value: val,
                differentPart: differentPart.startsWith(".") ? differentPart.substring(1) : differentPart
              };
            }
          }
        });

        const outputsNew = bestMatch ? [{
          key,
          value: bestMatch.value,
          differentPart: bestMatch.differentPart
        }] : [];
        setVariableVal({...variableVal, addVal: outputsNew[0]?.differentPart})

        return [
          true,
          stepNodes[newID] as
            | TriggerStepNode
            | ExecutorStepNode
            | DataSourceStepNode,
          stepOutputs[key] || outputsNew[0]?.value,
        ];
      }
    }
    return [false];
  }, [value, stepNodes, stepOutputs]);

  const te = useTranslateExtension(stepNode?.extension?.name);
  const parent = (stepNode as DataSourceStepNode)?.parent;

  const [name, icon] = useMemo(() => {
    if (parent?.action && parent?.extension) {
      return [
        et(
          parent.extension.name,
          isFunction(parent.action.name)
            ? parent.action.name(globalConfig)
            : parent.action.name
        ),
        parent.action.icon,
      ];
    }

    if (stepNode?.action && stepNode?.extension) {
      return [
        et(
          stepNode.extension.name,
          isFunction(stepNode.action.name)
            ? stepNode.action.name(globalConfig)
            : stepNode.action.name
        ),
        stepNode.action.icon,
      ];
    }
    if (stepNode?.action) {
      return [stepNode.action.name, stepNode.action.icon];
    }
    return [undefined, undefined];
  }, [
    globalConfig,
    et,
    parent?.action,
    parent?.extension,
    stepNode?.action,
    stepNode?.extension,
  ]);

  // const isVariable =
  //     typeof value === "string" && (/^\{\{(__(\d+).*)\}\}$/.test(value) || /^\{\{(__[a-z_]+)\}\}$/.exec(value))

  // console.log(555,stepNode, stepOutput, stepNodes, stepOutputs);

  return (
    <div
      style={{display:'inline-block'}}
      title={
        stepNode &&
        stepOutput &&
        `${name} | ${
          stepOutput?.isCustom ? stepOutput.name : te(stepOutput.name)
        }`
      }
    >
      {isVariable && (
        <div key={value}>
          {stepNode && stepOutput ? (
            <span className={styles.variableTag}>
              {stepNode.index + 1}.&nbsp;
              <img
                className={styles.variableIcon}
                src={icon}
                alt={name}
                style={{
                  width: "12px",
                  height: "12px",
                  verticalAlign: "baseline",
                }}
              />
              &nbsp;
              {name}
              &nbsp;|&nbsp;
              {stepOutput?.isCustom ? stepOutput.name : te(stepOutput.name)}
              {variableVal?.addVal && `.${variableVal?.addVal}`}
            </span>
          ) : (
            <span className={styles.variableTag}>     
              {t("editor.formItem.unknownVariable", "不存在变量")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
