import logger from '../../common/logger';

export const setHomeSlogan = async (conn) => {
    logger.info('个性化支持oem产品主页标语')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'showHomePageSlogan';`
    ))[0] || [];
    if (rows && rows.length) {

    } else {
          await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'showHomePageSlogan', 'false');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_en-us', 'homePageSlogan', "");`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_zh-cn', 'homePageSlogan', "");`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('shareweb_zh-tw', 'homePageSlogan', "");`
        );
    }
}