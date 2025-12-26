import logger from "../common/logger";
import { task as init } from "./init/index";
import { destoryDatabasePool } from "../common/db";
import { task as _7_0_3_2To7_0_3_3 } from "./7.0.3.2-7.0.3.3/index";
import { task as _7_0_3_3To7_0_3_4 } from "./7.0.3.3-7.0.3.4/index";
import { task as _7_0_3_5To7_0_3_6 } from "./7.0.3.5-7.0.3.6/index";
import { task as _7_0_3_6To7_0_3_7 } from "./7.0.3.6-7.0.3.7/index";
import { task as _7_0_3_7To7_0_3_8 } from "./7.0.3.7-7.0.3.8/index";
import { task as _7_0_3_9To7_0_4_0 } from "./7.0.3.9-7.0.4.0/index";
import { task as _7_0_4_1To7_0_4_2 } from "./7.0.4.1-7.0.4.2/index";
import { task as _7_0_4_5To7_0_4_6 } from "./7.0.4.5-7.0.4.6/index";

/**
 * 阻塞任务队列
 * 例如：建库、建表等基础操作
 */
const SyncTaskQueue = [
    init,
    _7_0_3_2To7_0_3_3,
    _7_0_3_3To7_0_3_4,
    _7_0_3_5To7_0_3_6,
    _7_0_3_6To7_0_3_7,
    _7_0_3_7To7_0_3_8,
    _7_0_3_9To7_0_4_0,
    _7_0_4_1To7_0_4_2,
    _7_0_4_5To7_0_4_6,
];

/**
 * 非阻塞任务队列
 * 例如：新增字段等操作
 */
const AsyncTaskQueue = [];

// 阻塞任务触发器
function SyncTaskTrigger() {
    return SyncTaskQueue.reduce(async (pre, task) => {
        return pre.then(() => {
            return task();
        });
    }, Promise.resolve(true));
}

// 非阻塞任务触发器
function AsyncTaskTrigger() {
    return Promise.all(AsyncTaskQueue.map((task) => task()));
}

function main() {
    SyncTaskTrigger()
        .then(
            (ret) => {
                return AsyncTaskTrigger();
            },
            (err) => {
                return Promise.reject(err);
            }
        )
        .then(
            (ret) => {
                return destoryDatabasePool();
            },
            (err) => {
                return Promise.reject(err);
            }
        )
        .then(
            (ret) => {
                logger.info("数据连接池清理成功！");
            },
            (err) => {
                logger.error(err);
                throw Error(err);
            }
        );
}

export { main };
