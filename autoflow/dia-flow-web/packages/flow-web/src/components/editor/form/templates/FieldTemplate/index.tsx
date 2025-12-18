import { Button, Form } from "antd";
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
  GenericObjectType,
  ErrorSchema,
} from "@rjsf/utils";
import styles from "./FieldTemplate.module.less";
import { useTranslate } from "@applet/common";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { StepConfigContext } from "../../../step-config-context";
import { EditorContext } from "../../../editor-context";
import {
  DataSourceStepNode,
  ExecutorStepNode,
  TriggerStepNode,
} from "../../../expr";
import { Output } from "../../../../extension";
import { VariableInput } from "../../../form-item";

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

export const FieldContext = createContext({
  onChange(
    value: any,
    es?: ErrorSchema<any> | undefined,
    id?: string | undefined
  ) {},
});

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const {
    formData,
    onChange,
    children,
    classNames,
    style,
    description,
    disabled,
    displayLabel,
    errors,
    formContext,
    help,
    hidden,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    rawErrors,
    rawDescription,
    rawHelp,
    readonly,
    registry,
    required,
    schema,
    uiSchema,
  } = props;
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    descriptionLocation = "below",
  } = formContext as GenericObjectType;

  const t = useTranslate();
  const variablePickerAnchorRef = useRef<HTMLDivElement>(null);
  const { step } = useContext(StepConfigContext);
  const { pickVariable, stepNodes, stepOutputs } = useContext(EditorContext);
  const [isPicking, setIsPicking] = useState(false);
  const [variableVal, setVariableVal] = useState<any>();

  const [isVariable, stepNode, stepOutput] = useMemo<
    [
      boolean,
      (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
      Output?
    ]
  >(() => {
    if (typeof formData === "string") {
       const result = /^\{\{(__(\w+).*)\}\}$/.exec(formData);

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
  }, [formData, stepNodes, stepOutputs]);

  const onPickVariable = () => {
    setIsPicking(true);
    // 先渲染VariableInput避免弹窗位置间距太大
    setTimeout(() => {
      const targetRect =
        variablePickerAnchorRef.current?.getBoundingClientRect();
      pickVariable((step && stepNodes[step.id]?.path) || [], schema.type, {
        targetRect,
      })
        .then((value) => {
          onChange(`{{${value}}}` as any);
        })
        .finally(() => {
          setIsPicking(false);
        });
    }, 50);
  };

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    "WrapIfAdditionalTemplate",
    T,
    S,
    F
  >("WrapIfAdditionalTemplate", registry, uiOptions);

  if (hidden) {
    return <div className="field-hidden">{children}</div>;
  }

  // check to see if there is rawDescription(string) before using description(ReactNode)
  // to prevent showing a blank description area
  const descriptionNode = rawDescription ? description : undefined;
  const descriptionProps: GenericObjectType = {};
  switch (descriptionLocation) {
    case "tooltip":
      descriptionProps.tooltip = descriptionNode;
      break;
    case "below":
    default:
      descriptionProps.extra = descriptionNode;
      break;
  }

  return (
    <FieldContext.Provider value={{ onChange }}>
      <WrapIfAdditionalTemplate
        classNames={classNames}
        style={style}
        disabled={disabled}
        id={id}
        label={label}
        onDropPropertyClick={onDropPropertyClick}
        onKeyChange={onKeyChange}
        readonly={readonly}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      >
        <div className={styles.FormItemWrapper}>
          <Form.Item
            colon={colon}
            hasFeedback={schema.type !== "array" && schema.type !== "object"}
            help={
              (!!rawHelp && help) || (rawErrors?.length ? errors : undefined)
            }
            htmlFor={id}
            label={displayLabel && label}
            labelCol={labelCol}
            required={required}
            style={wrapperStyle}
            validateStatus={rawErrors?.length ? "error" : undefined}
            wrapperCol={wrapperCol}
            {...descriptionProps}
          >
            {isVariable || isPicking ? (
              <>
                {(schema.type === "array" || schema.type === "object") && (
                  <div>
                    <div style={{ paddingBottom: "8px" }}>
                      {required && <span style={{ color: "red" }}>*</span>}{" "}
                      {label}
                    </div>
                    <div style={{ paddingBottom: "8px" }}>{description}</div>
                  </div>
                )}
                <div ref={variablePickerAnchorRef}>
                  <VariableInput
                    value={typeof formData === "string" ? formData : undefined}
                    onChange={onChange as unknown as (value?: string) => void}
                    scope={(step && stepNodes[step.id]?.path) || []}
                    stepNode={stepNode}
                    stepOutput={stepOutput}
                    variableVal={variableVal}
                  />
                </div>
              </>
            ) : (
              children
            )}
          </Form.Item>

          {schema.type !== "array" && schema.type !== "object" && (
            <Button
              type="link"
              className={styles.VarButton}
              onClick={onPickVariable}
            >
              {t("editor.formItem.pickVariable", "选择变量")}
            </Button>
          )}
        </div>
      </WrapIfAdditionalTemplate>
    </FieldContext.Provider>
  );
}
