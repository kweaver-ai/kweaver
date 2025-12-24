import { urlDecorator } from "../../tools/decorator";
import { request } from "../../tools/request";
import { OemConfigInfo } from "./declare";

export enum Section {
    AnyShare = "anyshare",

    ShareWebZHCN = "shareweb_zh-cn",

    ShareWebZHTW = "shareweb_zh-tw",

    ShareWebENUS = "shareweb_en-us",
}

class OemConfig {
    url: string = "/api/deploy-web-service/v1/oemconfig";

    /**
     * 获取oem信息
     * @returns oem信息
     */
    get(section: string, product: string): Promise<OemConfigInfo> {
        return request.get(`${this.url}?section=${section}&product=${product}`);
    }

    /**
     * 获取oem信息
     * @returns oem信息
     */
    getArray(section: string, product: string): Promise<Array<OemConfigInfo>> {
        return request.get(
            `${this.url}?type=array&section=${section}&product=${product}`
        );
    }
}

export const oemconfig = new OemConfig();
