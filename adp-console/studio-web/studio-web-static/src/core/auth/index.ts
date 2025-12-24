import cookie from "js-cookie";
import { UserInfo } from "../../api/oauth/declare";
import { local, session } from "../mediator";
import { logout } from "../../api/oauth";
import { defaultPathList } from "../../core/path";
import { paramsSerializer } from "../../tools/request-utils";
import { getSearchQuerys } from "../bootstrap";

/**
 * 登出
 * @param pathname 路径
 */
export const signup = async (
    pathname: string = defaultPathList[1],
    skip: boolean = false
) => {
    const searchQuerys = getSearchQuerys(location.search);
    try {
        cookie.set(
            "studio.previous_url",
            `${location.pathname}?${paramsSerializer({
                ...searchQuerys,
                token: undefined,
                refreshToken: undefined,
                noUid: true,
            })}`,
            {
                secure: true,
            }
        );
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
        session.remove("studio.businessDomainID");
        window.location.assign(
            `${pathname}${
                searchQuerys.fullscreen === "true" ? "?redirect=true" : ""
            }`
        );
    }
};

/**
 * 设置登录信息
 * @param userInfo 用户信息
 */
export function storeUserInfo(userInfo: UserInfo) {
    if (!userInfo) {
        return;
    } else if (typeof userInfo === "string") {
        local.set("studio.userInfo", userInfo);
        session.set("studio.userid", userInfo);
        session.set("studio.userInfo", { id: userInfo });
    } else {
        local.set("studio.userInfo", userInfo);
        session.set("studio.userid", (userInfo as UserInfo).id);
        session.set("studio.username", (userInfo as UserInfo).user.loginName);
        session.set(
            "studio.displayname",
            (userInfo as UserInfo).user.displayName
        );
        session.set("studio.userInfo", userInfo as UserInfo);
    }
}

/**
 * 清理用户信息
 */
export function clearUserInfo() {
    local.remove("studio.userInfo");
    session.remove("studio.userid");
    session.remove("studio.username");
    session.remove("studio.displayname");
    session.remove("studio.userInfo");

    session.remove("studio.collapse");
    session.remove("studio.clickElse");
}
