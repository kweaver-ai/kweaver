import logger from '../../common/logger';
import { deploy } from '../../common/db';
import { setHomeSlogan } from './setHomeSlogan';
import { setCustomName } from './customname';

// 升级7.0.4.1到7.0.4.2
export const task = async () => {
    let conn;
    try {
        conn = await deploy.getConnection()
        await setHomeSlogan(conn);
        await setCustomName(conn);
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