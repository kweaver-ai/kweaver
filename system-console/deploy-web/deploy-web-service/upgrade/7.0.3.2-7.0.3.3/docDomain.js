import logger from '../../common/logger';

export const docDomain = async (conn) => {
    logger.info('添加 文档域 地址 和 端口')
    const rows = (await conn.query(
        `select * from t_oem_config where f_option = 'docDomainPort' or f_option = 'docDomainHostName';`
    ))[0] || [];
    if (rows && rows.length) {

    } else {
        if (!rows.find((row) => row.f_section === 'mobile' && row.f_option === 'docDomainHostName')) {
            await conn.query(
                `insert into t_oem_config (f_section, f_option, f_value) values ('mobile', 'docDomainHostName', '');`
            );
        }
        if (!rows.find((row) => row.f_section === 'mobile' && row.f_option === 'docDomainPort')) {
            await conn.query(
                `insert into t_oem_config (f_section, f_option, f_value) values ('mobile', 'docDomainPort', '443');`
            );
        }

        if (!rows.find((row) => row.f_section === 'desktop' && row.f_option === 'docDomainHostName')) {
            await conn.query(
                `insert into t_oem_config (f_section, f_option, f_value) values ('desktop', 'docDomainHostName', '');`
            );
        }
        if (!rows.find((row) => row.f_section === 'desktop' && row.f_option === 'docDomainPort')) {
            await conn.query(
                `insert into t_oem_config (f_section, f_option, f_value) values ('desktop', 'docDomainPort', '443');`
            );
        }
    }
}