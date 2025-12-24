import classNames from 'clsx';
import isObject from 'lodash/isObject';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import {
    FormContextType,
    GenericObjectType,
    ObjectFieldTemplateProps,
    ObjectFieldTemplatePropertyType,
    RJSFSchema,
    StrictRJSFSchema,
    UiSchema,
    canExpand,
    descriptionId,
    getTemplate,
    getUiOptions,
    titleId,
    ID_KEY,
} from '@rjsf/utils';
import { Col, Row, ConfigProvider, Button } from 'antd';
import { useContext, useMemo, useRef, useState } from 'react';
import styles from "./ObjectFieldTemplate.module.less"
import { FieldContext } from '../FieldTemplate';
import { useTranslate } from '@applet/common';
import { StepConfigContext } from '../../../step-config-context';
import { EditorContext } from '../../../editor-context';
import { DataSourceStepNode, ExecutorStepNode, TriggerStepNode } from '../../../expr';
import { Output } from '../../../../extension';
import { VariableInput } from '../../../form-item';

const DESCRIPTION_COL_STYLE = {
    paddingBottom: '8px',
};

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
    T = any,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
    const {
        description,
        disabled,
        formContext,
        formData,
        idSchema,
        onAddClick,
        properties,
        readonly,
        required,
        registry,
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
    const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
    const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
        'DescriptionFieldTemplate',
        registry,
        uiOptions
    );
    // Button templates are not overridden in the uiSchema
    const {
        ButtonTemplates: { AddButton },
    } = registry.templates;
    const { colSpan = 24, labelAlign = 'right', rowGutter = 24 } = formContext as GenericObjectType;

    const findSchema = (element: ObjectFieldTemplatePropertyType): S => element.content.props.schema;

    const findSchemaType = (element: ObjectFieldTemplatePropertyType) => findSchema(element).type;

    const findUiSchema = (element: ObjectFieldTemplatePropertyType): UiSchema<T, S, F> | undefined =>
        element.content.props.uiSchema;

    const findUiSchemaField = (element: ObjectFieldTemplatePropertyType) => getUiOptions(findUiSchema(element)).field;

    const findUiSchemaWidget = (element: ObjectFieldTemplatePropertyType) => getUiOptions(findUiSchema(element)).widget;

    const calculateColSpan = (element: ObjectFieldTemplatePropertyType) => {
        const type = findSchemaType(element);
        const field = findUiSchemaField(element);
        const widget = findUiSchemaWidget(element);

        const defaultColSpan =
            properties.length < 2 || // Single or no field in object.
                type === 'object' ||
                type === 'array' ||
                widget === 'textarea'
                ? 24
                : 12;

        if (isObject(colSpan)) {
            const colSpanObj: GenericObjectType = colSpan;
            if (isString(widget)) {
                return colSpanObj[widget];
            }
            if (isString(field)) {
                return colSpanObj[field];
            }
            if (isString(type)) {
                return colSpanObj[type];
            }
        }
        if (isNumber(colSpan)) {
            return colSpan;
        }
        return defaultColSpan;
    };

    const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
    const prefixCls = getPrefixCls('form');
    const labelClsBasic = `${prefixCls}-item-label`;
    const labelColClassName = classNames(
        labelClsBasic,
        labelAlign === 'left' && `${labelClsBasic}-left`,
        styles.LabelCol
        // labelCol.className,
    );

    return (
        <fieldset id={idSchema.$id}>
            <Row gutter={rowGutter}>
                <Col className={labelColClassName} span={24}>
                    {title && (
                        <TitleFieldTemplate
                            id={titleId<T>(idSchema)}
                            title={title}
                            required={required}
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
                {description && (
                    <Col span={24} style={DESCRIPTION_COL_STYLE}>
                        <DescriptionFieldTemplate
                            id={descriptionId<T>(idSchema)}
                            description={description}
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
                                    onChange={v => onChange(v || {}, undefined, idSchema[ID_KEY])}
                                    scope={(step && stepNodes[step.id]?.path) || []}
                                    stepNode={stepNode}
                                    stepOutput={stepOutput}
                                />
                            </div>
                        </Col> :
                        properties
                            .filter((e) => !e.hidden)
                            .map((element: ObjectFieldTemplatePropertyType) => (
                                <Col key={element.name} span={calculateColSpan(element)}>
                                    {element.content}
                                </Col>
                            ))
                }
            </Row>

            {(isVariable || isPicking) && canExpand(schema, uiSchema, formData) && (
                <Col span={24}>
                    <Row gutter={rowGutter} justify='end'>
                        <Col flex='192px'>
                            <AddButton
                                className='object-property-expand'
                                disabled={disabled || readonly}
                                onClick={onAddClick(schema)}
                                uiSchema={uiSchema}
                                registry={registry}
                            />
                        </Col>
                    </Row>
                </Col>
            )}
        </fieldset>
    );
}
