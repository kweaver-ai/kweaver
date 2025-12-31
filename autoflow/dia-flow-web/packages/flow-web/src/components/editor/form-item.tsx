import {
  Button,
  Form,
  FormItemProps as AntFormItemProps,
  Select,
  Tooltip,
} from "antd";
import { NamePath } from "antd/es/form/interface";
import clsx from "clsx";
import {
  FC,
  forwardRef,
  useContext,
  useMemo,
  Children,
  isValidElement,
  cloneElement,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { EditorContext } from "./editor-context";
import {
  DataSourceStepNode,
  ExecutorStepNode,
  LoopOperator,
  TriggerStepNode,
} from "./expr";
import styles from "./editor.module.less";
import {
  ExtensionContext,
  useExtensionTranslateFn,
  useTranslateExtension,
} from "../extension-provider";
import { Output } from "../extension";
import { useTranslate } from "@applet/common";
import { StepConfigContext } from "./step-config-context";
import { FieldContext } from "rc-field-form";
import {
  calculateNodeRelation,
  NodeRelation,
  isAccessable,
  isLoopVarAccessible,
} from "./variable-picker";
import { isFunction } from "lodash";
import { VariableEditorModal } from "../../extensions/ai/variable-editor-modal";

export const FormItem: FC<FormItemProps> = ({
  allowVariable,
  allowOperator,
  name,
  className,
  ...props
}) => {
  if (name !== undefined && allowVariable) {
    return (
      <FormItemWithVariable name={name} className={className} {...props} allowOperator={allowOperator} />
    );
  }
  return (
    <Form.Item
      name={name}
      className={clsx(styles.formItem, className)}
      {...props}
    />
  );
};

interface FormItemProps extends AntFormItemProps {
  type?: string | string[];
  allowVariable?: boolean;
  allowOperator?: string[];
}

export const FormItemWithVariable: FC<FormItemProps & { name: NamePath }> = ({
  type,
  allowVariable = true,
  name,
  children,
  extra,
  className,
  rules,
  allowOperator,
  ...props
}) => {
  const { step } = useContext(StepConfigContext);
  const { pickVariable, stepNodes, stepOutputs } = useContext(EditorContext);
  const form = Form.useFormInstance();
  const field = useContext(FieldContext);
  const [variableVal, setVariableVal] = useState<any>();

  const namepath = useMemo(
    () =>
      field.prefixName
        ? [...field.prefixName, ...(Array.isArray(name) ? name : [name])]
        : name,
    [field.prefixName, name]
  );

  const value = Form.useWatch(namepath, form);

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
        const newID = !isNaN(Number(id)) ? id : "1000"; //处理全局变量的情况
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

        setVariableVal({
          ...variableVal,
          addVal: outputsNew[0]?.differentPart,
        });

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

  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslate();
  const [isPicking, setIsPicking] = useState(false);

  return (
    <Form.Item
      {...props}
      name={name}
      rules={
        isVariable
          ? [
              {
                async validator() {
                  if (!stepOutput) {
                    throw new Error(
                      t(
                        "editor.formItem.variableNotExist",
                        "已选变量不存在，请重新选择"
                      )
                    );
                  } else if (
                    step &&
                    stepNode &&
                    !isAccessable(stepNodes[step.id]?.path, stepNode.path) &&
                    !isLoopVarAccessible(
                      stepNodes[step.id]!.path,
                      stepNode.path,
                      stepNode.step?.operator === LoopOperator
                    )
                  ) {
                    throw new Error(
                      t(
                        "editor.formItem.variableInvalid",
                        "无法选择当前节点之后的变量，请重新选择"
                      )
                    );
                  }
                  return true;
                },
              },
            ]
          : rules
      }
      className={clsx(
        styles.formItem,
        allowVariable && styles.hasVariable,
        className
      )}
      extra={
        <Button
          type="link"
          onClick={() => {
            setIsPicking(true);
            // 先渲染VariableInput避免弹窗位置间距太大
            setTimeout(() => {
              const targetRect = ref.current?.getBoundingClientRect();
              pickVariable((step && stepNodes[step.id]?.path) || [], type, {
                targetRect,
              }, allowOperator)
                .then((value) => {
                  form.setFieldValue(namepath, `{{${value}}}`);
                  form.validateFields([namepath]);
                })
                .finally(() => {
                  setIsPicking(false);
                });
            }, 50);
          }}
        >
          {t("editor.formItem.pickVariable", "选择变量")}
        </Button>
      }
    >
      <FormItemInputWrapper ref={ref}>
        {isVariable || isPicking ? (
          <VariableInput
            scope={(step && stepNodes[step.id]?.path) || []}
            stepNode={stepNode}
            stepOutput={stepOutput}
            variableVal={variableVal}
          />
        ) : (
          children
        )}
      </FormItemInputWrapper>
    </Form.Item>
  );
};

interface VariableInputProps {
  scope: number[];
  stepNode?: TriggerStepNode | ExecutorStepNode | DataSourceStepNode;
  stepOutput?: Output;
  value?: string;
  onChange?(value?: string): void;
  variableVal?: any;
}

const FormItemInputWrapper = forwardRef<HTMLDivElement, any>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref}>
        {Children.only(children) && isValidElement(children)
          ? cloneElement(children, props)
          : children}
      </div>
    );
  }
);

