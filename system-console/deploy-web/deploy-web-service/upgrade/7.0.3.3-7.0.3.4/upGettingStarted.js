import logger from '../../common/logger';

export const upGettingStarted = async (conn) => {
    logger.info('添加  快速开始 和 在线帮助 字段')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'showGettingStarted' or f_option = 'showOnlineHelp';`
    ))[0] || [];
    if (rows && rows.length) {

    } else {
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'showGettingStarted', 'true');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'showOnlineHelp', 'true');`
        );
    }
}