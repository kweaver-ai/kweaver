import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { ItemCallback } from "./params-form";
import { FileSuffixType, SuffixType } from "../file-suffixType";
import { Validatable } from "../extension";
import { isFunction } from "lodash";
import { Button, Modal } from "antd";
import styles from "./styles/params-form.module.less";
import clsx from "clsx";
import { DeleteOutlined, FormAddOutlined } from "@applet/icons";
import { FileCategory, defaultSuffix } from "../file-suffixType/defaultSuffix";

interface AsSuffixProps {
    value?: any;
    onChange?: any;
    items?: any;
    required?: boolean;
}

export interface InvalidStatus {
    type: string;
    message: string;
}

export const AsSuffix = forwardRef<ItemCallback, AsSuffixProps>(
    ({ items, value, onChange, required = false }, ref) => {
        const [isVisible, setVisible] = useState(false);
        const { prefixUrl } = useContext(MicroAppContext);
        const [modalValue, setModalValue] = useState<SuffixType[]>();
        const allowSuffixCache = useRef<SuffixType[]>();
        const [inValidStatus, setInvalidStatus] = useState<InvalidStatus>();
        const [allowAllOthers, setAllowAllOthers] = useState(true);
        const [othersForbiddenTypes, setOthersForbiddenTypes] = useState<
            string[]
        >([]);
        const t = useTranslate();

        const suffixRef = useRef<Validatable>(null);

        const init = async () => {
            if (!allowSuffixCache.current) {
                try {
                    if (items[0].docid.length > 71) {
                        setAllowAllOthers(false);
                        const dirObjectId = items[0].docid.slice(-65, -33);
                        // 获取其父级文件夹支持的文件类型
                        const { data } = await API.axios.get(
                            `${prefixUrl}/api/document/v1/dirs/${dirObjectId}/attributes/allow_suffix_doc`
                        );
                        allowSuffixCache.current = data?.allow_suffix_doc;
                        if (!value) {
                            setModalValue(data?.allow_suffix_doc);
                        }
                    } else {
                        setAllowAllOthers(true);
                        const { data } = await API.axios.get(
                            `${prefixUrl}/api/doc-share/v1/suffix-classification-info`
                        );
                        let allForbiddenTypes: string[] = [];
                        data.forEach((element: SuffixType) => {
                            if (element.enabled === false) {
                                allForbiddenTypes = allForbiddenTypes.concat(
                                    element.suffix
                                );
                            }
                        });
                        const allowSuffixType: SuffixType[] = data.map(
                            (item: SuffixType) => {
                                if (item.id === FileCategory.Others) {
                                    setOthersForbiddenTypes(allForbiddenTypes);
                                    return {
                                        id: item.id,
                                        name: item.name,
                                        suffix: [],
                                    };
                                }
                                const allSuffix = defaultSuffix.filter(
                                    (i) => i.id === item.id
                                )[0].suffix;
                                const allowSuffixArr = allSuffix.filter(
                                    (suffix) => {
                                        if (
                                            allForbiddenTypes.includes(suffix)
                                        ) {
                                            return false;
                                        }
                                        if (item.enabled === false) {
                                            return !item.suffix.includes(
                                                suffix
                                            );
                                        }
                                        return true;
                                    }
                                );
                                return {
                                    id: item.id,
                                    name: item.name,
                                    suffix: allowSuffixArr,
                                };
                            }
                        );
                        // 文档库
                        allowSuffixCache.current = allowSuffixType;
                        if (!value) {
                            setModalValue(allowSuffixType);
                        }
                    }
                } catch (error) {
                    console.error(error);
                    const data = defaultSuffix.map((item: SuffixType) => {
                        if (item.id === FileCategory.VirusFile) {
                            return { ...item, suffix: [] };
                        }
                        return item;
                    });
                    // 文档库
                    allowSuffixCache.current = data;
                    if (!value) {
                        setModalValue(data);
                    }
                }
            }
            if (value) {
                setModalValue(value);
            } else {
                setModalValue(allowSuffixCache.current);
            }
            setVisible(true);
        };

        const handleClear = () => {
            onChange(undefined);
            setModalValue(undefined);
        };

        const handleChange = (val: SuffixType[]) => {
            setModalValue(val);
        };

        const onConfirm = () => {
            if (
                suffixRef.current &&
                isFunction(suffixRef.current.validate) &&
                suffixRef.current.validate()
            ) {
                onChange(modalValue);
                setVisible(false);
                // 校验为空
                if (inValidStatus?.type === "empty" && modalValue) {
                    setInvalidStatus(undefined);
                }
            }
        };

        const onClose = () => {
            setModalValue(value);
            setVisible(false);
        };

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        if (items[0].size !== -1) {
                            return Promise.resolve();
                        }
                        if (!value) {
                            if (required) {
                                setInvalidStatus({
                                    type: "empty",
                                    message: t(`emptyMessage`),
                                });
                                return Promise.reject("empty");
                            } else {
                                return Promise.resolve();
                            }
                        }
                        // 校验格式是否为合法
                        if (
                            suffixRef.current &&
                            isFunction(suffixRef.current.validate) &&
                            suffixRef.current.validate()
                        ) {
                            return Promise.resolve();
                        }
                        return Promise.reject("suffix");
                    },
                };
            },
            [items, required, t, value]
        );

        return (
            <>
                <div className={styles["as-suffix"]}>
                    {value ? (
                        <>
                            <Button
                                type="link"
                                onClick={init}
                                className={styles["link-btn"]}
                            >
                                {t("suffix.edit", "已设置")}
                            </Button>
                            <DeleteOutlined
                                className={styles["delete-btn"]}
                                onClick={handleClear}
                            />
                        </>
                    ) : (
                        <Button
                            icon={
                                <FormAddOutlined style={{ fontSize: "13px" }} />
                            }
                            type="default"
                            onClick={init}
                            className={styles["default-btn"]}
                        >
                            {t("suffix.set", "设置格式")}
                        </Button>
                    )}
                </div>
                {inValidStatus && (
                    <div className={styles["explain-error"]}>
                        {inValidStatus.message}
                    </div>
                )}
                <Modal
                    open={isVisible}
                    onCancel={onClose}
                    title={
                        <div className={styles["modal-title"]}>
                            {t("suffix.modalTitle", "允许上传的文件格式")}
                        </div>
                    }
                    className={styles["modal"]}
                    width={520}
                    centered
                    closable
                    maskClosable={false}
                    transitionName=""
                    footer={
                        <div className={styles["modal-footer"]}>
                            <Button
                                className={clsx(
                                    styles["footer-btn-ok"],
                                    "automate-oem-primary-btn"
                                )}
                                onClick={onConfirm}
                                type="primary"
                            >
                                {t("ok", "确定")}
                            </Button>
                            <Button
                                className={styles["footer-btn-cancel"]}
                                onClick={onClose}
                                type="default"
                            >
                                {t("cancel", "取消")}
                            </Button>
                        </div>
                    }
                >
                    <>
                        <div className={styles["suffix-tip"]}>
                            {t("suffix.allow", "允许以下文件类型上传")}
                        </div>
                        <FileSuffixType
                            ref={suffixRef}
                            value={modalValue}
                            onChange={handleChange}
                            allowSuffix={allowSuffixCache.current}
                            allowAllOthers={allowAllOthers}
                            othersForbiddenTypes={othersForbiddenTypes}
                        />
                    </>
                </Modal>
            </>
        );
    }
);
