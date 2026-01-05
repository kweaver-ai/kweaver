import * as React from "react";
import { noop, includes } from "lodash";
import { message } from "antd";
import { ErrorCode } from "../../core/errcode/errcode";
import { encrypt } from "../../core/mediator/auth";
import { md5 } from "../../core/md5";
import { session } from "../../core/mediator";
import WebComponent from "../webcomponent";
import __ from "./locale";
import { isfwebThrift } from "../../api/isfweb-thrift";
import { eacp } from "../../api/eacp";

/**
 * 错误状态
 */
enum ErrorStatus {
    /**
     * 正常
     */
    Normal,

    /**
     * 密码为空
     */
    PasswordMissing,

    /**
     * 新密码为空
     */
    NewPasswordMissing,

    /**
     * 确认密码为空
     */
    ReenterPasswordMissing,

    /**
     * 两次密码密码不一致
     */
    PasswordInconsitent,

    /**
     * 新密码等于初始密码
     */
    NewPasswordIsInit,

    /**
     * 新密码等于旧密码
     */
    PasswordIdentical,
    /**
     * 验证码不允许为空
     */
    NoVCode,

    /**
     * 无法连接文档域
     */
    ConnectServerFailed,
}

export default class ChangePasswordBase extends WebComponent<
    Components.ChangePassword.Props,
    Components.ChangePassword.State
> {
    static defaultProps = {
        name: null,
        onChangePwdSuccess: noop,
        onChangePwdCancel: noop,
        onUserLocked: noop,
    };

    static ErrorStatus = ErrorStatus;

    appIp = null;

    state: Components.ChangePassword.State = {
        password: "",
        newPassword: "",
        reenterPassword: "",
        errorStatus: ErrorStatus.Normal,
        strongPasswordStatus: false,
        strongPasswordLength: 6,
        errorDetail: null,
    };

    async componentDidMount() {
        this.setPasswordConfig();
    }

    /**
     * 获取密码状态
     * @param systemType 控制台类型
     * @param appIp 主节点ip
     */
    private async setPasswordConfig() {
        const user = await isfwebThrift.getUserInfo(
            session.get("studio.userid")
        );
        const passwordConfig = await isfwebThrift.getPwdConfig();
        this.setState({
            strongPasswordStatus: passwordConfig.strongStatus,
            strongPasswordLength: passwordConfig.strongPwdLength,
            errorStatus: user.user.pwdControl
                ? ErrorCode.PasswordRestricted
                : ErrorStatus.Normal,
        });
    }

    /**
     * 输入密码
     * @param value 密码
     */
    protected changePassword(value: string) {
        if (
            includes(
                [
                    ErrorStatus.NewPasswordMissing,
                    ErrorStatus.ReenterPasswordMissing,
                    ErrorStatus.PasswordInconsitent,
                ],
                this.state.errorStatus
            )
        ) {
            this.setState({
                password: value,
            });
        } else {
            this.setState({
                password: value,
                errorStatus: ErrorStatus.Normal,
            });
        }
    }

    /**
     * 输入新密码
     */
    protected changeNewPassword(value: string) {
        if (
            includes(
                [
                    ErrorStatus.ReenterPasswordMissing,
                    ErrorStatus.PasswordMissing,
                ],
                this.state.errorStatus
            )
        ) {
            this.setState({
                newPassword: value,
            });
        } else {
            this.setState({
                newPassword: value,
                errorStatus: ErrorStatus.Normal,
            });
        }
    }

    /**
     * 输入确认密码
     */
    protected changeReNewPassword(value: string) {
        if (
            includes(
                [ErrorStatus.NewPasswordMissing, ErrorStatus.PasswordMissing],
                this.state.errorStatus
            )
        ) {
            this.setState({
                reenterPassword: value,
            });
        } else {
            this.setState({
                reenterPassword: value,
                errorStatus: ErrorStatus.Normal,
            });
        }
    }
    /**
     * 保存修改密码
     */
    protected async confirmChangePassword() {
        if (this.checkPassword()) {
            try {
                const body = {
                    account: this.props.account,
                    oldpwd: encrypt(this.state.password),
                    newpwd: encrypt(this.state.newPassword),
                };
                await eacp.modifyPassword(body, {
                    sign: md5(JSON.stringify(body) + "eisoo.com"),
                });

                message.success(__("修改成功"));
                this.props.onChangePwdSuccess(this.state.newPassword);
                setTimeout(() => {
                    this.props.signup();
                }, 1000);
            } catch (ex: any) {
                if (!ex.code) {
                    this.setState({
                        errorStatus: ErrorStatus.ConnectServerFailed,
                    });
                } else {
                    if (ex.code === ErrorCode.NewPasswordIsInitial) {
                        this.setState({
                            errorStatus: ErrorStatus.NewPasswordIsInit,
                        });
                    }
                    if (ex.code === ErrorCode.PasswordInvalidLocked) {
                        this.setState({
                            errorDetail: ex.detail,
                        });
                    } else if (ex.code === ErrorCode.AccountLocked) {
                        setTimeout(() => {
                            this.props.onUserLocked();
                        }, 3000);
                    }

                    this.setState({
                        errorStatus: ex.code,
                    });
                }
            }
        }
    }

    /**
     * 取消修改密码
     */
    cancelChangePassword() {
        this.props.onChangePwdCancel();
    }
    /**
     * 检查表单合法性
     */
    private checkPassword() {
        switch (true) {
            case this.state.password === "":
                this.setState({
                    errorStatus: ErrorStatus.PasswordMissing,
                });
                return false;

            case this.state.newPassword === "":
                this.setState({
                    errorStatus: ErrorStatus.NewPasswordMissing,
                });
                return false;

            case this.state.reenterPassword === "":
                this.setState({
                    errorStatus: ErrorStatus.ReenterPasswordMissing,
                });
                return false;

            case this.state.newPassword === this.state.password:
                this.setState({
                    errorStatus: ErrorStatus.PasswordIdentical,
                });
                return false;
            case this.state.reenterPassword !== this.state.newPassword:
                this.setState({
                    errorStatus: ErrorStatus.PasswordInconsitent,
                });
                return false;

            default:
                if (this.state.password.length > 100) {
                    // 旧密码长度超过100位,提示"旧密码不正确。"(当密码长度过长时,RSA加密会报错,所以这里提前报错)
                    this.setState({
                        errorStatus: ErrorCode.AuthFailed,
                    });
                    return false;
                }

                if (this.state.newPassword.length > 100) {
                    // 新密码长度超过100位,提示"新密码不符合要求。"(当密码长度过长时,RSA加密会报错,所以这里提前报错)
                    this.setState({
                        errorStatus: ErrorCode.PasswordInvalid,
                    });
                    return false;
                }

                return true;
        }
    }
}
