/* eslint-disable no-param-reassign */
import axios, { AxiosError, AxiosInstance } from "axios";
import { Configuration, DefaultApi as Oauth2Api } from "./oauth2";
import { DefaultApi as EfastApi } from "./efast";
import { DefaultApi as DocCollectionApi } from "./doc-collection";
import { DefaultApi as AutomationApi } from "./content-automation";
import { DefaultApi as WorkflowApi } from "./workflow";
import { DefaultApi as OpenDocApi } from "./open-doc";
import { DefaultApi as AppStoreApi } from "./app-store";
import { DefaultApi as PersonalConfigApi } from "./personal-config";
import { DefaultApi as MetadataApi } from "./metadata";

export interface ApiError {
    cause: string;
    code: number;
    message: string;
}

export interface ApiConfig {
    businessDomainID: string;
    baseURL: string;
    token: string;
    language: string;
    pathPrefix?: string;
    isRefreshable(err: AxiosError<ApiError>): boolean;
    refreshToken?(): Promise<string> | string;
}

export class Api {
    private readonly _axios: AxiosInstance;

    private readonly _oauth2: Oauth2Api;

    private readonly _efast: EfastApi;

    private readonly _docCollection: DocCollectionApi;

    private readonly _automation: AutomationApi;

    private readonly _workflow: WorkflowApi;

    private readonly _openDoc: OpenDocApi;

    private readonly _appStore: AppStoreApi;

    private readonly _personalConfig: PersonalConfigApi;
    private readonly _metadata: MetadataApi;

    private _config: ApiConfig = {
        baseURL: window.location.origin,
        token: "",
        language: "zh-cn",
        isRefreshable: () => false,
        businessDomainID: "",
    };

    private refreshPromise: any = null;

    constructor(config: Partial<ApiConfig> = {}) {
        this.setup(config);
        this._axios = axios.create();
        this._axios.interceptors.request.use(async (conf) => {
            if (!conf.baseURL && conf.url && /^(\/)?api/.test(conf.url)) {
                conf.baseURL = this.getBasePath();
            }

            if (!conf.headers) {
                conf.headers = {};
            }

            if (conf.method === "get") {
                const { allowTimestamp = true } = conf;
                if (allowTimestamp) {
                    const separator = conf.url.indexOf("?") === -1 ? "?" : "&";
                    conf.url += separator + "_t=" + new Date().getTime();
                }
            }

            conf.headers.authorization = `Bearer ${this._config.token}`;
            conf.headers["X-Language"] = this._config.language;
            conf.headers["x-business-domain"] = this._config.businessDomainID;

            return conf;
        });
        this._axios.interceptors.response.use(
            (res) => res,
            async (err: AxiosError<ApiError>) => {
                if (
                    this._config.isRefreshable(err) &&
                    typeof this._config.refreshToken === "function"
                ) {
                    try {
                        if (!this.refreshPromise) {
                            this.refreshPromise = this._config.refreshToken();
                        }
                        this._config.token = await this.refreshPromise;
                        return this._axios.request(err.config);
                    } catch (_) {
                        throw err;
                    } finally {
                        this.refreshPromise = null;
                    }
                }
                throw err;
            }
        );
        this._oauth2 = this.createApi(Oauth2Api);
        this._efast = this.createApi(EfastApi, "/api");
        this._docCollection = this.createApi(
            DocCollectionApi,
            "/api/file-collector/v1"
        );
        this._automation = this.createApi(AutomationApi, "/api/automation/v1");
        this._workflow = this.createApi(WorkflowApi, "/api");
        this._openDoc = this.createApi(OpenDocApi);
        this._appStore = this.createApi(AppStoreApi);
        this._personalConfig = this.createApi(
            PersonalConfigApi,
            "/api/personal-config/v1"
        );
        this._metadata = this.createApi(MetadataApi, "/api");
    }

    public setup(config: Partial<ApiConfig>) {
        Object.assign(this._config, config);
    }

    private getBasePath() {
        return this._config.baseURL + this._config.pathPrefix;
    }

    get oauth2() {
        return this._oauth2;
    }

    get efast() {
        return this._efast;
    }

    get docCollection() {
        return this._docCollection;
    }

    get automation() {
        return this._automation;
    }

    get workflow() {
        return this._workflow;
    }

    get openDoc() {
        return this._openDoc;
    }

    get appStore() {
        return this._appStore;
    }

    get personalConfig() {
        return this._personalConfig;
    }
    get metadata() {
        return this._metadata;
    }

    /**
     * 直接使用axios加url调用接口时需考虑富客户端请求场景
     * 可通过prefixUrl拼接url获得真实路径
     * 如果 url 为 api 或 /api 且未设置 baseUrl, 会将
     * baseUrl 设为 this.getBasePath()
     */
    get axios() {
        return this._axios;
    }

    private createApi<
        T,
        C extends {
            new(
                configuration?: Configuration,
                basePath?: string,
                axios?: AxiosInstance
            ): T;
        }
    >(Ctor: C, prefix: string = "") {
        const instance = new Ctor(undefined, undefined, this._axios);
        Object.defineProperty(instance, "basePath", {
            get: () => this.getBasePath() + prefix,
        });
        return instance;
    }
}

export default new Api();

export * as efast from "./efast";
export * as oauth2 from "./oauth2";
export * as docCollection from "./doc-collection";
export * as automation from "./content-automation";
export * as openDoc from "./open-doc";
export * as workflow from "./workflow";
export * as appStore from "./app-store";
export * as personalConfig from "./personal-config";
export * as metadata from "./metadata";
