import { TableName, Keys } from "../../core/customname";
import logger from '../../common/logger';

export const customNameTask = async (deployTabs, deployConn) => {
    if (
        deployTabs &&
        deployTabs.every((item) => {
            return item.Tables_in_deploy !== TableName;
        })
    ) {
        logger.info('正在创建custom_name 表')
        await deployConn.beginTransaction();
        await deployConn.query(`CREATE TABLE IF NOT EXISTS ${TableName} (
            ${Keys.Name} char(32) NOT NULL,
            ${Keys.Value} json DEFAULT NULL,
            UNIQUE KEY f_index_custom_name (${Keys.Name}) USING BTREE
            ) ENGINE=InnoDB;`);
        await deployConn.commit();
    }
};
