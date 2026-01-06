import http from "http";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cookieParser from "cookie-parser";
import { test } from "../handlers/test";
import { jsonOnly } from "../handlers/middleware";
import { resgisterRouting } from "./routingTables";
import {
    createRedisStore,
    configData,
    storeInstaceType,
    server,
    tenantMode,
} from "../handlers/tools";
import RedisStore from "connect-redis";
import logger from "../common/logger";
import { registryClient } from "./helper";

export async function main() {
    await registryClient();

    try {
        let timer = null;
        const redisInstance = await createRedisStore();
        const storeInstace = new RedisStore({
            client: redisInstance,
            prefix: "deploy-web-app-sess:",
            ttl: 60 * 60 * 24, // 会话时间-设置清除过期会话的间隔，单位：秒
        });

        redisInstance
            .ping()
            .then(() => {
                timer && clearInterval(timer);
                timer = null;
                if (server.getStoreType() !== storeInstaceType.Redis) {
                    createServer(storeInstace);
                    server.setStoreType(storeInstaceType.Redis);
                }
            })
            .catch(() => {});

        redisInstance.on("error", () => {
            if (server.getStoreType() !== storeInstaceType.Default) {
                createServer();
                server.setStoreType(storeInstaceType.Default);
            }
            if (!timer) {
                timer = setInterval(() => {
                    redisInstance
                        .ping()
                        .then(() => {
                            timer && clearInterval(timer);
                            timer = null;
                            if (
                                server.getStoreType() !== storeInstaceType.Redis
                            ) {
                                createServer(storeInstace);
                                server.setStoreType(storeInstaceType.Redis);
                            }
                        })
                        .catch(() => {});
                }, 5000);
            }
        });
    } catch (e) {
        createServer();
        server.setStoreType(storeInstaceType.Default);
    }
}

export async function createServer(storeInstace = undefined) {
    const app = express();

    logger.info(
        "本地存储session类型为：",
        storeInstace ? storeInstaceType.Redis : storeInstaceType.Default
    );
    app.get("/health/ready", test) // k8s探针
        .get("/health/alive", test) // k8s探针
        .use(
            session({
                secret: "eisoo", // 用来对session id相关的cookie进行签名
                name: "clustersid",
                store: storeInstace, // 本地存储session（文本文件）
                // resave: false, // required: force lightweight session keep alive (touch)
                // saveUninitialized: false, // 是否自动保存未初始化的会话
                httpOnly: true,
            })
        )
        .use(cookieParser())
        .use(jsonOnly)
        .use(bodyParser.json({ limit: "5MB" }))
        .use(bodyParser.json({ type: "application/vnd.apache.thrift.json" }))
        .use(bodyParser.urlencoded({ extended: false, limit: "5MB" }))
        .options("*", cors());

    // 注册路由
    resgisterRouting(app);

    server.getServer() && server.getServer().close();

    const newServer = http.createServer(app);
    newServer.timeout = 0;
    newServer.listen(18080);
    server.setServer(newServer);
}
