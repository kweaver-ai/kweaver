import { useTranslate } from "@applet/common";
import { SearchOutlined } from "@applet/icons";
import { Button, Collapse, Input, InputRef, Modal } from "antd";
import CollapsePanel, {
  CollapsePanelProps,
} from "antd/es/collapse/CollapsePanel";
import {
  CSSProperties,
  FC,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExtensionContext,
  useExtensionTranslateFn,
  useTranslateExtension,
} from "../extension-provider";
import {
  DataSourceStepNode,
  ExecutorStepNode,
  LoopOperator,
  StepNodeList,
  TriggerStepNode,
} from "./expr";
import styles from "./editor.module.less";
import { EditorContext } from "./editor-context";
import { Output, TriggerAction } from "../extension";
import Empty from "../../assets/empty.png";
import EmptySearch from "../../assets/empty-search.png";
import { isFunction } from "lodash";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VariablePickerOptions {
  targetRect?: Rect;
  width?: number;
  height?: number;
  loop?: boolean;
}

export interface VariablePickerProps extends VariablePickerOptions {
  type?: string | string[];
  scope?: number[];
  onFinish?(variable: string, data?: any): void;
  onCancel?(): void;
  allowOperator?: string[];
}

export enum NodeRelation {
  // 在循环内且在同一作用域
  IN_LOOP_SAME_SCOPE = "IN_LOOP_SAME_SCOPE",
  // 在循环外且在同一作用域
  OUT_LOOP_SAME_SCOPE = "OUT_LOOP_SAME_SCOPE",
  // 不在同一作用域
  DIFFERENT_SCOPE = "DIFFERENT_SCOPE",
}

export function calculateNodeRelation(
  scope: number[] | undefined,
  path: number[]
): NodeRelation {
  // 如果没有scope，说明没有作用域限制
  if (scope === undefined || scope.length === 0) {
    return NodeRelation.DIFFERENT_SCOPE;
  }

  // 如果path长度大于scope长度，说明path是scope的子路径
  if (path.length > scope.length) {
    // 检查前缀是否匹配
    for (let i = 0; i < scope.length; i++) {
      if (scope[i] !== path[i]) {
        return NodeRelation.DIFFERENT_SCOPE;
      }
    }
    return NodeRelation.IN_LOOP_SAME_SCOPE;
  }

  // 如果path长度等于scope长度，说明在同一层级
  if (path.length === scope.length) {
    // 检查是否完全匹配
    for (let i = 0; i < path.length - 1; i++) {
      if (scope[i] !== path[i]) {
        return NodeRelation.DIFFERENT_SCOPE;
      }
    }
    if (path[path.length - 1] >= scope[path.length - 1]) {
      return NodeRelation.DIFFERENT_SCOPE;
    }
    return NodeRelation.OUT_LOOP_SAME_SCOPE;
  }

  // 如果path长度小于scope长度，需要检查path是否是scope的前缀
  for (let i = 0; i < path.length; i++) {
    if (scope[i] !== path[i]) {
      return NodeRelation.DIFFERENT_SCOPE;
    }
  }

  // 如果path是scope的前缀，说明在循环内
  return NodeRelation.IN_LOOP_SAME_SCOPE;
}

export function isLoopVarAccessible(
  scope: number[] | undefined,
  path: number[],
  loop: boolean = false
) {
  if (!loop) {
    return false;
  }
  return calculateNodeRelation(scope, path) !== NodeRelation.DIFFERENT_SCOPE;
}

export function isAccessable(
  scope: number[] | undefined,
  path: number[],
  loopScope: boolean = false
) {
  if (scope === undefined || scope.length === 0) {
    return true;
  }

  if (loopScope) {
    if (path.length > scope.length) {
      for (let i = 0; i < scope.length; i++) {
        if (scope[i] !== path[i]) return false;
      }
      return true;
    }
    return false;
  }

  for (let i = 0; i < path.length - 1; i += 1) {
    if (scope[i] !== path[i]) {
      return false;
    }
  }

  if (path[path.length - 1] >= scope[path.length - 1]) {
    return false;
  }

  return true;
}

