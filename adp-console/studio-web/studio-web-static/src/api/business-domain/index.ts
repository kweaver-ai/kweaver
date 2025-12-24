import { request } from "../../tools/request";
import { BusinessDomainConfig } from "./declare";
import cookie from "js-cookie";

class BusinessDomain {
    url: string = "/api/business-system/v1/business-domain";

    /**
     * 获取业务域
     */
    get(): Promise<BusinessDomainConfig[]> {
        return request.get(
            this.url,
            {},
            {
                headers: {
                    Authorization: `Bearer ${cookie.get(
                        "studio.oauth2_token"
                    )}`,
                },
            }
        );
    }
}

export const businessDomain = new BusinessDomain();
