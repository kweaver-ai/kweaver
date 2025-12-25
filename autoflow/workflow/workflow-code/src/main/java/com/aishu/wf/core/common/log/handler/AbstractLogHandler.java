package com.aishu.wf.core.common.log.handler;

import com.aishu.wf.core.common.model.dto.OperationLogDTO;

/**
 * @description 日志处理抽象类
 * @author hanj
 */
public abstract class AbstractLogHandler implements LogHandler {

    /**
     * @description 构建操作日志对象
     * @author hanj
     * @param  args
     * @updateTime 2021/5/13
     */
    @Override
    public OperationLogDTO buildLog(Object[] args) {
        OperationLogDTO log = this.buildLogMsg(args);
        return log;
    }

    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param  args
     * @updateTime 2021/5/13
     */
    protected abstract OperationLogDTO buildLogMsg(Object[] args);

}