export const VariablePicker: FC<VariablePickerProps> = ({
  targetRect,
  width,
  height = 400,
  type,
  scope,
  loop = false,
  onFinish,
  onCancel,
  allowOperator,
}) => {
  const { stepNodes } = useContext(EditorContext);
  const t = useTranslate();
  const style = useMemo<CSSProperties>(() => {
    const style: CSSProperties = {
      height,
      paddingBottom: 0,
    };

    if (targetRect) {
      style.position = "absolute";

      if (targetRect.top + targetRect.height + height <= window.innerHeight) {
        style.top = targetRect.top + targetRect.height;
      } else {
        style.top = Math.max(targetRect.top - height, 0);
      }

      style.maxWidth = width || targetRect?.width || 432;
      style.margin = 0;
      style.right = window.innerWidth - targetRect.left - targetRect.width;
    }

    return style;
  }, [targetRect, height, width]);

  const inputRef = useRef<InputRef>(null);

  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [searchKey, setSearchKey] = useState("");

  const filterred = useMemo(() => {
    // const targetTypes = (Array.isArray(type) ? type : [type]).filter(Boolean);
    const targetTypes: any = [];
    // targetTypes.push('any','json','array')
    return stepNodes
      .filter((item) => {
        if (
          item &&
          (item.type === "trigger" ||
            item.type === "executor" ||
            item.type === "globalVariable") &&
          item.step.operator &&
          (!allowOperator || allowOperator.includes(item.step.operator))
        ) {
          if (item.step.operator === LoopOperator && !loop) {
            return isLoopVarAccessible(scope, item.path, true);
          }

          if (!isAccessable(scope, item.path, loop)) {
            return false;
          }

          if (item.outputs.length) {
            return (
              !targetTypes.length ||
              item.outputs.some(
                (output) => !output.type || targetTypes.includes(output.type)
              )
            );
          }

          if (
            item.type === "trigger" &&
            item.action?.allowDataSource &&
            item.step.dataSource
          ) {
            const dataSourceStepNode = stepNodes[
              item.step.dataSource.id
            ] as DataSourceStepNode;
            if (dataSourceStepNode?.outputs?.length) {
              return (
                !targetTypes.length ||
                dataSourceStepNode.outputs.some(
                  (output) => !output.type || targetTypes.includes(output.type)
                )
              );
            }
          }
        }
        return false;
      })
      .sort((a, b) => a!.index - b!.index) as (
      | TriggerStepNode
      | ExecutorStepNode
    )[];
  }, [stepNodes, scope, type, allowOperator]);

  useLayoutEffect(() => {
    setActiveKey(filterred.map((item) => item.step.id));
  }, [filterred, scope, searchKey]);

  useLayoutEffect(() => {
    setSearchKey("");
    inputRef.current?.focus();
  }, [scope]);

  return (
    <Modal
      open={!!scope}
      style={style}
      transitionName=""
      onCancel={() => onCancel && onCancel()}
      mask={false}
      maskClosable={true}
      footer={null}
      title={null}
      closable={false}
      width={width || targetRect?.width || 432}
      zIndex={1001}
      className={styles.variablePicker}
      destroyOnClose
    >
      <Input
        prefix={<SearchOutlined />}
        className={styles.searchBox}
        value={searchKey}
        placeholder={t("editor.variablePickerPlaceholder", "搜索变量名称")}
        allowClear
        ref={inputRef}
        onChange={(e) => setSearchKey(e.target.value)}
      />
      <div className={styles.variableGroupsContainer}>
        <Collapse
          className={styles.variableGroups}
          expandIconPosition="end"
          ghost
          activeKey={activeKey}
          onChange={(key) =>
            setActiveKey(typeof key === "string" ? [key] : key)
          }
        >
          {filterred.map((item) => (
            <VariablePanel
              type={type}
              key={item.step.id}
              searchKey={searchKey}
              stepNodes={stepNodes}
              stepNode={item}
              className={styles.variableGroup}
              onPick={onFinish}
              scope={scope}
            />
          ))}
          <div className={styles.empty}>
            {searchKey ? (
              <>
                <img
                  src={EmptySearch}
                  alt=""
                  className={styles.emptyIcon}
                  style={{ paddingTop: 19 }}
                  key={1}
                />
                {t("editor.variablePickerSearchEmpty", "暂无搜索结果")}
              </>
            ) : (
              <>
                <img src={Empty} alt="" className={styles.emptyIcon} key={2} />
                {t("editor.variablePickerEmpty", "暂无可用变量")}
              </>
            )}
          </div>
        </Collapse>
      </div>
    </Modal>
  );
};

