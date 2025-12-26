import cookie from "js-cookie";
import { UserInfo } from "../../api/oauth/declare";
import { local, session } from "../mediator";
import { logout } from "../../api/oauth";
import { defaultPathList } from "../../core/path";

/**
 * 登出
 * @param pathname 路径
 */
export const signup = async (
    pathname: string = defaultPathList[1],
    skip: boolean = false
) => {
    try {
        // try {
        //     await Get("/monitor/logout");
        // } catch (error) {
        // }
        if (!skip) {
            await logout.post();
        }
    } catch (ex) {
        console.log(ex);
    } finally {
        clearUserInfo();
        window.location.assign(pathname);
    }
};

/**
 * 设置登录信息
 * @param userInfo 用户信息
 */
export function storeUserInfo(userInfo: UserInfo | null | undefined) {
    if (!userInfo) {
        return;
    } else if (typeof userInfo === "string") {
        local.set("deploy.userInfo", userInfo);
        session.set("deploy.userid", userInfo);
        session.set("deploy.userInfo", { id: userInfo });
    } else {
        local.set("deploy.userInfo", userInfo);
        session.set("deploy.userid", (userInfo as UserInfo).id);
        session.set("deploy.username", (userInfo as UserInfo).user.loginName);
        session.set(
            "deploy.displayname",
            (userInfo as UserInfo).user.displayName
        );
        session.set("deploy.userInfo", userInfo as UserInfo);
    }
}

/**
 * 清理用户信息
 */
export function clearUserInfo() {
    local.remove("deploy.userInfo");
    session.remove("deploy.userid");
    session.remove("deploy.username");
    session.remove("deploy.displayname");
    session.remove("deploy.userInfo");

    session.remove("deploy.collapse");
    session.remove("deploy.clickElse");
}
