import { signup } from "../../core/auth";
import { defaultPathList } from "../../core/path";
import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import { logoutTimer } from "../../core/bootstrap";
import ErrorCode from "./errorCode/errorCode";
import { Modal } from "antd";
import __ from "./locale";
import React from "react";
import { getRefreshToken } from "../../core/microWidgetProps/utils";

interface Config {
    // 前缀
    prefix?: string;
    // 协议
    protocol?: string;
    // ip|域名
    hostname?: string;
    // 端口
    port?: string | number;
    // 用户鉴权信息
    token?: string;
    // headers
    headers?: any;
}

/**
 * ShareWebDeploy存在备份，需要两边同时修改
 */
// 捕获时不触发延时器的访问地址
const WhiteURLList = [
    "/api/deploy-web-service/v1/sub-app/registry-info",
    "/interface/deployweb/refreshtoken",
];

interface Reuqest {
    // 设置配置
    setupConfig(config: Config): void;
    // 添加拦截器
    useInterceptors(): void;
    // 移除拦截器
    ejectInterceptors(): void;

    // 获取元数据
    head<T = any>(url: string): Promise<T>;
    // 获取
    get<T = any, R = any>(
        url: string,
        params?: R,
        config?: AxiosRequestConfig
    ): Promise<T>;
    // 新增
    put<T = any, R = any>(url: string, body?: T): Promise<R>;
    // 修改
    post<T = any, R = any>(
        url: string,
        body: T,
        config?: AxiosRequestConfig
    ): Promise<R>;
    // 部分修改
    patch<T = any, R = any>(
        url: string,
        body: T,
        config?: AxiosRequestConfig
    ): Promise<R>;
    // 删除
    delete(url: string): Promise<any>;
}

class Configs {
    /**
     * 配置信息
     */
    config: Config;

    constructor() {
        const { protocol, hostname, port } = window.location;
        this.config = {
            protocol,
            hostname,
            port,
            token: "",
            headers: {},
        };
    }

    /**
     * 设置配置信息
     * @param config 配置
     */
    setConfig(config: any[]): void {
        Object.assign(this.config, ...config);
    }

    /**
     * 获取请求头
     * @returns headr
     */
    getHeaders(): any {
        return this.config.headers;
    }

    /**
     * 是否使用https
     * @returns 是否使用https
     */
    useHTTPS(): boolean {
        return (
            (this.config.protocol || "") === "https:" ||
            window.location.protocol === "https:"
        );
    }
}

class Requests extends Configs {
    /**
     * 实例
     */
    private requestInstance: AxiosInstance;
    private interceptor: number;

    constructor() {
        super();
        this.requestInstance = axios.create({
            baseURL: `${this.config.protocol}//${this.config.hostname}:${this.config.port}`,
            headers: {
                "Cache-Control": "no-cache",
            },
        });
    }

    /**
     * 验证状态
     * @param status 状态码
     * @returns boolean
     */
    private validateStatus(status: number): boolean {
        return (status >= 200 && status < 300) || status === 304;
    }

