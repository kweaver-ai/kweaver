import {
    getTemplate,
    getUiOptions,
    ArrayFieldTemplateProps,
    ArrayFieldTemplateItemType,
    FormContextType,
    GenericObjectType,
    RJSFSchema,
    StrictRJSFSchema,
    ID_KEY
} from '@rjsf/utils';
import classNames from 'clsx';
import { Col, Row, ConfigProvider, Button } from 'antd';
import { useContext, useMemo, useRef, useState } from 'react';
import { useTranslate } from '@applet/common';
import { StepConfigContext } from '../../../step-config-context';
import { EditorContext } from '../../../editor-context';
import { DataSourceStepNode, ExecutorStepNode, TriggerStepNode } from '../../../expr';
import { Output } from '../../../../extension';
import styles from "./ArrayFieldTemplate.module.less"
import { VariableInput } from '../../../form-item';
import { FieldContext } from '../FieldTemplate';

const DESCRIPTION_COL_STYLE = {
    paddingBottom: '8px',
};

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldTemplate<
    T = any,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
    const {
        formData,
        canAdd,
        className,
        disabled,
        formContext,
        idSchema,
        items,
        onAddClick,
        readonly,
        registry,
        required,
        schema,
        title,
        uiSchema,
    } = props;

    const { onChange } = useContext(FieldContext)
    const t = useTranslate()
    const variablePickerAnchorRef = useRef<HTMLDivElement>(null)
    const { step } = useContext(StepConfigContext);
    const { pickVariable, stepNodes, stepOutputs } = useContext(EditorContext);
    const [isPicking, setIsPicking] = useState(false);
    const [isVariable, stepNode, stepOutput] = useMemo<
        [
            boolean,
            (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
            Output?
        ]
    >(() => {
        if (typeof formData === "string") {
            const result = /^\{\{(__(\d+).*)\}\}$/.exec(formData);
            if (result) {
                const [, key, id] = result;
                return [
                    true,
                    stepNodes[id] as
                    | TriggerStepNode
                    | ExecutorStepNode
                    | DataSourceStepNode,
                    stepOutputs[key],
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
            pickVariable(
                (step && stepNodes[step.id]?.path) || [],
                schema.type,
                {
                    targetRect,
                }
            )
                .then((value) => {
                    onChange(`{{${value}}}`)
                })
                .finally(() => {
                    setIsPicking(false);
                });
        }, 50);
    }

    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
        'ArrayFieldDescriptionTemplate',
        registry,
        uiOptions
    );
    const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
        'ArrayFieldItemTemplate',
        registry,
        uiOptions
    );
    const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
        'ArrayFieldTitleTemplate',
        registry,
        uiOptions
    );
    // Button templates are not overridden in the uiSchema
    const {
        ButtonTemplates: { AddButton },
    } = registry.templates;
    const { labelAlign = 'right', rowGutter = 24 } = formContext || {} as GenericObjectType;

    const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
    const prefixCls = getPrefixCls('form');
    const labelClsBasic = `${prefixCls}-item-label`;
    const labelColClassName = classNames(
        labelClsBasic,
        labelAlign === 'left' && `${labelClsBasic}-left`,
        // labelCol.className,
        styles.LabelCol
    );

    return (
        <fieldset className={className} id={idSchema.$id}>
            <Row gutter={rowGutter}>

                <Col className={labelColClassName} span={24}>
                    {(uiOptions.title || title) && (
                        <ArrayFieldTitleTemplate
                            idSchema={idSchema}
                            required={required}
                            title={uiOptions.title || title}
                            schema={schema}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    )}
                    <Button
                        type="link"
                        className={styles.VarButton}
                        onClick={onPickVariable}
                    >
                        {t("editor.formItem.pickVariable", "选择变量")}
                    </Button>
                </Col>
                {(uiOptions.description || schema.description) && (
                    <Col span={24} style={DESCRIPTION_COL_STYLE}>
                        <ArrayFieldDescriptionTemplate
                            description={uiOptions.description || schema.description}
                            idSchema={idSchema}
                            schema={schema}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    </Col>
                )}

                {
                    isVariable || isPicking ?
                        <Col span={24}>
                            <div ref={variablePickerAnchorRef}>
                                <VariableInput
                                    value={typeof formData === "string" ? formData : undefined}
                                    onChange={v => {
                                        onChange(v || Array.from({ length: Array.isArray(schema.items) ? schema.items.length : 0 }), undefined, idSchema[ID_KEY])
                                    }}
                                    scope={(step && stepNodes[step.id]?.path) || []}
                                    stepNode={stepNode}
                                    stepOutput={stepOutput}
                                />
                            </div>
                        </Col> :
                        <>
                            <Col className='row array-item-list' span={24}>
                                {items &&
                                    items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
                                        <ArrayFieldItemTemplate key={key} {...itemProps} />
                                    ))}
                            </Col>

                            {canAdd && (
                                <Col span={24}>
                                    <Row gutter={rowGutter} justify='end'>
                                        <Col flex='192px'>
                                            <AddButton
                                                className='array-item-add'
                                                disabled={disabled || readonly}
                                                onClick={onAddClick}
                                                uiSchema={uiSchema}
                                                registry={registry}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            )}
                        </>
                }
            </Row>
        </fieldset>
    );
}
