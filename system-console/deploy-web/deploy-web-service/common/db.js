import { env } from "process";
import { configData } from "../handlers/tools/index";
import * as db from "mysql2/promise";

/**
 * 示例
 * host: rdsHost
 * password: rdsPassword
 * port: 3330
 * user: anyshare
 * dbName: deploy
 */
const {
    rds: {
        host: RDSHOST,
        password: RDSPWD,
        port: RDSPORT,
        user: RDSUSER,
        dbName: RDSDBNAME,
    },
} = configData.Module2Config;

// 数据库配置 从cms获取
const DBConfig = {
    // 主机地址
    host: RDSHOST,
    // 主机端口
    port: RDSPORT,
    // 用户名
    user: RDSUSER,
    // 密码
    password: RDSPWD,
    // 最大链接数
    connectionLimit: 15,
};

/**
 * 连接池创建函数
 * @param {*} database 数据库
 * @returns
 */
function poolFactory(database) {
    return db.createPool({
        ...DBConfig,
        database,
    });
}

const _deploy = poolFactory("deploy");
const _anyshare = poolFactory("anyshare");
const _sharemgnt = poolFactory("sharemgnt_db");

// 兼容 GoldenDB 和 Mysql
// _deploy.getConnection = async () => _deploy.promise()
// _anyshare.getConnection = async () => _anyshare.promise()
// _sharemgnt.getConnection = async () => _sharemgnt.promise()

export const deploy = _deploy;
export const anyshare = _anyshare;
export const sharemgnt = _sharemgnt;

// 程序执行完成之后需要清空
const pool = [deploy, anyshare, sharemgnt];

/**
 * 销毁所有连接池
 */
export const destoryDatabasePool = () => {
    try {
        pool.reduce(async (pre, dbPool) => {
            return pre.then(() => {
                return dbPool.end();
            });
        }, Promise.resolve(true));
    } catch (error) {
        return Promise.reject(error);
    }
};
