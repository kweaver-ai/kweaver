import logger from '../../common/logger';
import { deploy } from '../../common/db';
import { setLayoutSkin } from './setLayoutSkin';

// 升级7.0.4.5到7.0.4.6
export const task = async () => {
    let conn;
    try {
        conn = await deploy.getConnection()
        await setLayoutSkin(conn);
        logger.info('设置成功')
    } catch (error) {
        logger.error(error)
        // 注意 return 错误， 这里可以不打日志，全局会做截获
        return Promise.reject(error)
    } finally {
        if (conn) {
            conn.release()
        }
    }
}