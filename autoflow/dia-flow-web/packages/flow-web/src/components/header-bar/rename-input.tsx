import React, { useContext, useEffect, useRef, useState } from "react";
import { Input, InputRef, Row, Spin } from "antd";
import clsx from "clsx";
import { trim } from "lodash";
import { LoadingOutlined } from "@ant-design/icons";
import { useTranslate, MicroAppContext } from "@applet/common";
import { CancelOutlined, SaveOutlined } from "@applet/icons";
import styles from "./styles/rename-input.module.less";

interface RenameInputProps {
    name: string;
    onSuccess: (name: string) => void;
    onCancel: () => void;
}

export const RenameInput = ({
    name,
    onSuccess,
    onCancel,
}: RenameInputProps) => {
    const t = useTranslate();
    const [title, setTitle] = useState(name || "");
    const [hasChange, setHasChange] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const { microWidgetProps } = useContext(MicroAppContext);

    const handleValue = async (value: string) => {
        if (isRequesting) {
            return;
        }

        // 判断是否合法
        // if (trim(value).length === 0) {
        //     microWidgetProps?.components?.messageBox({
        //         type: "warning",
        //         title: t("rename.title", "重命名失败"),
        //         message: t("rename.required", "名称不允许为空"),
        //         okText: t("ok", "确定"),
        //     });
        //     return;
        // }
        if (!/^[^\\/:*?"<>|]{1,128}$/.test(value)) {
            microWidgetProps?.components?.messageBox({
                type: "warning",
                title: t("rename.title", "重命名失败"),
                message: t(
                    "taskForm.validate.taskName",
                    '名称不能包含\\ / : * ? " < > | 特殊字符，长度不能超过128个字符'
                ),
                okText: t("ok", "确定"),
            });
            return;
        }
        // 调用重命名接口
        // try {
        setIsRequesting(true);
        microWidgetProps?.components?.toast.success(
            t("rename.success", "重命名成功")
        );
        onSuccess(value);
        setIsRequesting(false);
        // } catch (error: any) {
        //     // 重名提示
        //     if (
        //         error?.response?.data?.code ===
        //         "FileCollector.DuplicatedName.ErrorCreateTask"
        //     ) {
        //         microWidgetProps?.components?.messageBox({
        //             type: "warning",
        //             title: t("rename.title", "重命名失败"),
        //             message: t(
        //                 "rename.duplicatedName",
        //                 "该名称已被占用，请重新命名。"
        //             ),
        //             okText: t("ok", "确定"),
        //         });
        //         return;
        //     }
        // }
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.select();
        }
    }, []);

    return (
        <>
            <div className={styles["box-rename"]}>
                <Row
                    align="middle"
                    onBlur={() => {
                        if (!hasChange) {
                            onCancel();
                        }
                    }}
                >
                    <Input
                        className={styles["box-input"]}
                        ref={inputRef}
                        value={title}
                        onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                            setHasChange(true);
                            setTitle(event.target.value);
                        }}
                        onPressEnter={() => {
                            if (trim(title).length > 0) {
                                handleValue(title);
                            }
                        }}
                    />

                    {isRequesting ? (
                        <div className={styles["spin"]}>
                            <Spin
                                indicator={
                                    <LoadingOutlined
                                        style={{ fontSize: 16 }}
                                        spin
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div
                            className={clsx(
                                styles["box-btn"],
                                styles["disable"],
                                {
                                    [styles["normal"]]: trim(title).length > 0,
                                }
                            )}
                            onClick={() => handleValue(title)}
                        >
                            <SaveOutlined />
                        </div>
                    )}
                    <div className={styles["box-btn"]} onClick={onCancel}>
                        <CancelOutlined />
                    </div>
                </Row>
            </div>
        </>
    );
};
