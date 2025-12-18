import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Button, Modal, Spin } from "antd";
import cookies from "js-cookie";
import clsx from "clsx";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import authIcon from "../../assets/auth.png";
import styles from "./auth-expiration.module.less";
import { ServiceConfigContext } from "../config-provider";

interface AuthExpirationProps {
    type: "modal" | "toast";
    handleDisable?: () => void;
}

export const adaptUI = (iframeDom: Document, t: any) => {
    const logo = iframeDom?.getElementsByClassName(
        "logo-wrapper"
    )[0] as HTMLDivElement;
    if (logo) {
        logo.style.display = "none";
    }

    const title = iframeDom?.getElementsByClassName(
        "title-wrapper"
    )[0] as HTMLDivElement;
    if (title) {
        title.innerHTML = t("auth.tip", "请输入您的登录密码确认授权");
        title.style.textAlign = "left";
        title.style.marginLeft = "40px";
        title.style.fontSize = "14px";
        title.style.color = "rgba(0,0,0,0.6)";
    }

    const accountWrapper = iframeDom?.getElementsByClassName(
        "ant-form-item-control-input"
    )[0] as HTMLDivElement;
    if (accountWrapper) {
        const input = accountWrapper.getElementsByTagName(
            "input"
        )[0] as HTMLInputElement;
        const account = cookies.get("web.login_account");
        if (input && account && input.value !== account) {
            input.value = account as string;
        }

        accountWrapper.style.display = "none";
    }

    const remember = iframeDom.getElementsByClassName(
        "remember-password"
    )[0] as HTMLDivElement;
    if (remember) {
        remember.style.display = "none";
    }

    const button = iframeDom.getElementsByTagName("button")[0];
    if (button) {
        button.innerHTML = t("auth.confirm", "确认授权");
    }
};

/**
 * 接入hydra断言后，自动化任务无需再主动授权
 */
export const AuthExpiration = ({
    type = "toast",
    handleDisable,
}: AuthExpirationProps) => {
    const [showInfo, setShowInfo] = useState(Boolean(type === "modal"));
    const [showLoading, setShowLoading] = useState(true);
    const [isToastShow, setIsToastShow] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [url, setUrl] = useState("");
    const urlRef = useRef("");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const t = useTranslate();
    const locale = microWidgetProps?.language?.getLanguage || "zh-cn";
    const { config, onChangeConfig } = useContext(ServiceConfigContext);

    const handleAuthorize = () => {
        setShowInfo(false);
        setShowLoading(true);
        setIsModalVisible(true);
        setUrl(urlRef.current);
    };

    const getAuthConfig = async () => {
        try {
            const data = await API.axios.post(
                `${prefixUrl}/api/automation/v1/oauth2/auth`,
                {
                    redirect_uri: `${prefixUrl}/applet/app/content-automation-new/auth?lang=${locale}`,
                }
            );
            if (data?.data.status === false) {
                // 第一次授权则直接打开授权窗口
                if (type === "toast") {
                    setIsToastShow(true);
                } else {
                    setIsModalVisible(true);
                }
                urlRef.current = `https://${data?.data.url}`;
                // 判断是否有登录账号信息
                if (!cookies.get("web.login_account")) {
                    const {
                        data: { account = "" },
                    } = await API.efast.eacpV1UserGetPost();
                    cookies.set("web.login_account", account);
                }
            }
            if (data?.data.status === true && type === "toast") {
                setIsToastShow(false);
            }
        } catch (error: any) {
            // 自动化未启用
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                onChangeConfig({ ...config, isServiceOpen: false });
                return;
            }
        }
    };

    useEffect(() => {
        const iframeAdapter = () => {
            // 修改iframe页面内容
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.onload = () => {
                    const iframeDom =
                        iframeRef.current!.contentWindow?.document;

                    if (iframeDom) {
                        // 修改样式
                        adaptUI(iframeDom, t);

                        setShowLoading(false);
                    }
                };
            }
        };
        iframeAdapter();
    }, [t, url]);

    useEffect(() => {
        // 请求判断是否授权
        getAuthConfig();
    }, []);

    return (
        <>
            {isToastShow && (
                <Alert
                    className={styles["alert"]}
                    message={
                        <div>
                            {t(
                                "auth.alert",
                                "您的授权已过期，请<Button></Button>，否则将无法正常使用小程序",
                                {
                                    Button: () => (
                                        <Button
                                            type="link"
                                            className={styles.copyButton}
                                            onClick={handleAuthorize}
                                        >
                                            {t("auth.reauthorize", "重新授权")}
                                        </Button>
                                    ),
                                }
                            )}
                        </div>
                    }
                    type="warning"
                    showIcon
                    icon={
                        <ExclamationCircleOutlined
                            style={{ fontSize: "16px" }}
                        />
                    }
                    banner
                />
            )}
            {isModalVisible && (
                <Modal
                    visible={isModalVisible}
                    title={null}
                    className={styles["modal"]}
                    onCancel={() => {
                        setUrl("");
                        setIsModalVisible(false);
                        setShowInfo(Boolean(type === "modal"));
                        if (type === "toast") {
                            getAuthConfig();
                        }
                    }}
                    centered
                    closable
                    maskClosable={false}
                    footer={null}
                    transitionName=""
                >
                    <div
                        className={clsx(styles["iframe-container"], {
                            [styles["auth-login"]]: url,
                        })}
                    >
                        {showInfo ? (
                            <div className={styles["info-container"]}>
                                <div className={styles["img-wrapper"]}>
                                    <img
                                        src={authIcon}
                                        alt="auth"
                                        className={styles["auth-icon"]}
                                    />
                                </div>
                                <div className={styles["info"]}>
                                    <span className={styles["light"]}>
                                        {t("automation", "自动化")}
                                    </span>
                                    <span> </span>
                                    <span className={styles["info-tip"]}>
                                        {t(
                                            "info",
                                            "希望获取访问您AnyShare数据的权限"
                                        )}
                                    </span>
                                </div>
                                <div className={styles["extra-tip"]}>
                                    {t(
                                        "tip",
                                        "自动化将像机器人一样帮您自动执行既定的文档操作，希望获取您的授权"
                                    )}
                                </div>
                                <div>
                                    <Button
                                        type="primary"
                                        className={clsx(
                                            styles["confirm-btn"],
                                            "automate-oem-primary-btn"
                                        )}
                                        onClick={handleAuthorize}
                                    >
                                        {t("auth.confirm", "确认授权")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {url && (
                                    <iframe
                                        ref={iframeRef}
                                        title="login"
                                        className={styles["iframe"]}
                                        src={url}
                                        frameBorder="0"
                                    />
                                )}
                                {showLoading && (
                                    <div
                                        className={styles["loading-container"]}
                                    >
                                        <Spin></Spin>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};
