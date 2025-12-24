import { Form, InputNumber, Typography } from "antd";
import {
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    Extension,
    Validatable,
} from "../../components/extension";
import AdminSVG from "./assets/admin.svg";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import {
    ForwardedRef,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
} from "react";
import { FormItem } from "../../components/editor/form-item";
import styles from "./index.module.less";
import { SingleUserSelect } from "./components/single-user-select";
import { isString } from "lodash";

function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
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

    useLayoutEffect(() => {
        form.setFieldsValue(parameters);
    }, [form, parameters]);

    return form;
}

const extension: Extension = {
    name: "admin",
    executors: [
        {
            name: "EAdmin",
            description: "EAdminDescription",
            icon: AdminSVG,
            actions: [
                {
                    name: "EAQuota",
                    description: "EAQuotaDescription",
                    operator: "@anyshare/doclib/quota-scale",
                    icon: AdminSVG,
                    outputs: [],
                    validate(parameters) {
                        return (
                            (parameters && parameters?.scale_size)
                        );
                    },
                    components: {
                        Config: forwardRef(
                            ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("setQuota.user")}
                                            name="user"
                                            allowVariable
                                            type="asUser"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <SingleUserSelect />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("setQuota.quota")}
                                            name="scale_size"
                                            allowVariable
                                            type="number"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: "100%" }}
                                                placeholder={t("input.placeholder")}
                                                keyboard={false}
                                                min={1}
                                                // max={1000000}
                                                precision={0}
                                                controls={false}
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
                            <table>
                                <tbody>
                                    {Object.keys(input).map((item) => {
                                        let label;
                                        let value = input[item];
                                        switch (item) {
                                            case "user":
                                                label =
                                                    t("setQuota.user", "目标用户")
                                                if (isString(value)) {
                                                    value = JSON.parse(value).name
                                                } else {
                                                    value = value?.name || ""
                                                }

                                                break;
                                            case "scale_size":
                                                label = t("setQuota.quota", "扩容大小");
                                                value = value + "(GB)"
                                                break;
                                            default:
                                                label = "";
                                        }
                                        if (label) {
                                            return (
                                                <tr>
                                                    <td className={styles.label}>
                                                        <Typography.Paragraph
                                                            ellipsis={{
                                                                rows: 2,
                                                            }}
                                                            className="applet-table-label"
                                                            title={label}
                                                        >
                                                            {label}
                                                        </Typography.Paragraph>
                                                        {t("colon", "：")}
                                                    </td>
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
            ],
        },
    ],
    translations: {
        enUS,
        zhCN,
        zhTW,
        viVN,
    },
};

export default extension;
