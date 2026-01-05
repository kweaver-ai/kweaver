declare namespace Components {
    namespace ChangePassword {
        interface Props {
            /**
             * 销毁前执行，如果返回false则不执行销毁
             */
            beforeDestroy?: () => any;

            /**
             * 帐户名
             */
            account: string;

            /**
             * 修改密码成功
             */
            onChangePwdSuccess: (password) => any;

            /**
             * 取消修改
             */
            onChangePwdCancel: () => any;

            /**
             * 该用户已被锁定
             */
            onUserLocked: () => any;

            /**
             * 登出
             */
            signup: () => void;
        }

        interface State {
            /**
             * 原始密码
             */
            password: string;

            /**
             * 新密码
             */
            newPassword: string;

            /**
             * 确认新密码
             */
            reNewPassword?: string;

            /**
             * 错误信息
             */
            errorStatus: number;

            /**
             * 是否开启强密码
             */
            strongPasswordStatus: boolean;

            /**
             * 强密码的长度
             */
            strongPasswordLength: number;

            /**
             * 错误的附加信息
             */
            errorDetail: any;

            /**
             * 确认密码
             */
            reenterPassword: string;

            /**
             * 是否是涉密模式
             */
            isSecretMode?: boolean;
        }
    }
}
