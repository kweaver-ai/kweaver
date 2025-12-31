import * as yaml from "yaml";
import fetch from "node-fetch";
import * as https from "https";
import * as http from "http";
import * as path from "path";
import * as ini from "ini";
import * as fs from "fs";
import { lookup } from "dns/promises";
import { isArray } from "lodash";
import { Redis } from "ioredis";

/**
 * redis 连接类型
 */
const RedisConnectType = {
    /**
     * 哨兵
     */
    Sentinel: "sentinel",
    /**
     * 单机模式
     */
    Standalone: "standalone",
    /**
     * 主从模式（普通模式）
     */
    MasterSlave: "master-slave",
    /**
     * 集群模式
     */
    Cluster: "cluster",
};

/**
 * 读取conf文件
 * @param {*} filename 文件名
 */
const iniFileReader = (filename) => {
    try {
        const filepath = path.resolve(__dirname, filename);
        const serviceFile = fs.readFileSync(filepath, "utf-8");
        return ini.parse(serviceFile);
    } catch (err) {
        return {};
    }
};

// /**
//  * 获取命名空间
//  * @returns
//  */
// const getNamespace = () => {
//     const filepath = path.resolve(
//         "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
//     );
//     const content = fs.readFileSync(filepath, "utf-8");
//     return content.replace(/\s/g, "");
// };

/**
 * 读取 yaml 文件
 * @param {*} filename 文件名
 */
const yamlFileReader = (filename) => {
    try {
        const filepath = path.resolve(__dirname, filename);
        const serviceFile = fs.readFileSync(filepath, "utf-8");
        return yaml.parse(serviceFile);
    } catch (err) {
        return {};
    }
};

/**
 * 格式化 header
 * @param {*} clientID 客户端id
 * @param {*} clientSecret 客户端不公开口令
 */
const formatHeaders = (clientID, clientSecret) => {
    return clientID && clientSecret
        ? {
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
              authorization: `Basic ${Buffer.from(
                  `${encodeURIComponent(clientID)}:${encodeURIComponent(
                      clientSecret
                  )}`
              ).toString("base64")}`,
          }
        : {
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
          };
};

/**
 * 防止代码注入
 * @param {*} callback
 */
