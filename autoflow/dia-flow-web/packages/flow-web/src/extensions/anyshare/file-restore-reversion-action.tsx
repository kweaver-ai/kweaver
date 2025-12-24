import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
    Validatable,
} from "../../components/extension";
import FileSVG from "./assets/file.svg";
import { Form, Input } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "@applet/common";

interface FileRestoreReversionExecutorActionParameters {
    docid: string;
    reversion: string;
}

export const FileRestoreReversionAction: ExecutorAction = {
    name: "EAFileRestoreReversion",
    description: "EAFileRestoreReversionDescription",
    operator: "@anyshare/file/restore-reversion",
    group: "file",
    icon: FileSVG,
    components: {
        Config: forwardRef<
            Validatable,
            ExecutorActionConfigProps<FileRestoreReversionExecutorActionParameters>
        >(({ t, parameters, onChange }, ref) => {
            const [form] =
                Form.useForm<FileRestoreReversionExecutorActionParameters>();

            useImperativeHandle(
                ref,
                () => {
                    return {
                        async validate() {
                            return form.validateFields().then(
                                () => true,
                                () => false
                            );
                        },
                    };
                },
                [form]
            );

            useLayoutEffect(() => {
                form.setFieldsValue(parameters);
            }, [form, parameters]);

            return (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={parameters}
                    onFieldsChange={() => {
                        onChange(form.getFieldsValue());
                    }}
                >
                    <FormItem
                        label={t("fileRestoreReversion.sourceLabel")}
                        name="docid"
                        allowVariable
                        type="asFile"
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <AsFileSelect
                            title={t("fileSelectTitle")}
                            multiple={false}
                            omitUnavailableItem
                            selectType={1}
                            placeholder={t(
                                "fileRestoreReversion.sourcePlaceholder"
                            )}
                            selectButtonText={t("select")}
                        />
                    </FormItem>
                    <FormItem
                        label={t("fileRestoreReversion.reversionLabel")}
                        name="reversion"
                        type="string"
                        allowVariable
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "fileRestoreReversion.reversionPlaceholder"
                            )}
                        />
                    </FormItem>
                </Form>
            );
        }),
    },
};
