import { useTranslate } from "@applet/common";
import { Form, Radio, Select } from "antd";
import { DefaultOptionType } from "antd/lib/select";
import {
    forwardRef,
    useCallback,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { Validatable } from "../extension";
import {
    ExtensionContext,
    useDataSource,
    useExtensionTranslateFn,
    useTranslateExtension,
} from "../extension-provider";
import { EditorContext } from "./editor-context";
import { IStep } from "./expr";
import styles from "./editor.module.less";

export interface DataSourceConfigProps {
    step?: IStep;
    onChange(step?: IStep): void;
}

export const DataSourceConfig = forwardRef<Validatable, DataSourceConfigProps>(
    ({ step, onChange }, ref) => {
        const { extensions } = useContext(ExtensionContext);
        const { getId } = useContext(EditorContext);
        const id = useRef(step?.id);
        const [dataSource, extension] = useDataSource(step?.operator);
        const Config: any = dataSource?.components?.Config;
        const t = useTranslate();
        const et = useExtensionTranslateFn();
        const te = useTranslateExtension(extension?.name);
        const options = useMemo(() => {
            const items: DefaultOptionType[] = [];
            extensions.forEach(({ name, dataSources }) => {
                dataSources?.forEach((dataSource) => {
                    items.push({
                        label: (
                            <div className={styles.dataSourceConfigLabel}>
                                <div className={styles.dataSourceConfigName}>
                                    {et(name, dataSource.name)}
                                </div>
                                {dataSource.description && (
                                    <div
                                        className={
                                            styles.dataSourceConfigDescription
                                        }
                                    >
                                        {et(name, dataSource.description)}
                                    </div>
                                )}
                            </div>
                        ),
                        value: dataSource.operator,
                    });
                });
            });
            return items;
        }, [et, extensions]);

        const getStepId = useCallback(() => {
            if (!id.current) {
                id.current = getId();
            }
            return id.current;
        }, [getId]);

        const [form] = Form.useForm();

        const configRef = useRef<Validatable>(null);
        const hasDataSource = Form.useWatch("hasDataSource", form);
        const operator = Form.useWatch("operator", form);

        useImperativeHandle(
            ref,
            () => {
                return {
                    async validate() {
                        const validateResults = await Promise.allSettled([
                            typeof configRef.current?.validate === "function"
                                ? configRef.current.validate()
                                : true,
                            form.validateFields().then(
                                () => true,
                                () => false
                            ),
                        ]);

                        return validateResults.every(
                            (v) => v.status === "fulfilled" && v.value
                        );
                    },
                };
            },
            [form]
        );

        return (
            <div>
                <Form
                    form={form}
                    initialValues={{
                        hasDataSource: !!step,
                        operator: step?.operator,
                    }}
                    onFieldsChange={() => {
                        const { hasDataSource, operator } =
                            form.getFieldsValue();
                        if (hasDataSource) {
                            onChange({
                                id: getStepId(),
                                operator: operator || "",
                            });
                        } else {
                            onChange(undefined);
                        }
                    }}
                    layout="vertical"
                >
                    <Form.Item
                        name="hasDataSource"
                        label={t(
                            "editor.dataSourceConfig.hasDataSource",
                            "执行计划"
                        )}
                    >
                        <Radio.Group>
                            <Radio value={false}>
                                {t("editor.dataSourceConfig.once", "单次执行")}
                            </Radio>
                            <Radio value={true}>
                                {t("editor.dataSourceConfig.batch", "批量执行")}
                            </Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        name="operator"
                        label={t("editor.dataSourceConfig.source", "执行目标")}
                        className="no-mark"
                        style={{
                            display: hasDataSource ? undefined : "none",
                            marginBottom: operator ? 8 : undefined,
                        }}
                        rules={[
                            {
                                required: hasDataSource,
                                message: t(
                                    "editor.dataSourceConfig.empty",
                                    "此项不允许为空"
                                ),
                            },
                        ]}
                    >
                        <Select
                            options={options}
                            placeholder={t(
                                "editor.dataSourceConfig.Placeholder",
                                "请选择执行目标"
                            )}
                        ></Select>
                    </Form.Item>
                    {Config && (
                        <Form.Item>
                            <Config
                                ref={configRef}
                                t={te}
                                action={dataSource}
                                parameters={step?.parameters}
                                onChange={(parameters: any) => {
                                    if (typeof onChange === "function") {
                                        if (!id.current) {
                                            id.current = getId();
                                        }
                                        onChange({
                                            id: id.current!,
                                            operator: dataSource!.operator,
                                            parameters,
                                        });
                                    }
                                }}
                            />
                        </Form.Item>
                    )}
                </Form>
            </div>
        );
    }
);
