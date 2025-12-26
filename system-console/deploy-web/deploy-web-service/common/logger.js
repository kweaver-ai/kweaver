// 日志方法库
import { configure, getLogger } from 'log4js';

class Logger {
    constructor() {
        configure({
            appenders: {
                cheese: {
                    type: "console"
                }
            },
            categories: { default: { appenders: ['cheese'], level: 'info' } }
        })
        this.logger = getLogger("cheese")
    }

    static createLogger() {
        return (new Logger()).logger
    }
}

export default Logger.createLogger();