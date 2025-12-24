import logger from "../../common/logger";

/**
 * 需求链接：266767
 * 要求：侧边栏颜色：全新安装：f4f4f4 升级上来：0C0E56
 * @param {*} conn 
 */
export const setSidebarBackgroundColor = async (conn) => {
    logger.info("添加 侧边栏底色 字段");
    const rows =
        (
            await conn.query(
                `select * from t_oem_config where f_option = 'sidebarBackgroundColor';`
            )
        )[0] || [];
    if (rows && rows.length) {
    } else {
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'sidebarBackgroundColor', '#0C0E56');`
        );
    }
};
