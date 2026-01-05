import { i18nDeploy as i18n } from "../../core/mediator";

export default i18n([
    ["修改密码", "變更密碼", "Change password"],
    [
        "密码为 6~100 位，只能包含 英文 或 数字 或 ~!%#$@-_. 字符。",
        "密碼為 6~100 位，只能包含 英文 或 數位 或 ~!%#$@-_. 字元。",
        "The password can only contain letters, numbers or ~! % # $@ - _. Characters, length range in 6~100 characters.",
    ],
    [
        "密码为 ${length}~100 位，必须同时包含 大小写英文字母、数字与特殊字符，特殊字符可为 ~!%#$@-_.",
        "密碼為 ${length}~100 位，必須同時包含 大小寫英文字母、數字與特殊字元，特殊字元可為 ~!%#$@-_.",
        "Password should be ${length}~100 characters, and must contain numbers, letters in both uppercase and lowercase, and special characters like ~!%#$@-_.",
    ],
    ["账号：", "帳戶：", "Account:"],
    ["旧密码：", "舊密碼：", "Old Password:"],
    ["新密码：", "新密碼：", "New Password:"],
    ["确认新密码：", "確認新密碼：", "Confirm Password:"],
    ["旧密码不能为空。", "舊密碼不能為空。", "Old password is required."],
    ["新密码不能为空。", "新密碼不能為空。", "New password is required."],
    [
        "确认新密码不能为空。",
        "確認新密碼不能為空。",
        "Confirm password is required.",
    ],
    ["确定", "確定", "OK"],
    ["取消", "取消", "Cancel"],
    [
        "新密码不能为初始密码。",
        "新密碼不能為初始密碼。",
        "New password cannot be same as the initial password.",
    ],
    [
        "新密码不能和旧密码相同。",
        "新密碼不能和舊密碼相同。",
        "New password cannot be the same as the old password.",
    ],
    [
        "两次输入的密码不一致。",
        "兩次輸入的密碼不一致。",
        "Passwords don't match.",
    ],
    [
        "您输入旧密码错误次数超过限制，账号已被锁定，${time}分钟内无法登录，请稍后重试。",
        "您輸入舊密碼錯誤次數超過限制，帳戶已被鎖定，${time}分鐘內無法登入，請稍後重試。",
        "Your account has been locked for ${time} minute(s) as the old password attempts exceed the limit. Please try again later.",
    ],
    ["修改成功", "修改成功", " Modified successfully"],
    [
        "新密码不符合要求。",
        "新密碼不符合要求。",
        "The new password does not meet the requirements.",
    ],
    [
        "您输入错误次数超过限制，账号已被锁定，请联系厂商协助。",
        "您輸入錯誤次數超過限制，帳戶已被鎖定，請聯繫廠商協助。",
        "Your password attempts has exceeded the limits and the account has been locked, please contact the manufacturer for assistance.",
    ],
    [
        "您输入错误次数超过限制，账号已被锁定，请联系安全管理员。",
        "您輸入錯誤次數超過限制，帳戶已被鎖定，請聯繫安全管理員。",
        "Password attempts exceeded. This account is locked, please contact security.",
    ],
    ["验证码：", "驗證碼：", "Verification code："],
    [
        "验证码不允许为空",
        "驗證碼不允許為空",
        "Verification code is required, please re-enter",
    ],
    [
        "您输入错误次数超过限制，账号已被锁定，请联系管理员。",
        "您輸入錯誤次數超過限制，帳戶已被鎖定，請聯繫管理員。",
        "Your account has been locked due to multiple failed login attempts, please contact your administrator",
    ],
    ["旧密码不正确。", "舊密碼不正確。", "Old password is incorrect."],
    [
        "无法连接文档域。",
        "無法連接文件網域。",
        "Cannot connect to Document Domain.",
    ],
    ["提示", "提示", "Tips"],
]);
