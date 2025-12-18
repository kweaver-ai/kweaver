import { MinusCircleOutlined } from "@ant-design/icons";
import { TranslateFn } from "@applet/common";
import { Form, Input, Button } from "antd";
import { forwardRef, useRef, useImperativeHandle } from "react";
import { Validatable } from "../../../../components/extension";
import styles from "./index.module.less";
import { FormItem } from "../../../../components/editor/form-item";

interface EditContentInputProps {
    index: number;
    value?: string;
    removable?: boolean;
    t: TranslateFn;
    onChange?(value: string): void;
    onRemove(): void;
}

export const EditContentInput = forwardRef<Validatable, EditContentInputProps>(
    ({ index, value, t, removable, onChange, onRemove }, ref) => {
        const initialValues = useRef({ text: value });
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

        return (
            <Form
                form={form}
                autoComplete="off"
                initialValues={initialValues.current}
                onFieldsChange={(fields) => {
                    if (typeof onChange === "function" && fields.length) {
                        onChange(fields[0].value);
                    }
                }}
            >
                <div className={styles["edit-content"]}>
                    <FormItem
                        name="text"
                        allowVariable
                        type="string"
                        label={t("fileEditExcel.text", {
                            index: index + 1,
                        })}
                        className={styles["content-item"]}
                        requiredMark={false}
                    >
                        <Input
                            placeholder={t(
                                "fileEditExcel.contentPlaceholder",
                                "请输入"
                            )}
                        />
                    </FormItem>
                    {removable ? (
                        <Button
                            type="text"
                            title={t("delete")}
                            className={styles["item-remove"]}
                            icon={<MinusCircleOutlined />}
                            onClick={onRemove}
                        />
                    ) : null}
                </div>
            </Form>
        );
    }
);
