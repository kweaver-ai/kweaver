import logger from '../../common/logger';

export const setDesktopThirdLogin = async (conn) => {
    logger.info('添加  第三方登录窗口类型 和 第三方登录窗口宽高')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'desktopThirdLoginSize';`
    ))[0] || [];
    if (rows && rows.length) {

    } else {
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'desktopThirdLoginSize', 'default');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'desktopThirdLoginWidth', '480');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'desktopThirdLoginHeight', '600');`
        );
    }
}