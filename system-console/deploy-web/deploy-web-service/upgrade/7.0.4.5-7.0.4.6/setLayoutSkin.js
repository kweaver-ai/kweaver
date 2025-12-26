import logger from "../../common/logger";

export const setLayoutSkin = async (conn) => {
    logger.info("个性化支持主题皮肤设计");
    const rows =
        (
            await conn.query(
                `select * from t_oem_config where f_option = 'layoutType';`
            )
        )[0] || [];
    if (rows && rows.length) {
    } else {
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'layoutType', 'left');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinType', 'light');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageCurrent', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageHistory1', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageHistory2', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageHistory3', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageHistory4', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinImageHistory5', '');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinLayoutColor', '#fff');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinLogoComponentAdaptation', 'dark');`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'skinTextTabColor', 'light');`
        );
    }
};
