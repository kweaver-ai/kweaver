import { Form, Select } from "antd";
import { DefaultOptionType } from "antd/lib/select";
import {
    forwardRef,
    useCallback,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { Validatable } from "../../components/extension";
import {
    ExtensionContext,
    useDataSource,
    useExtensionTranslateFn,
    useTranslateExtension,
} from "../../components/extension-provider";
import styles from "./index.module.less";
import { EditorContext } from "../../components/editor/editor-context";
import { IStep } from "../../components/editor/expr";

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
        const et = useExtensionTranslateFn();
        const te = useTranslateExtension(extension?.name);

        const getStepId = useCallback(() => {
            if (!id.current) {
                id.current = getId();
            }
            return id.current;
        }, [getId]);

        const options = useMemo(() => {
            const items: DefaultOptionType[] = [
                {
                    label: et(
                        "cron",
                        "cron.noDataSource.placeholder",
                        "不选择触发目标"
                    ),
                    value: "",
                },
            ];
            extensions.forEach(({ name, dataSources }) => {
                dataSources?.forEach((dataSource) => {
                    items.push({
                        label: (
                            <div className={styles["dataSourceConfigLabel"]}>
                                <div>{et(name, dataSource["name"])}</div>
                                {dataSource.description && (
                                    <div
                                        className={
                                            styles[
                                                "dataSourceConfigDescription"
                                            ]
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

        const [form] = Form.useForm();

        const configRef = useRef<Validatable>(null);
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
            <div className={styles["data-source-form"]}>
                <Form
                    form={form}
                    initialValues={{
                        operator: step?.operator || "",
                    }}
                    onFieldsChange={() => {
                        const { operator } = form.getFieldsValue();

                        if (!operator) {
                            onChange(undefined);
                        } else {
                            onChange({
                                id: getStepId(),
                                operator: operator,
                            });
                        }
                    }}
                    layout="vertical"
                >
                    <Form.Item
                        name="operator"
                        label={et(
                            "cron",
                            "cron.dataSourceConfig.source",
                            "触发目标"
                        )}
                        className={styles["dataSource"]}
                        required
                        style={{
                            marginBottom: operator ? 8 : undefined,
                        }}
                    >
                        <Select
                            options={options}
                            placeholder={et(
                                "cron",
                                "cron.noDataSource.placeholder",
                                "不选择触发目标"
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
