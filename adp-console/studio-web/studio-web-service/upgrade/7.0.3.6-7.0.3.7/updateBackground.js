import {
    zh_cn as zh_cn_old,
    zh_tw as zh_tw_old,
    en_us as en_us_old
} from './background';
import { background as zh_cn_new } from '../../conf/anyshare_zh-cn';
import { background as zh_tw_new } from '../../conf/anyshare_zh-tw';
import { background as en_us_new } from '../../conf/anyshare_en-us';
import logger from '../../common/logger';

export const updateBackground = async (conn) => {
    logger.info(`开始更新图片`)
    let rows = []
    try {
        rows = (await conn.query(
            `select * from t_oem_config where f_option like '%ackgroun%';`
        ))[0] || [];
    } catch (error) {
        logger.error(error)
    }
    const zh_cn_old_list = rows.filter(item => Buffer.from(item.f_value.toString()).toString('utf-8') === zh_cn_old);
    zh_cn_old_list && zh_cn_old_list.forEach(async ({ f_section, f_option }) => {
        try {
            await conn.query(
                `update t_oem_config set f_value = '${zh_cn_new}' where f_section = '${f_section}' and f_option = '${f_option}';`
            );
            logger.info(`${f_section} ${f_option}更新成功`)
        } catch (error) {
            logger.error(`${f_section} ${f_option}更新失败`)
        }
    })
    const zh_tw_old_list = rows.filter(item => Buffer.from(item.f_value.toString()).toString('utf-8') === zh_tw_old);
    zh_tw_old_list && zh_tw_old_list.forEach(async ({ f_section, f_option }) => {
        try {
            await conn.query(
                `update t_oem_config set f_value = '${zh_tw_new}' where f_section = '${f_section}' and f_option = '${f_option}';`
            );
            logger.info(`${f_section} ${f_option}更新成功`)
        } catch (error) {
            logger.error(`${f_section} ${f_option}更新失败`)
        }
    })
    const en_us_old_list = rows.filter(item => Buffer.from(item.f_value.toString()).toString('utf-8') === en_us_old);
    en_us_old_list && en_us_old_list.forEach(async ({ f_section, f_option }) => {
        try {
            await conn.query(
                `update t_oem_config set f_value = '${en_us_new}' where f_section = '${f_section}' and f_option = '${f_option}';`
            );
            logger.info(`${f_section} ${f_option}更新成功`)
        } catch (error) {
            logger.error(`${f_section} ${f_option}更新失败`)
        }
    })
    logger.info(`更新图片完成`)
}