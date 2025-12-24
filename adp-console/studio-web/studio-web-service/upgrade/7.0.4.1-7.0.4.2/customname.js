import logger from "../../common/logger";
import { SQL } from "../../common/sql";
import { TableName, formatInsertPayload } from "../../core/customname";
import { defaultConfig } from "../../conf/customname";

/**
 * 添加共享名称默认名词
 * @param {*} conn 连接对象
 */
export const setCustomName = async (conn) => {
    logger.info("添加 共享名称默认名词");
    const sql = new SQL(conn, TableName);
    const ret = (await sql.select([], "*"))[0];
    // 当没有数据才进行初始化
    if (ret.length === 0) {
        try {
            const [fields, fieldsType, values] =
                formatInsertPayload(defaultConfig);
            await sql.insert(fields, fieldsType, values);
        } catch (error) {
            logger.error(error);
        }
    }
};
