import * as React from "react";
import styles from "./styles.module.less";
import err503 from "./assets/err503.png";
import permission from "./assets/permission.png";
import { Button } from "antd";
import LoginClusterBase from "./component.base";
import { LoginError } from "./helper";
import __ from "./locale";

export default class LoginCluster extends LoginClusterBase {
    render() {
        const { loginError } = this.state;
        return (
            <div
                className={styles["index-panel"]}
                style={{ minHeight: this.props.loginHeight + "px" }}
            >
                {loginError ? (
                    <div className={styles["tip-wrap"]}>
                        <img
                            src={this.getErrorImage(loginError)}
                            className={
                                loginError === LoginError.PermissionDenied
                                    ? styles["img-loginerr"]
                                    : styles["img"]
                            }
                        />
                        <span className={styles["text"]}>
                            {this.getLoginError(loginError)}
                        </span>
                    </div>
                ) : (
                    <>
                        <iframe
                            ref="select"
                            src=""
                            onLoad={(e) => this.catchIFrameError(e)}
                            style={{
                                opacity: this.state.iframeVisible ? 1 : 0,
                                background: "transparent",
                            }}
                        />
                        {!this.state.iframeVisible ? (
                            <div className={styles["loading"]}>
                                <span></span>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        );
    }

    /**
     * 获取图片
     * @param loginError 登录错误
     * @returns
     */
    getErrorImage(loginError: string) {
        if (loginError === LoginError.PermissionDenied) {
            return permission;
        } else {
            return err503;
        }
    }

    /**
     * 获取登录错误
     * @param loginError 登录错误
     * @returns
     */
    getLoginError(loginError: string) {
        if (loginError === LoginError.KeepMeLoggedIn) {
            return __(
                "您已在客户端登录勾选了“记住登录状态”，若要登录部署工作台，请先退出客户端"
            );
        } else if (loginError === LoginError.PermissionDenied) {
            return (
                <>
                    <div>{__("您不是管理员账号，无法登录部署工作台")}</div>
                    <div>
                        <Button
                            onClick={() => window.location.reload()}
                            className={styles["go-back-button"]}
                        >
                            {__("返回登录页")}
                        </Button>
                    </div>
                </>
            );
        } else {
            return __("服务器暂不可用，请稍后再试");
        }
    }
}
