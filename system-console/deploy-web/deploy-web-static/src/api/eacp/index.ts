import cookie from "js-cookie";
import { request } from "../../tools/request";

class Eacp {
    url: string = "/api/eacp/v1";

    modifyPassword(body: any, { sign }: { sign: string }) {
        return request.post(
            `${this.url}/auth1/modifypassword?sign=${sign}`,
            body,
            {
                headers: {
                    authorization: `Bearer ${cookie.get(
                        "deploy.oauth2_token"
                    )}`,
                },
            }
        );
    }
}

export const eacp = new Eacp();
