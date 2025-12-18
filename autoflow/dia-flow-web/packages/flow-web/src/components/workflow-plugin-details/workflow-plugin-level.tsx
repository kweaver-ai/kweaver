import { FC, useContext, useMemo, useState } from "react";
import { Button, Form, Modal, Typography } from "antd";
import { useTranslate } from "@applet/common";
import { WorkflowContext } from "../workflow-provider";
import { CloseOutlined } from "@applet/icons";
import styles from "./styles/workflow-plugin-level.module.less";
import { useSecurityLevel } from "../log-card";
import { fromPairs, toPairs } from "lodash";
import moment from "moment";
import clsx from "clsx";

interface CsfInfo {
    scope: string | any[];
    screason: string;
    sctime: string;
    secrecyperiod: string;
    scperson: string | string[];
    scdepart: string | string[];
}

interface WorkflowPluginLevelProps {
    data: {
        csflevel: number;
        csfinfo: CsfInfo;
    };
    isDirectory?: boolean;
}

export const WorkflowPluginLevel: FC<WorkflowPluginLevelProps> = ({
    data: levelData,
    isDirectory = false,
}) => {
    const { process } = useContext(WorkflowContext);
    const [isShowModal, setShowModal] = useState(false);
    // 获取系统密级配置
    const [csf_level_enum] = useSecurityLevel();
    const isUploadStrategy = useMemo(() => {
        return process?.audit_type === "security_policy_upload";
    }, [process?.audit_type]);
    const t = useTranslate();

    const parseData = useMemo(() => {
        if (typeof levelData === "string") {
            try {
                return JSON.parse(levelData);
            } catch (error) {
                return levelData;
            }
        }
        return levelData;
    }, [levelData]);

    const csflevel = useMemo(() => {
        return fromPairs(
            toPairs(csf_level_enum)?.map(([text, level]) => [level, text])
        );
    }, [csf_level_enum]);

    const userScope = useMemo(() => {
        try {
            let scope = parseData?.csfinfo?.scope;
            if (typeof scope === "string") {
                scope = JSON.parse(scope) as any[];
            }
            return scope?.map((i: any) => i?.name).join(",") || "---";
        } catch (error) {
            return "---";
        }
    }, []);

    const scperson = useMemo(() => {
        try {
            let scperson = parseData?.csfinfo?.scperson;
            if (typeof scperson === "string") {
                scperson = JSON.parse(scperson) as string[];
            }
            return scperson?.join(",") || "---";
        } catch (error) {
            return "---";
        }
    }, [parseData?.csfinfo?.scperson]);

    const scdepart = useMemo(() => {
        try {
            let scdepart = parseData?.csfinfo?.scdepart;
            if (typeof scdepart === "string") {
                scdepart = JSON.parse(scdepart) as string[];
            }
            return scdepart?.join(",") || "---";
        } catch (error) {
            return "---";
        }
    }, [parseData?.csfinfo?.scdepart]);

    const formateTime = (time: string) => {
        if (!time || String(time) === "-1") {
            return "---";
        }
        return moment(Number(time) / 1000).format("YYYY/MM/DD HH:mm:ss");
    };

    const getSecrecyperiod = (val: string | number) => {
        if (!val || String(val) === "-1") {
            return "---";
        }
        if (String(val) === "0") {
            return t("secrecyperiod.0", "长期");
        } else {
            return t("secrecyperiod.year", { num: val });
        }
    };

    return (
        <>
            <Button type="link" onClick={() => setShowModal(true)}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={420}
                title={t("level", "密级")}
                open={isShowModal}
                className={styles["modal"]}
                mask
                centered
                transitionName=""
                onCancel={() => {
                    setShowModal(false);
                }}
                destroyOnClose
                footer={null}
                closeIcon={<CloseOutlined style={{ fontSize: "13px" }} />}
            >
                <div className={styles["content"]}>
                    {isUploadStrategy && (
                        <div className={styles["description"]}>
                            {t("upload.level", { name: process?.user_name })}
                        </div>
                    )}
                    <div className={styles["container"]}>
                        <Form
                            className={styles["form"]}
                            labelAlign="left"
                            colon={false}
                            labelCol={{
                                style: {
                                    width: "108px",
                                },
                            }}
                        >
                            <Form.Item
                                key="csflevel"
                                label={
                                    <span className={styles["label-wrapper"]}>
                                        <Typography.Text
                                            ellipsis
                                            className={styles["label"]}
                                        >
                                            {t(
                                                "csflevel.level",
                                                "文档当前密级"
                                            )}
                                        </Typography.Text>
                                        <span>{t("colon")}</span>
                                    </span>
                                }
                            >
                                <Typography.Text
                                    ellipsis
                                    title={csflevel[parseData?.csflevel] || ""}
                                    className={styles["value"]}
                                >
                                    {csflevel[parseData?.csflevel] || "---"}
                                </Typography.Text>
                            </Form.Item>
                            {!isDirectory && (
                                <>
                                    <Form.Item
                                        key="sctime"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    ellipsis
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.sctime",
                                                        "定密时间"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={formateTime(
                                                parseData?.csfinfo?.sctime
                                            )}
                                            className={styles["value"]}
                                        >
                                            {formateTime(
                                                parseData?.csfinfo?.sctime
                                            )}
                                        </Typography.Text>
                                    </Form.Item>
                                    <Form.Item
                                        key="secrecyperiod"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    ellipsis
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.secrecyperiod",
                                                        "保密期限"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={getSecrecyperiod(
                                                parseData?.csfinfo
                                                    ?.secrecyperiod
                                            )}
                                            className={styles["value"]}
                                        >
                                            {getSecrecyperiod(
                                                parseData?.csfinfo
                                                    ?.secrecyperiod
                                            )}
                                        </Typography.Text>
                                    </Form.Item>

                                    <Form.Item
                                        key="scope"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    ellipsis
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.scope",
                                                        "知悉范围"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={userScope}
                                            className={styles["value"]}
                                        >
                                            {userScope}
                                        </Typography.Text>
                                    </Form.Item>
                                    <Form.Item
                                        key="screason"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.screason",
                                                        "定密依据"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={parseData?.csfinfo?.screason}
                                            className={clsx(
                                                styles["value"],
                                                styles["pre"]
                                            )}
                                        >
                                            {parseData?.csfinfo?.screason ||
                                                "---"}
                                        </Typography.Text>
                                    </Form.Item>
                                    <Form.Item
                                        key="scperson"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    ellipsis
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.scperson",
                                                        "定密责任人"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={scperson}
                                            className={styles["value"]}
                                        >
                                            {scperson}
                                        </Typography.Text>
                                    </Form.Item>
                                    <Form.Item
                                        key="scdepart"
                                        label={
                                            <span
                                                className={
                                                    styles["label-wrapper"]
                                                }
                                            >
                                                <Typography.Text
                                                    ellipsis
                                                    className={styles["label"]}
                                                >
                                                    {t(
                                                        "csflevel.scdepart",
                                                        "定密单位"
                                                    )}
                                                </Typography.Text>
                                                <span>{t("colon")}</span>
                                            </span>
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={scdepart}
                                            className={styles["value"]}
                                        >
                                            {scdepart}
                                        </Typography.Text>
                                    </Form.Item>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </Modal>
        </>
    );
};
