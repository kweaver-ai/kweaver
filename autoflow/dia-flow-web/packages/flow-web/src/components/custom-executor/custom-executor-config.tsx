import { forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber } from "antd";
import { DatePickerISO, useTranslate } from "@applet/common";
import { ExecutorActionDto } from "../../models/executor-action-dto";
import { FormItem } from "../editor/form-item";
import { getTypes } from "../internal-tool/params-config";
import { ExecutorActionConfigProps } from "../extension";
import { AsFileSelect } from "../as-file-select";

export function customExecutorConfig(action: ExecutorActionDto) {
    return forwardRef(
        ({ parameters, onChange }: ExecutorActionConfigProps, ref) => {
            const t = useTranslate("customExecutor");
            const [form] = Form.useForm();

            useImperativeHandle(
                ref,
                () => {
                    return {
                        validate() {
                            return form.validateFields().then(
                                () => true,
                                () => false
                            );
                        },
                    };
                },
                [form]
            );

            if (!action.inputs?.length) {
                return null;
            }

            return (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={parameters}
                    onFieldsChange={() => {
                        onChange(form.getFieldsValue());
                    }}
                >
                    {action.inputs.map((input) => {
                        return (
                            <FormItem
                                name={input.key}
                                label={input.name}
                                rules={[
                                    {
                                        required: input.required,
                                        message: t("emptyMessage"),
                                    },
                                ]}
                                allowVariable
                                type={getTypes(input.type)}
                            >
                                {(() => {
                                    switch (input.type) {
                                        case "number":
                                            return (
                                                <InputNumber
                                                    autoComplete="off"
                                                    style={{ width: "100%" }}
                                                    placeholder={t(
                                                        "formPlaceholder",
                                                        "请输入"
                                                    )}
                                                />
                                            );
                                        case "asFile":
                                            return (
                                                <AsFileSelect
                                                    selectType={1}
                                                    multiple={false}
                                                    selectButtonText={t(
                                                        "select"
                                                    )}
                                                    title={t(
                                                        "selectFile",
                                                        "选择文件"
                                                    )}
                                                    omitUnavailableItem
                                                    omittedMessage={t(
                                                        "unavailableFilesOmitted",
                                                        "已为您过滤不存在和无访问权限的文件"
                                                    )}
                                                    placeholder={t(
                                                        "selectFilePlaceholder"
                                                    )}
                                                />
                                            );
                                        case "asFolder":
                                            return (
                                                <AsFileSelect
                                                    selectType={2}
                                                    multiple={false}
                                                    selectButtonText={t(
                                                        "select"
                                                    )}
                                                    title={t(
                                                        "selectFolder",
                                                        "选择文件夹"
                                                    )}
                                                    omitUnavailableItem
                                                    omittedMessage={t(
                                                        "unavailableFoldersOmitted",
                                                        "已为您过滤不存在和无访问权限的文件夹"
                                                    )}
                                                    placeholder={t(
                                                        "selectFolderPlaceholder",
                                                        "请选择文件夹"
                                                    )}
                                                />
                                            );
                                        case "multipleFiles":
                                            return (
                                                <AsFileSelect
                                                    selectType={1}
                                                    multiple={true}
                                                    multipleMode="list"
                                                    checkDownloadPerm={true}
                                                    title={t(
                                                        "selectFile",
                                                        "选择文件"
                                                    )}
                                                    placeholder={t(
                                                        "selectMultipleFilesPlaceholder",
                                                        "请选择"
                                                    )}
                                                />
                                            );
                                        case "datetime":
                                            return (
                                                <DatePickerISO
                                                    showTime
                                                    popupClassName="automate-oem-primary"
                                                    style={{ width: "100%" }}
                                                />
                                            );
                                        default:
                                            return (
                                                <Input
                                                    autoComplete="off"
                                                    placeholder={t(
                                                        "formPlaceholder",
                                                        "请输入"
                                                    )}
                                                />
                                            );
                                    }
                                })()}
                            </FormItem>
                        );
                    })}
                </Form>
            );
        }
    );
}
