import { createRef, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button, Form } from "antd";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import {
    PlusOutlined,
} from "@applet/icons";
import { ExecutorAction, TriggerActionConfigProps, Validatable } from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";
import { FieldInput } from "./components/operator-system-trigger";
import BeginTriggerSVG from "./assets/begin.svg";
import styles from "./form-trigger.module.less";
import { MicroAppContext } from "@applet/common";

interface FormTriggerParameterField {
    key: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    allowOverride?: boolean;
}

interface FormTriggerParameter {
    fields: FormTriggerParameterField[];
}

const FieldTypes:any = [
    {
        type: "string",
        label: "string",
    },
    {
        type: "number",
        label:"number",
    },

    {
        type: "object",
        label: "object",
    },
    {
        type: "array",
        label: "array",
    }
];

const OperatorFormTrigger = forwardRef<Validatable, TriggerActionConfigProps<FormTriggerParameter>>(({ t, parameters, onChange }, ref) => {
    const [form] = Form.useForm<FormTriggerParameter>();
    const [isSelecting, setIsSelecting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const refs = useMemo(() => {
        const fields = parameters?.fields?.length ? parameters?.fields : [{type:'string'}]
        return fields?.map(() => createRef<Validatable>()) || [];
    }, [parameters?.fields]);
     const { microWidgetProps } = useContext(MicroAppContext);
      const { operator_id } =
        microWidgetProps?.selectoperator || {};

    useEffect(() => {
       !operator_id && form.setFieldsValue({
            fields:[{type: "string"}],
        });
      }, [])

    useEffect(() => {
        if(parameters?.fields?.length) {
            form.setFieldsValue({
                ...parameters
            });
        }
      }, [parameters]);

    useImperativeHandle(
        ref,
        () => {
            return {
                validate() {
                    return Promise.all([
                        ...refs.map((ref:any) => typeof ref.current?.validate !== "function" || ref.current?.validate()),
                        form.validateFields().then(
                            () => true,
                            () => false
                        ),
                    ]).then((results) => results.every((r) => r));
                },
            };
        },
        [form, refs]
    );

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = "move";
        } else {
            document.body.style.cursor = "default";
        }
        return () => {
            document.body.style.cursor = "default";
        };
    }, [isDragging]);

    return (
        <Form
            form={form}
            initialValues={parameters}
            layout="vertical"
            onFieldsChange={() => {
                if (typeof onChange === "function") {
                    onChange(form.getFieldsValue());
                }
            }}
        >
            <FormItem className={styles["form-list"]}>
                <Form.List
                    name="fields"
                    rules={[
                        {
                            async validator(_, values) {
                                if (!Array.isArray(values) || values.length < 1) {
                                    throw new Error("此项不允许为空");
                                }
                            },
                        },
                    ]}
                >
                    {(fields, { add, remove, move }, { errors }) => {
                        return (
                            <>
                                <DragDropContext
                                    onDragStart={() => {
                                        setIsDragging(true);
                                    }}
                                    onDragEnd={(result) => {
                                        setIsDragging(false);
                                        if (!result.destination) {
                                            return;
                                        }

                                        move(result.source.index, result.destination.index);
                                    }}
                                >
                                    <Droppable droppableId="form-droppable">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                                {fields.map((field, index) => {
                                                    return (
                                                        <FormItem {...field}>
                                                            <FieldInput t={t} ref={refs[index]} index={index} fieldTypes={FieldTypes} onClose={() => remove(index)} fields={parameters?.fields} />
                                                        </FormItem>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                                <Form.ErrorList errors={errors} />
                                {!isSelecting && (
                                    <Button type="link" icon={<PlusOutlined className={styles["add-icon"]} />} className={styles["link-btn"]}  onClick={() => {
                                        add({
                                            type: "string",
                                        })
                                    }}>
                                        {t("fileTrigger.add", "添加参数")}
                                    </Button>
                                )}
                            </>
                        );
                    }}
                </Form.List>
            </FormItem>
        </Form>
    );
});

export const OperatorFormTriggerAction: ExecutorAction = {
    name: "开始",
    description: "TAFormDescription",
    operator: "@trigger/form",
    icon: BeginTriggerSVG,
    outputs(step) {
        if (Array.isArray(step.parameters?.fields)) {
            return [
                {
                    key: ".accessor",
                    name: "TAFormOutputAccessor",
                    type: "asUser",
                },
                ...step.parameters?.fields.map((field: FormTriggerParameterField) => {
                    return {
                        key: `.fields.${field.key}`,
                        name: field.name ||field.key,
                        type: field.type,
                        isCustom: true,
                    };
                }),
            ];
        }
        return [];
    },
    components: {
        Config: OperatorFormTrigger,
    },
};
