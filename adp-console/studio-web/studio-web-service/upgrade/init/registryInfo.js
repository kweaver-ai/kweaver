import { registryInfo } from '../../conf/registryInfo';
import { KeyMap, AppMap, TableName } from '../../core/registryinfo';

export const registryInfoTask = async (deployTabs, deployConn) => {
    if (deployTabs && deployTabs.every((item) => {
        return item.Tables_in_deploy !== TableName
    })) {
        await deployConn.beginTransaction();
        await deployConn.query(`CREATE TABLE IF NOT EXISTS ${TableName} (
            ${KeyMap.AppPathname} char(128) NOT NULL,
            ${KeyMap.AppTextZHCN} char(128) NOT NULL,
            ${KeyMap.AppTextZHTW} char(128) NOT NULL,
            ${KeyMap.AppTextENUS} char(128) NOT NULL,
            ${KeyMap.AppRegularIcon} char(128) NOT NULL,
            ${KeyMap.AppCheckedIcon} char(128) NOT NULL,
            ${KeyMap.SubappName} char(128) NOT NULL,
            ${KeyMap.SubappEntry} char(128) NOT NULL,
            ${KeyMap.SubappActiveRule} char(128) NOT NULL,
            ${KeyMap.SubappBaseRouter} char(128) NOT NULL,
            UNIQUE KEY f_index_app_name (${KeyMap.AppPathname}) USING BTREE
            ) ENGINE=InnoDB;`)
        // await registryInfo.reduce(async (pre, { app }) => {
        //     return pre.then(() => {
        //         const values = `('${Buffer.from(app[AppMap.Pathname].toString()).toString('utf-8')}',` +
        //             `'${Buffer.from(app[AppMap.TextZHCN].toString()).toString('utf-8')}',` +
        //             `'${Buffer.from(app[AppMap.TextZHTW].toString()).toString('utf-8')}',` +
        //             `'${Buffer.from(app[AppMap.TextENUS].toString()).toString('utf-8')}',` +
        //             `'${Buffer.from(app[AppMap.RegularIcon].toString()).toString('utf-8')}',` +
        //             `'${Buffer.from(app[AppMap.CheckedIcon].toString()).toString('utf-8')}',` +
        //             `'','','','');`;
        //         return deployConn.query(`insert into ${TableName}(` +
        //             `${KeyMap.AppPathname},` +
        //             `${KeyMap.AppTextZHCN},` +
        //             `${KeyMap.AppTextZHTW},` +
        //             `${KeyMap.AppTextENUS},` +
        //             `${KeyMap.AppRegularIcon},` +
        //             `${KeyMap.AppCheckedIcon},` +
        //             `${KeyMap.SubappName},` +
        //             `${KeyMap.SubappEntry},` +
        //             `${KeyMap.SubappActiveRule},` +
        //             `${KeyMap.SubappBaseRouter}) values ${values}`)
        //     })
        // }, Promise.resolve(true))
        await deployConn.commit();
    }
}