import logger from '../../common/logger';
import { deploy } from '../../common/db';
import { setDesktopThirdLogin } from './setDesktopThirdLogin';
import { setConsoleProtal } from './setConsoleProtal';

// 升级7.0.3.3到7.0.3.4
export const task = async () => {
    let conn;
    try {
        conn = await deploy.getConnection()
        await setDesktopThirdLogin(conn);
        await setConsoleProtal(conn);
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