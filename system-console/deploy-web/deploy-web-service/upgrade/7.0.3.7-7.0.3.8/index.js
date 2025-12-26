import logger from '../../common/logger';
import { deploy } from '../../common/db';
import { setlogo } from './setLogo';

// 升级7.0.3.7到7.0.3.8
export const task = async () => {
    let conn;
    try {
        conn = await deploy.getConnection()
        await setlogo(conn);
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