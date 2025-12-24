import { request } from "../../tools/request";
import { paramsSerializer } from "../../tools/request-utils";
import { RegistryInfo as Registry } from "./declare";

class RegistryInfo {
    url: string = "/api/studio-web-service/v1/webapp";

    /**
     * 获取指定名称注册插件信息
     * @returns 注册插件信息
     */
    async getInfoByName(
        microWidgetName: string,
        params?: { noUid?: boolean; clean?: boolean }
    ): Promise<Registry> {
        const result = await request.get(
            `${this.url}/${microWidgetName}?${paramsSerializer({
                ...params,
                // compute: true,
                sid: "00000000-0000-0000-0000-000000000000",
            })}`
        );
        result?.subapp?.children?.home && delete result.subapp.children.home;
        return result;
    }
}

class RegistryConfig {
    url: string = "/api/studio-web-service/v1/webappconfig";

    /**
     * 批量修改注册信息
     */
    batchEditConfig(params: object): Promise<void> {
        return request.patch(
            `${this.url}?${paramsSerializer({
                sid: "00000000-0000-0000-0000-000000000000",
                noUid: true,
            })}`,
            params
        );
    }
}

export const registryInfo = new RegistryInfo();
export const registryConfig = new RegistryConfig();
