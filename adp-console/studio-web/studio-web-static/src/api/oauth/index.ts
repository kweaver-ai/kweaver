import { urlDecorator } from "../../tools/decorator";
import { request } from "../../tools/request";
import { UserInfo } from "./declare";

/**
 * ShareWebStudio存在备份。两边都要改
 */
@urlDecorator("/interface/oauth")
class User {
    url: string;

    /**
     * 根据cookie的token获取用户信息
     */
    get(): Promise<UserInfo> {
        return request.get(`${this.url}/getUserInfoByToken`);
    }

    /**
     * 根据url query参数的token获取用户信息
     */
    getByQueryToken(): Promise<UserInfo> {
        return request.get(`${this.url}/getUserInfoByQueryToken`);
    }
}

@urlDecorator("/interface/refreshtoken")
class Token {
    url: string;

    /**
     * 获取站点信息
     * @returns 站点信息
     */
    get(): Promise<any> {
        return request.get(this.url);
    }
}

@urlDecorator("/interface/logout")
class Logout {
    url: string;

    /**
     * 获取站点信息
     * @returns 站点信息
     */
    post(): Promise<any> {
        return request.post(this.url, {});
    }
}

export const user = new User();
export const token = new Token();
export const logout = new Logout();
