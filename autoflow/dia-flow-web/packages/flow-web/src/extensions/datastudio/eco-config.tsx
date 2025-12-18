import {
    ForwardedRef,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
} from "react";
import { Executor, ExecutorActionConfigProps, Validatable } from "../../components/extension";
import DataBaseSVG from './assets/database.svg'
import { Form, Input, Select } from "antd";
import { useForm } from "antd/es/form/Form";
import { FormItem } from "../../components/editor/form-item";

const useConfigForm = (parameters: any, ref: ForwardedRef<Validatable>) => {
    const [form] = useForm()

    useImperativeHandle(ref, () => {
        return {
            validate() {
                return form.validateFields().then(
                    () => true,
                    () => false
                )
            }
        }
    })

    useLayoutEffect(() => {
        form.setFieldsValue(parameters)
    }, [form, parameters])

    return form
}

const Options = [
    {
        value: "all",
        label: "ecconfig.type.all",
    },
    {
        value: "content",
        label: "ecconfig.type.content"
    },
    {
        value: "image",
        label: "ecconfig.type.image"
    },
    {
        value: "ocr",
        label: "ecconfig.type.ocr"
    },
    {
        value: "cad",
        label: "ecconfig.type.cad"
    },
    {
        value: "catalog",
        label: "ecconfig.type.catalog"
    },
    {
        value: "base",
        label: "ecconfig.type.base"
    },
    {
        value: "slice_vector",
        label: "ecconfig.type.slice_vector"
    }
]

export const EcoConfigExecutorActions: Executor[] = [
    {
        name: "ecconfig.reindex",
        description: "ecconfig.reindex.desc",
        icon: DataBaseSVG,
        actions: [
            {
                name: "ecconfig.reindex",
                description: "ecconfig.reindex.desc",
                operator: "@ecoconfig/reindex",
                icon: DataBaseSVG,
                validate(parameters) {
                    return parameters && parameters?.docid && parameters?.part_type;
                },
                outputs: [
                    {
                        name: "ecconfig.status",
                        key: ".status",
                        type: "string"
                    }
                ],
                components: {
                    Config: forwardRef(
                        (
                            {
                                t,
                                parameters = {},
                                onChange,
                            }: ExecutorActionConfigProps,
                            ref: ForwardedRef<Validatable>
                        ) => {
                            const form = useConfigForm(parameters, ref)

                            const options = useMemo(() => {
                                return Options.map((item) => {
                                    return {
                                        ...item,
                                        label: t(item.label)
                                    }
                                })
                            }, [])

                            return (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    initialValues={parameters}
                                    onFieldsChange={() => {
                                        onChange(form.getFieldsValue())
                                    }}
                                >
                                    <FormItem
                                        required
                                        label={t("eco.reindex.writeRule", "写入规则")}
                                        name="part_type"
                                        type="string"
                                        rules={[
                                            {
                                                required: true,
                                                message: t("emptyMessage"),
                                            },
                                        ]}
                                    >
                                        <Select placeholder={t("db.placeSelect")} options={options} />
                                    </FormItem>
                                    <FormItem
                                        required
                                        label={t("eco.reindex.docid", "待更新的数据")}
                                        name="docid"
                                        allowVariable
                                        type="string"
                                        rules={[
                                            {
                                                required: true,
                                                message: t("emptyMessage"),
                                            },
                                        ]}
                                    >
                                        <Input
                                            autoComplete="off"
                                            placeholder={t("db.placeSelect")}
                                        />
                                    </FormItem>
                                </Form>
                            )
                        }
                    )
                }
            }
        ]
    }
]