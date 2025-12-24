import logger from '../../common/logger';

export const setConsoleProtal = async (conn) => {
    logger.info('修改企业内容门户名称')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'portalBanner';`
    ))[0]||[];
    if (rows && rows.length) {
        await conn.query(
            `delete from t_oem_config where f_section = 'shareweb_en-us' and f_option = 'portalBanner';`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_en-us', 'portalBanner', 'Content Portal');`
        );
    } else {

    }
}