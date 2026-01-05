import cookie from "js-cookie";
import { request } from "../../tools/request";

class IsfwebThrift {
    url: string = "/isfweb/api/ShareMgnt";

    getPwdConfig() {
        return request.post(`${this.url}/Usrm_GetPasswordConfig`, [], {
            headers: {
                authorization: `Bearer ${cookie.get("deploy.oauth2_token")}`,
            },
        });
    }

    getUserInfo(userid: string) {
        return request.post(`${this.url}/Usrm_GetUserInfo`, [userid], {
            headers: {
                authorization: `Bearer ${cookie.get("deploy.oauth2_token")}`,
            },
        });
    }
}

export const isfwebThrift = new IsfwebThrift();