const fetchParse = async (url, args, code = 0) => {
    return await new Promise(async (resolve, reject) => {
        try {
            const fetchRet = await fetch(url, args);
            const fetchText = new Function(
                "console",
                "Error",
                "res",
                "req",
                "require",
                "Buffer",
                "exports",
                "__filename",
                "process",
                "setInterval",
                "setImmediate",
                "setTimeout",
                "TextDecoder",
                "TextEncoder",
                "URL",
                "URLSearchParams",
                "return " + (await fetchRet.text())
            )(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
            if (fetchRet.status < 400) {
                resolve({ text: fetchText, status: fetchRet.status });
            } else {
                reject({ ...fetchText, status: fetchRet.status });
            }
        } catch (error) {
            reject(code ? { ...error, code } : error);
        }
    });
};

/**
 * 跳过https证书验证
 */
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const conf = iniFileReader("/sysvol/conf/service_access.conf");

class Config {
    constructor() {
        this._oauthClientID = "";
        this._oauthClientSecret = "";
        this.updateModule2Config();
    }
    updateModule2Config(client_id = "", client_secret = "") {
        // 仅读取rds和redis配置
        this.globalConfig = yamlFileReader(
            "/etc/globalConfig/depservice/depServices.yaml"
        );
        client_id && (this._oauthClientID = client_id);
        client_secret && (this._oauthClientSecret = client_secret);
        this.module2Config = {
            "proton-application": {
                protocol: "http",
                host: "127.0.0.1",
                port: 18880,
            },
            "deploy-auth": {
                protocol: "http",
                host: "deploy-auth",
                port: 80,
            },
            ossgatewaymanager: {
                protocol: "http",
                privateHost: "ossgatewaymanager-private",
                privatePort: "9002",
                publicHost: "ossgatewaymanager-public",
                publicPort: "9000",
            },
            // 兼容ossgateway(目前接口名称)
            ossgateway: {
                protocol: "http",
                host: "ossgatewaymanager-private",
                port: "9002",
                publicHost: "ossgatewaymanager-public",
                publicPort: "9000",
            },
            license: {
                protocol: "http",
                host: "license-host",
                port: "8090",
            },
            log: {
                protocol: "http",
                host: "log",
                port: "9993",
            },
            "audit-log": {
                protocol: "http",
                host: "audit-log-private",
                port: "30569",
                publicHost: "audit-log-public",
                publicPort: "30569",
            },
            eacp: {
                protocol: "http",
                privateHttpHost: "eacp-private",
                privateHttpPort: "9998",
                publicHttpHost: "eacp-public",
                publicHttpPort: "9998",
                thriftHost: "eacp-thrift",
                thriftPort: "9992",
            },
            "deploy-manager": this.deploymanger,
            "deploy-service": this.deploymanger,
            nodemgnt: {
                protocol: "http",
                host: "nodemgnt-host",
                port: "8090",
            },
            ShareMgnt: {
                host: "sharemgnt",
                port: "9600",
            },
            EACP: {
                host: "eacp-thrift",
                port: "9992",
            },
            "user-management": {
                protocol: "http",
                publicHost: "user-management-public",
                publicPort: "30980",
                privateHost: "user-management-private",
                privatePort: "30980",
                host: "user-management-private",
                port: "30980",
            },
            "site-mgmt": {
                protocol: "http",
                host: "site-mgmt",
                port: "8000",
            },
            "proton-exporter": {
                protocol: "http",
                host: "proton-exporter",
                port: 8080,
            },
            "deploy-web": {
                protocol: "http",
                oauthOn:
                    this.oauth && this.oauth.oauthOn
                        ? this.oauth.oauthOn
                        : false,
                oauthClientID:
                    this.oauth && this.oauth.oauthClientID
                        ? this.oauth.oauthClientID
                        : "",
                oauthClientSecret:
                    this.oauth && this.oauth.oauthClientSecret
                        ? this.oauth.oauthClientSecret
                        : "",
            },
            hydra: {
                protocol: "http",
                administrativeHost: "hydra-admin",
                administrativePort: "4445",
                publicHost: "hydra-public",
                publicPort: "4444",
            },
            rds: {
                dbName:
                    this.globalConfig["rds"] && this.globalConfig["rds"].dbName
                        ? this.globalConfig["rds"].dbName
                        : "deploy",
                host:
                    this.globalConfig["rds"] && this.globalConfig["rds"].host
                        ? this.globalConfig["rds"].host
                        : "127.0.0.1",
                port:
                    this.globalConfig["rds"] && this.globalConfig["rds"].port
                        ? this.globalConfig["rds"].port
                        : 3330,
                user:
                    this.globalConfig["rds"] && this.globalConfig["rds"].user
                        ? this.globalConfig["rds"].user
                        : "anyshare",
                password:
                    this.globalConfig["rds"] &&
                    this.globalConfig["rds"].password
                        ? this.globalConfig["rds"].password
                        : "",
            },
            redis: {
                /*
                connectInfo:
                    host: xxx,
                    port: xxx,
                    username: xxx,
                    password: xxx,
                connectType: standalone
                */
                /*
                connectInfo:
                    masterHost: xxx,
                    masterPort: xxx,
                    password: xxx,
                    slaveHost: xxx,
                    slavePort: xxx,
                    username: xxx,
                connectType: master-slave
                */
                /*
                connectInfo:
                    masterGroupName: xxx,
                    sentinelHost: xxx,
                    sentinelPort: xxx,
                    sentinelPassword: xxx,
                    sentinelUsername: xxx,
                    username: xxx,
                    password: xxx,
                connectType: sentinel
                */
                connectInfo:
                    this.globalConfig["redis"] &&
                    this.globalConfig["redis"].connectInfo
                        ? {
                              ...this.globalConfig["redis"].connectInfo,
                          }
                        : {},
                connectType:
                    this.globalConfig["redis"] &&
                    this.globalConfig["redis"].connectType
                        ? this.globalConfig["redis"].connectType
                        : "",
            },
        };
    }

    get oauth() {
        return {
            oauthOn: false,
            oauthClientID: this._oauthClientID,
            oauthClientSecret: this._oauthClientSecret,
        };
    }

    get deploymanger() {
        return {
            protocol: "http",
            HttpHost: "deploy-service",
            HttpPort: "9703",
            host: "deploy-service",
            port: "9703",
        };
    }

    /**
     * 模块 端口协议映射
     */
    get Module2Config() {
        return this.module2Config;
    }
}

const configData = new Config();

/**
 * 发送https请求
 * @param option 配置项
 * @param data 数据
 */
const httpsRequest = async (option, data) => {
    return new Promise((resolve, reject) => {
        const requests = https.request(option, (res) => {
            res.setEncoding("utf8");
            res.on("data", (data) => {
                if (
                    (res.statusCode >= 200 && res.statusCode < 300) ||
                    res.statusCode === 304
                ) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        });
        requests.on("error", (err) => {
            reject(err);
        });
        data && requests.write(data);
        requests.end();
    });
};

/**
 * 发送https请求
 * @param option 配置项
 * @param data 数据
 */
const httpRequest = async (option, data) => {
    return new Promise((resolve, reject) => {
        const requests = http.request(option, (res) => {
            res.setEncoding("utf8");
            res.on("data", (data) => {
                if (
                    (res.statusCode >= 200 && res.statusCode < 300) ||
                    res.statusCode === 304
                ) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        });
        requests.on("error", (err) => {
            reject(err);
        });
        data && requests.write(data);
        requests.end();
    });
};

/**
 * 递归删除文件夹
 * @param path 路径
 */
const delDir = (path = "") => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const currentPath = path + "/" + file;
            if (fs.statSync(currentPath).isDirectory()) {
                delDir(currentPath); //递归删除文件夹
            } else {
                fs.unlinkSync(currentPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
};

/**
 * 获取UTC格式时间
 * @param {*} dateString 日期时间字符串
 * @returns UTC格式时间
 */
function getUTCTime(dateString) {
    let y, M, d, h, m, s;

    // (ISO 8601标准) 例：2017-12-14 , 2017-12-11T14:50:55+08:00
    if (
        dateString.match(
            /^\d{4}(-?\d{2}){2}([\sT]\d{2}:\d{2}:\d{2}([\+\-\s]\d{2}:\d{2})?)?/
        )
    ) {
        const {
            date = "1970-01-01",
            time = "00:00:00",
            zone = "+00:00",
        } = dateString
            .match(
                /^(\d{4}(-?\d{2}){2})|([\sT]\d{2}:\d{2}:\d{2})|([\+\-\s]\d{2}:\d{2})/g
            )
            .reduce((prev, currentValue, index) => {
                return {
                    ...prev,
                    date: currentValue.match(/\d{4}(-?\d{2}){2}/)
                        ? currentValue
                        : prev["date"],
                    time: currentValue.match(/[\sT]\d{2}:\d{2}:\d{2}/)
                        ? currentValue
                        : prev["time"],
                    zone: currentValue.match(/[\+\-\s]\d{2}:\d{2}/)
                        ? currentValue
                        : prev["zone"],
                };
            }, {});
        // zone指定时区，可以是：Z (UTC)、+hh:mm、-hh:mm
        const [hh, mm] = zone.split(":");
        const [, t = "00:00:00"] = time.split(/[\sT]/);

        [y = 0, M = 0, d = 0] = date.split("-").map(Number);
        [h = 0, m = 0, s = 0] = t.split(":").map(Number);
        h = h - Number(hh);
        m = m - Number(mm);
    } else {
        let [fullDate, time] = dateString.split(/\s+/);

        [h = 0, m = 0, s = 0] = time ? time.split(":").map(Number) : [];
        if (fullDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            [M = 0, d = 0, y = 0] = fullDate.split("/").map(Number);
        } else if (fullDate.match(/\d{4}(-\d{1,2}){2}/)) {
            [y = 0, M = 0, d = 0] = fullDate.split("-").map(Number);
        } else if (fullDate.match(/\d{4}(\.\d{1,2}){2}/)) {
            [y = 0, M = 0, d = 0] = fullDate.split(".").map(Number);
        }
    }

    return Date.UTC(y, M - 1, d, h, m, s);
}

/**
 * 获取clentID
 */
const getServiceConfigBase = () => {
    return (host, port) => {
        const { hydra, "deploy-web": deployweb } = configData.Module2Config;
        const { oauthClientID, oauthClientSecret } = deployweb;
        return {
            hydra,
            deployweb: {
                oauthClientID,
                oauthClientSecret,
                host: host,
                port: port,
            },
        };
    };
};

let getServiceConfig = () => ({});
try {
    getServiceConfig = getServiceConfigBase();
} catch (err) {}

/**
 * 创建哨兵连接信息
 * @param {*} sentinelHost 哨兵连接主机
 * @param {*} sentinelPort 哨兵连接端口
 * @returns
 */
function createSentinels(sentinelHost, sentinelPort) {
    return isArray(sentinelHost)
        ? sentinelHost.map((host, index) => {
              return {
                  host,
                  port: isArray(sentinelPort)
                      ? sentinelPort[index]
                      : sentinelPort,
              };
          })
        : [
              {
                  host: sentinelHost,
                  port: sentinelPort, // Redis port
              },
          ];
}

/**
 * 根据域名或者ip获取协议版本
 * @param {*} hostname 主机名称或者ip
 * @returns number
 */
async function getIPFamily(hostname) {
    const { family } = await lookup(hostname);
    const familyLowerCase = String(family).toLowerCase();
    if (
        familyLowerCase === "ipv4" ||
        familyLowerCase === "v4" ||
        familyLowerCase === "4"
    ) {
        return 4;
    } else if (
        familyLowerCase === "ipv6" ||
        familyLowerCase === "v6" ||
        familyLowerCase === "6"
    ) {
        return 6;
    } else {
        return family;
    }
}

/**
 * 创建一个redis存储器
 * 注： 账号与认证服务剥离暂不涉及redis数据库部分
 * @returns
 */
async function createRedisStore() {
    const { connectType, connectInfo } = configData.Module2Config.redis;
    let redisConnectInfo = null;
    if (connectType === RedisConnectType.Sentinel) {
        const {
            sentinelHost,
            sentinelPort,
            masterGroupName,
            sentinelPassword,
            sentinelUsername,
            username,
            password,
        } = connectInfo;

        redisConnectInfo = {
            sentinels: createSentinels(sentinelHost, sentinelPort),
            sentinelUsername: sentinelUsername, // needs Redis >= 6
            sentinelPassword: sentinelPassword,
            username: username, // needs Redis >= 6
            password: password,
            name: masterGroupName,
            family: await getIPFamily(sentinelHost),
        };
    } else if (connectType === RedisConnectType.MasterSlave) {
        const {
            masterHost,
            masterPort,
            password,
            slaveHost,
            slavePort,
            username,
        } = connectInfo;
        // session涉及写操作，master挂之后系统不再可用
        redisConnectInfo = {
            host: masterHost,
            port: masterPort,
            username,
            password,
            family: await getIPFamily(masterHost),
        };
    } else if (connectType === RedisConnectType.Standalone) {
        const { host, port, username, password } = connectInfo;

        redisConnectInfo = {
            host,
            port,
            username,
            password,
            family: await getIPFamily(host),
        };
    } else if (connectType === RedisConnectType.Cluster) {
        const { host, port: clusterPort, username, password } = connectInfo;

        const hostArray = host.split(",");
        const redisConnectHosts = hostArray.map((hostInfo) => {
            const [host, port] = hostInfo.split(":");
            return { host, port: port || clusterPort };
        });

        return new Redis.Cluster(redisConnectHosts, {
            redisOptions: {
                username, // 集群账号
                password, // 集群密码
            },
        });
    } else {
        throw new Error("redis connect type is not support!");
    }

    return new Redis(redisConnectInfo);
}

/**
 * 获取客户端ip
 * @param {*} headers 请求头
 * @returns ip
 */
const getRealIP = (headers) => {
    return headers["x-real-ip"]
        ? headers["x-real-ip"]
        : headers["X-Forwarded-For"]
        ? headers["X-Forwarded-For"]
        : "";
};

/**
 * 模式
 */
const URL_PREFIX_MODE = {
    // 去除头部的分隔符
    head: "head",
    // 去除尾部的分隔符
    tail: "tail",
    // 去除两端的分隔符
    edge: "edge",
};

/**
 * 对url前缀进行格式化
 * @param prefix url前缀
 * @returns /a/b => /a/b/
 */
const URLPrefixFormatter = (prefix, mode = "") => {
    if (!prefix || prefix === "/") {
        return "";
    } else {
        const list = prefix.split("/");
        const paths = list.filter((p) => p);
        if (mode === URL_PREFIX_MODE.edge) {
            return `${paths.join("/")}`;
        } else if (mode === URL_PREFIX_MODE.head) {
            return `${paths.join("/")}/`;
        } else if (mode === URL_PREFIX_MODE.tail) {
            return `/${paths.join("/")}`;
        } else {
            return `/${paths.join("/")}/`;
        }
    }
};

class Server {
    constructor() {
        this.server = null;
        this.storeType = "";
    }
    getServer() {
        return this.server;
    }
    setServer(newServer) {
        this.server = newServer;
    }

    getStoreType() {
        return this.storeType;
    }

    setStoreType(newStoreType) {
        this.storeType = newStoreType;
    }
}

const server = new Server();

const storeInstaceType = {
    Redis: "redis",
    Default: "default",
};

// 获取实例模式
const tenantMode = (() => {
    const globalConfig = yamlFileReader(
        "/etc/globalConfig/depservice/depServices.yaml"
    );
    return (
        globalConfig &&
        globalConfig["deploy-installer"] &&
        globalConfig["deploy-installer"].mode
    );
})();

export {
    iniFileReader,
    formatHeaders,
    // getNamespace,
    fetchParse,
    agent,
    httpRequest,
    delDir,
    URL_PREFIX_MODE,
    URLPrefixFormatter,
    httpsRequest,
    getServiceConfig,
    getServiceConfigBase,
    createRedisStore,
    createSentinels,
    getUTCTime,
    getRealIP,
    configData,
    server,
    storeInstaceType,
    yamlFileReader,
    tenantMode,
};
