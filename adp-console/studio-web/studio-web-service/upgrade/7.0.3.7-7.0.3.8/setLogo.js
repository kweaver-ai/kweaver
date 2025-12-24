import logger from '../../common/logger';
import {
    darklogo
} from './darklogo';

export const setlogo = async (conn) => {
    logger.info('logo图标支持上传深色浅色两种模式')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'darklogo.png';`
    ))[0] || [];
    if (rows && rows.length) {

    } else {
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_en-us', 'darklogo.png', "${darklogo}");`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_zh-cn', 'darklogo.png', "${darklogo}");`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_zh-tw', 'darklogo.png', "${darklogo}");`
        );
    }
}