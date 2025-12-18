import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
} from "../../../../components/extension";
import FileSVG from "../../assets/file.svg";
import { Form, InputNumber } from "antd";
import { FormItem } from "../../../../components/editor/form-item";
import { AsFileSelect } from "../../../../components/as-file-select";
import { isVariableLike } from "../../../anyshare";
import styles from "./folder-quota.module.less";
import { useTranslate } from "@applet/common";
import { QuotaInput } from "../../../../components/params-form/as-quota";

interface FolderQuotaParameter {
    docid: string;
    quota: number;
}

export const FolderQuota: ExecutorAction = {
    name: "EAFolderQuota",
    description: "EAFolderQuotaDescription",
    operator: "@anyshare/doc/setspacequota",
    group: "security",
    icon: FileSVG,
    validate(parameters) {
        return parameters && isVariableLike(parameters.docid);
    },
    components: {
        Config: forwardRef(
            (
                {
                    t,
                    parameters,
                    onChange,
                }: ExecutorActionConfigProps<FolderQuotaParameter>,
                ref
            ) => {
                const [form] = Form.useForm();

                useImperativeHandle(ref, () => {
                    return {
                        validate() {
                            return form.validateFields().then(
                                () => true,
                                () => false
                            );
                        },
                    };
                });

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
                            required
                            label={t("folderQuota.source")}
                            name="docid"
                            allowVariable
                            type="asDoc"
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
                                selectType={2}
                                placeholder={t("folderQuota.sourcePlaceholder")}
                                selectButtonText={t("select")}
                                readOnly
                            />
                        </FormItem>
                        <FormItem
                            required
                            label={t("folderQuota.space")}
                            name="quota"
                            allowVariable
                            type="asSpaceQuota"
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                    type: "number",
                                },
                            ]}
                        >
                            <QuotaInput />
                        </FormItem>
                    </Form>
                );
            }
        ),
    },
};
