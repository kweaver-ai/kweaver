import logger from '../../common/logger';

export const favicon = async (conn) => {
    logger.info('将三种语言 favicon.ico 整合成一个')
    const rows = (await conn.query(
        `select * from t_oem_config where f_section = 'shareweb_zh-cn' and f_option = 'favicon.ico';`
    ))[0] || [];
    if (!rows || !rows.length) {
        // 没有数据
        // 不能直接return conn不会清除 跳过即可
    } else if (rows.some(({ f_section, f_option }) => {
        return f_section === 'anyshare' && f_option === 'favicon.ico';
    })) {
        // 已经迁移过
        // 不能直接return conn不会清除 跳过即可
    } else {
        // 没有迁移过 执行迁移
        const ret = rows.find(({ f_section }) => f_section === 'shareweb_zh-cn');
        const val = ret ? ret.f_value : rows[0].f_value;

        await conn.query(
            `delete from t_oem_config where f_section = 'shareweb_zh-cn' and f_option = 'favicon.ico';`
        );
        await conn.query(
            `delete from t_oem_config where f_section = 'shareweb_zh-tw' and f_option = 'favicon.ico';`
        );
        await conn.query(
            `delete from t_oem_config where f_section = 'shareweb_en-us' and f_option = 'favicon.ico';`
        );
        await conn.query(
            `insert into t_oem_config (f_section, f_option, f_value) values ('anyshare', 'favicon.ico', '${val}');`
        );
    }
}