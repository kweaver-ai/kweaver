import logger from '../../common/logger';
import { deploy, sharemgnt } from '../../common/db';
import { anyshare_en_us } from '../../conf/anyshare_en-us';
import { anyshare_zh_cn } from '../../conf/anyshare_zh-cn';
import { anyshare_zh_tw } from '../../conf/anyshare_zh-tw';
import { registryInfoTask } from './registryInfo';
import { customNameTask } from './customname';
import { anyshare } from '../../conf/anyshare';

// 迁移sharemgnt
export const task = async () => {
    /**
    host: rdsHost
    password: rdsPassword
    port: 3330
    user: anyshare
    dbName: sites
     */
    let deployConn, sharemgntConn;
    try {
        deployConn = await deploy.getConnection()
        sharemgntConn = await sharemgnt.getConnection()
        const deployTabs = (await deployConn.query('show tables;'))[0] || [];
        const sharemgntTabs = (await sharemgntConn.query('show tables;'))[0] || [];
        const isInSharemgnt = sharemgntTabs.find((item) => {
            return item.Tables_in_sharemgnt_db === 't_oem_config'
        })
        const isInDeploy = deployTabs.find((item) => {
            return item.Tables_in_deploy === 't_oem_config'
        })
        if (!isInSharemgnt && !isInDeploy) {
            logger.info('创建t_oem_config数据表')
            await deployConn.beginTransaction();
            await deployConn.query(`CREATE TABLE IF NOT EXISTS t_oem_config (
                f_section char(32) NOT NULL,
                f_option char(32) NOT NULL,
                f_value mediumblob NOT NULL,
                UNIQUE KEY f_index_section_option (f_section,f_option) USING BTREE
                ) ENGINE=InnoDB;`)
            await [
                ...anyshare_en_us,
                ...anyshare_zh_cn,
                ...anyshare_zh_tw,
                ...anyshare
            ].reduce(async (pre, cur) => {
                return pre.then(() => {
                    const values = `('${cur.section}','${cur.option}','${Buffer.from(cur.value.toString()).toString('utf-8')}');`;
                    return deployConn.query(`insert into t_oem_config(f_section, f_option, f_value) values ${values}`)
                })
            }, Promise.resolve(true))
            await deployConn.commit();
        } else if (!isInDeploy) {
            // 如果deploy里面没有 t_oem_config 表
            /**
             * 注意：Mysql Statement violates GTID consistency: CREATE TABLE ... SELECT.
             * rds 存在问题 create table t_oem_config (select * from sharemgnt_db.t_oem_config);
             */
            logger.info('将t_oem_config数据表，从sharemgnt迁移到deploy数据库')
            await deployConn.query('create table t_oem_config like sharemgnt_db.t_oem_config;')
            await deployConn.query('insert into t_oem_config select * from sharemgnt_db.t_oem_config;')
        }
        await registryInfoTask(deployTabs, deployConn)
        await customNameTask(deployTabs, deployConn);
    } catch (error) {
        // 注意 return 错误， 这里可以不打日志，全局会做截获
        logger.error(error)
        return Promise.reject(error)
    } finally {
        if (deployConn) {
            deployConn.release()
        }
        if (sharemgntConn) {
            sharemgntConn.release()
        }
    }
}