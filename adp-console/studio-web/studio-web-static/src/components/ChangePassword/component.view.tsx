import * as React from "react";
import { ErrorCode } from "../../core/errcode/errcode";
import { getErrorMessage } from "../../core/errcode";
import { Form, Input, Modal, Button } from "antd";
import ChangePasswordBase from "./component.base";
import __ from "./locale";
import styles from "./styles.module.less";

export default class ChangePassword extends ChangePasswordBase {
    render() {
        return this.getPasswordTemplate(this.state.errorStatus);
    }
    getChangePassWordError(error: number) {
        switch (error) {
            case ErrorCode.InternalError:
            case ChangePasswordBase.ErrorStatus.ConnectServerFailed:
                return __("无法连接文档域。");

            case ChangePasswordBase.ErrorStatus.PasswordMissing:
                return __("旧密码不能为空。");
            case ChangePasswordBase.ErrorStatus.NewPasswordMissing:
                return __("新密码不能为空。");
            case ChangePasswordBase.ErrorStatus.ReenterPasswordMissing:
                return __("确认新密码不能为空。");
            case ChangePasswordBase.ErrorStatus.NewPasswordIsInit:
                return __("新密码不能为初始密码。");
            case ChangePasswordBase.ErrorStatus.PasswordIdentical:
                return __("新密码不能和旧密码相同。");
            case ChangePasswordBase.ErrorStatus.PasswordInconsitent:
                return __("两次输入的密码不一致。");
            case ChangePasswordBase.ErrorStatus.NoVCode:
                return __("验证码不允许为空");
            case ErrorCode.PasswordInvalid:
            case ErrorCode.PasswordWeak:
                return __("新密码不符合要求。");
            case ErrorCode.AccountLocked:
                return (
                    <div>
                        {__(
                            "您输入错误次数超过限制，账号已被锁定，请联系管理员。"
                        )}
                    </div>
                );
            case ErrorCode.AuthFailed:
                return __("旧密码不正确。");
            default:
                return getErrorMessage(error);
        }
    }
    getPasswordTemplate(errorStatus: ErrorCode) {
        switch (errorStatus) {
            case ErrorCode.PasswordInvalidLocked:
                return (
                    <Modal
                        title={__("提示")}
                        visible={true}
                        onOk={this.props.onUserLocked}
                        onCancel={() => {}}
                        footer={[
                            <Button
                                type="primary"
                                onClick={this.props.onUserLocked}
                            >
                                {__("确定")}
                            </Button>,
                        ]}
                    >
                        <p>
                            {__(
                                "您输入旧密码错误次数超过限制，账号已被锁定，${time}分钟内无法登录，请稍后重试。",
                                { time: this.state.errorDetail.remainlockTime }
                            )}
                        </p>
                    </Modal>
                );
            case ErrorCode.PasswordRestricted:
                return (
                    <Modal
                        title={__("提示")}
                        visible={true}
                        onOk={this.props.onChangePwdCancel}
                        onCancel={() => {}}
                        footer={[
                            <Button
                                type="primary"
                                onClick={this.props.onChangePwdCancel}
                            >
                                {__("确定")}
                            </Button>,
                        ]}
                    >
                        <p>{getErrorMessage(ErrorCode.PasswordRestricted)}</p>
                    </Modal>
                );
            default:
                return (
                    <Modal
                        title={__("修改密码")}
                        visible={true}
                        onCancel={this.cancelChangePassword.bind(this)}
                        footer={[
                            <Button
                                type="primary"
                                onClick={this.confirmChangePassword.bind(this)}
                            >
                                {__("确定")}
                            </Button>,
                            <Button
                                onClick={this.cancelChangePassword.bind(this)}
                                style={{ marginRight: 8 }}
                            >
                                {__("取消")}
                            </Button>,
                        ]}
                        width={460}
                    >
                        <div className={styles["message"]}>
                            {this.state.strongPasswordStatus
                                ? __(
                                      "密码为 ${length}~100 位，必须同时包含 大小写英文字母、数字与特殊字符，特殊字符可为 ~!%#$@-_.",
                                      {
                                          length: this.state
                                              .strongPasswordLength,
                                      }
                                  )
                                : __(
                                      "密码为 6~100 位，只能包含 英文 或 数字 或 ~!%#$@-_. 字符。"
                                  )}
                        </div>
                        <Form layout="horizontal" labelAlign="left">
                            <Form.Item
                                label={__("账号：")}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                className={styles["pwd-form-item"]}
                            >
                                <div className={styles["account"]}>
                                    {this.props.account}
                                </div>
                            </Form.Item>

                            <Form.Item
                                label={__("旧密码：")}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                className={styles["pwd-form-item"]}
                            >
                                <Input.Password
                                    id="password"
                                    value={this.state.password}
                                    onChange={(e) =>
                                        this.changePassword(e.target.value)
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label={__("新密码：")}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                className={styles["pwd-form-item"]}
                            >
                                <Input.Password
                                    id="newPassword"
                                    value={this.state.newPassword}
                                    onChange={(e) =>
                                        this.changeNewPassword(e.target.value)
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label={__("确认新密码：")}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                className={styles["pwd-form-item"]}
                            >
                                <Input.Password
                                    id="confirmPassword"
                                    value={this.state.reenterPassword}
                                    onChange={(e) =>
                                        this.changeReNewPassword(e.target.value)
                                    }
                                />
                            </Form.Item>
                        </Form>
                        <div className={styles["error-message"]}>
                            {this.state.errorStatus ===
                            ChangePasswordBase.ErrorStatus.Normal
                                ? null
                                : this.getChangePassWordError(
                                      this.state.errorStatus
                                  )}
                        </div>
                    </Modal>
                );
        }
    }
}
