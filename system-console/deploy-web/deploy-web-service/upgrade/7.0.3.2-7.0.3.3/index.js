import logger from '../../common/logger';
import { deploy } from '../../common/db';
import { docDomain } from './docDomain';
import { favicon } from './favicon';

// 升级7.0.2.6到7.0.3.0
export const task = async () => {
    let conn;
    try {
        conn = await deploy.getConnection()
        await favicon(conn);
        await docDomain(conn);
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