export const VariableInput: FC<VariableInputProps> = ({
  scope,
  value,
  stepNode,
  stepOutput,
  onChange,
  variableVal,
}) => {
  const t = useTranslate();
  const te = useTranslateExtension(stepNode?.extension?.name);
  const et = useExtensionTranslateFn();
  const parent = (stepNode as DataSourceStepNode)?.parent;
  const { globalConfig } = useContext(ExtensionContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState<any>();
  //   const [variableVal, setVariableVal] = useState<any>();
  const [valueNew, setValueNew] = useState<any>(typeof value === 'string' ? value?.replace(/{{|}}/g, "") : "");

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

  const isVariable =
    typeof value === "string" &&
    (/^\{\{(__(\d+).*)\}\}$/.test(value) ||
      /^\{\{(__[a-z_]+)\}\}$/.exec(value));

  useEffect(() => {
    // setVariableVal({});
    const val = typeof value === 'string' ? value?.replace(/{{|}}/g, "") : "";
    setValueNew(val);
    setEditingVariable({
      value: val,
      addVal: variableVal?.addVal,
    });
  }, [value]);

  const handleConfirm = (newVariable: any) => {
    // setVariableVal(newVariable);
    setValueNew(newVariable?.value);
    setEditingVariable({
      value: newVariable?.value,
      addVal: variableVal?.addVal,
    });

    setModalVisible(false);
    onChange?.(`{{${newVariable?.value}}}`);
  };

  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  const clickVariable = () => {
    setModalVisible(true);
  };

  return (
    <div
      title={
        stepNode &&
        stepOutput &&
        `${name} | ${
          stepOutput?.isCustom ? stepOutput.name : te(stepOutput.name)
        }`
      }
    >
      <Select
        value={isVariable ? [`{{${valueNew}}}`] : []}
        searchValue=""
        mode="tags"
        maxTagCount={1}
        open={false}
        allowClear
        className={clsx(
          styles.variableInput,
          (!stepOutput ||
            (!isAccessable(scope, stepNode!.path) &&
              !isLoopVarAccessible(
                scope,
                stepNode!.path,
                stepNode?.step?.operator === LoopOperator
              ))) &&
            styles.invalid
        )}
        placeholder={t("editor.formItem.variablePlaceholder", "请选择变量")}
        onChange={(value) => {
          if (typeof onChange === "function") {
            onChange(Array.isArray(value) ? value[0] : `{{${valueNew}}}`);
          }
        }}
      >
        {isVariable && (
          <Select.Option key={value}>
            {stepNode && stepOutput ? (
              <Tooltip
                placement="bottom"
                title={
                  typeof stepOutput?.type === "string" &&
                  ["array", "object", "any"].includes(stepOutput?.type) &&
                  "点击可进入变量编辑"
                }
              >
                <span
                  className={styles.variableTag}
                  onClick={() => {
                    typeof stepOutput?.type === "string" &&
                      ["array", "object", "any"].includes(stepOutput?.type) &&
                      clickVariable();
                  }}
                >
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
              </Tooltip>
            ) : (
              <span className={styles.variableTag}>
                {t("editor.formItem.unknownVariable", "不存在变量")}
              </span>
            )}
          </Select.Option>
        )}
      </Select>
      {modalVisible && (
        <VariableEditorModal
          visible={modalVisible}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          initialVariable={editingVariable}
        />
      )}
    </div>
  );
};