    /**
     * 添加拦截器
     */
    public useInterceptors() {
        this.requestInstance.interceptors.request.use(async (config) => {
            return {
                ...config,
                headers: {
                    ...config.headers,
                },
            };
        });
        this.interceptor = this.requestInstance.interceptors.response.use(
            (response: any): any => {
                // 非登录页添加定时器
                if (
                    WhiteURLList.some((url) => {
                        return response.config.url!.indexOf(url) !== -1;
                    }) ||
                    defaultPathList.includes(location.pathname)
                ) {
                    return response;
                } else {
                    logoutTimer();
                    return response;
                }
            },
            async (error: any) => {
                if (
                    error &&
                    error.response &&
                    error.response.status === 403 &&
                    !error?.config?.url.includes(
                        "/interface/deployweb/refreshtoken"
                    )
                ) {
                    if (error?.config?.url.includes("logout")) {
                        signup(defaultPathList[1], true);
                        return;
                    }
                    try {
                        await getRefreshToken();
                        const result = await this.requestInstance(error.config);
                        return Promise.resolve(result);
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }

                // deploy-installer和deploy-auth的接口会特殊处理400错误，无需重复处理
                if (
                    error.response.status === 400 &&
                    !error?.config?.url.includes("deploy-installer") &&
                    !error?.config?.url.includes("deploy-auth")
                ) {
                    // 登录界面错误不显示弹窗，显示红色提示信息
                    Modal.error({
                        okText: __("确定"),
                        content: (
                            <ErrorCode
                                cause={error.response.data.cause}
                                errorCode={error.response.data.code}
                                description={error.response.data.message}
                            />
                        ),
                    });
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * 取消拦截器
     */
    public ejectInterceptors() {
        this.requestInstance.interceptors.response.eject(this.interceptor);
    }

    /**
     * 设置配置信息些
     */
    public setupConfig(...config: any[]): void {
        this.setConfig(config);
        this.requestInstance.defaults.baseURL = `${this.config.protocol}//${
            this.config.hostname
        }:${this.config.port}${this.config.prefix ? this.config.prefix : ""}`;
    }

    /**
     * 获取元数据
     * @param url url
     * @returns 空
     */
    public head(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .head(url, {
                    validateStatus: this.validateStatus,
                    headers: this.getHeaders(),
                    params: { _t: new Date().getTime() },
                })
                .then(
                    ({ headers }) => {
                        resolve(headers);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }

    /**
     * 获取
     * @param url url
     * @returns 返回值
     */
    public get<P, T>(url: string, params: T, config: any): Promise<P> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .get(url, {
                    validateStatus: this.validateStatus,
                    headers: config?.headers
                        ? { ...this.getHeaders(), ...config.headers }
                        : this.getHeaders(),
                    params: {
                        _t: new Date().getTime(),
                        ...(params || {}),
                    },
                })
                .then(
                    ({ data }) => {
                        resolve(data);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }

    /**
     * 新增
     * @param url url
     * @param body 负载
     * @returns 返回值
     */
    public put<T, P>(url: string, body: T): Promise<P> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .put(url, body, {
                    validateStatus: this.validateStatus,
                    headers: this.getHeaders(),
                })
                .then(
                    ({ data }) => {
                        resolve(data);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }

    /**
     * 修改
     * @param url url
     * @param body 负载
     * @param config 配置
     * @returns 返回值
     */
    public post<T, P>(url: string, body: T, config: any): Promise<P> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .post(url, body, {
                    ...config,
                    validateStatus: this.validateStatus,
                    headers: config?.headers
                        ? { ...this.getHeaders(), ...config.headers }
                        : this.getHeaders(),
                })
                .then(
                    ({ data }) => {
                        resolve(data);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }

    /**
     * 部分修改
     * @param url url
     * @param body 请求负载
     * @returns 返回值
     */
    public patch<T, P>(url: string, body: T, config: any): Promise<P> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .patch(url, body, {
                    validateStatus: this.validateStatus,
                    headers: config?.headers
                        ? { ...this.getHeaders(), ...config.headers }
                        : this.getHeaders(),
                })
                .then(
                    ({ data }) => {
                        resolve(data);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }

    /**
     * 删除
     * @param url url
     * @returns 返回值
     */
    public delete<P>(url: string): Promise<P> {
        return new Promise((resolve, reject) => {
            this.requestInstance
                .delete(url, {
                    validateStatus: this.validateStatus,
                    headers: this.getHeaders(),
                })
                .then(
                    ({ data }) => {
                        resolve(data);
                    },
                    ({ response }) => {
                        if (response && response.data) {
                            reject(response.data);
                        } else {
                            reject(response);
                        }
                    }
                );
        });
    }
}

export const request: Reuqest = new Requests();