interface VariablePanelProps extends Omit<CollapsePanelProps, "header"> {
  type?: string | string[];
  searchKey: string;
  stepNode: TriggerStepNode | ExecutorStepNode;
  stepNodes: StepNodeList;
  onPick?(variable: string, data?: any): void;
  scope?: number[];
}

const VariablePanel: FC<VariablePanelProps> = ({
  type,
  stepNodes,
  searchKey,
  stepNode,
  onPick,
  scope,
  ...props
}) => {
  const { step, action, extension, path, outputs: nodeOutputs } = stepNode;
  const te = useTranslateExtension(extension?.name);
  const et = useExtensionTranslateFn();
  const { globalConfig } = useContext(ExtensionContext);

  const relation = calculateNodeRelation(scope, path);

  const outputs = useMemo<Output[]>(() => {
    const items: Output[] = [];
    // const types = (Array.isArray(type) ? type : [type]).filter(Boolean); 
    const types: any = []

    const re = new RegExp(searchKey);
    if (nodeOutputs.length) {
      nodeOutputs.forEach((output) => {
        const localizedName = output?.isCustom ? output.name : te(output.name);
        if (
          (!searchKey || re.test(localizedName)) &&
          (!types.length || !output.type || types.includes(output.type))
        ) {
          if (step.operator !== LoopOperator) {
            items.push({
              key: `__${step.id}${output.key}`,
              name: searchKey
                ? localizedName.replace(re, (v) => `<em>${v}</em>`)
                : localizedName,
              type: output.type
            });
            return;
          }
          if (
            relation === NodeRelation.IN_LOOP_SAME_SCOPE &&
            (output.key === ".value" || output.key === ".index")
          ) {
            items.push({
              key: `__${step.id}${output.key}`,
              name: searchKey
                ? localizedName.replace(re, (v) => `<em>${v}</em>`)
                : localizedName,
              type: output.type
            });
            return;
          }

          if (
            relation === NodeRelation.OUT_LOOP_SAME_SCOPE &&
            output.key !== ".value" &&
            output.key !== ".index"
          ) {
            items.push({
              key: `__${step.id}${output.key}`,
              name: searchKey
                ? localizedName.replace(re, (v) => `<em>${v}</em>`)
                : localizedName,
              type: output.type
            });
            return;
          }
        }
      });
    }

    if ((action as TriggerAction)?.allowDataSource && step.dataSource?.id) {
      const dataSourceNode = stepNodes[
        step.dataSource.id
      ] as DataSourceStepNode;
      if (dataSourceNode.outputs.length) {
        dataSourceNode.outputs.forEach((output) => {
          const localizedName = et(dataSourceNode.extension?.name, output.name);
          if (
            (!searchKey || re.test(localizedName)) &&
            (!types.length || !output.type || types.includes(output.type))
          ) {
            items.push({
              key: `__${step.dataSource!.id}${output.key}`,
              name: searchKey
                ? localizedName.replace(re, (v) => `<em>${v}</em>`)
                : localizedName,
              type: output.type
            });
          }
        });
      }
    }
    return items;
  }, [searchKey, te, action, et, step.id, step.dataSource, stepNodes, type]);

  const actionName = isFunction(action!.name)
    ? te(action!.name(globalConfig))
    : te(action!.name);

  if (outputs?.length) {
    return (
      <CollapsePanel
        header={
          <div className={styles.variableGroupTitle} title={actionName}>
            <span className={styles.index}>{stepNode.index + 1}.</span>
            <img className={styles.icon} src={action?.icon} alt={actionName} />
            <span className={styles.text}>{`${actionName}`}</span>
          </div>
        }
        {...props}
      >
        {outputs.map((output) => (
          <div className={styles.variableRow}>
            <Button
              type="link"
              className={styles.variableItem}
              onClick={() => {
                onPick && onPick(output.key, output);
              }}
            >
              <span
                title={output.name}
                className={styles.variableName}
                dangerouslySetInnerHTML={{
                  __html: output.name,
                }}
              />
            </Button>
          </div>
        ))}
      </CollapsePanel>
    );
  }

  return null;
};
