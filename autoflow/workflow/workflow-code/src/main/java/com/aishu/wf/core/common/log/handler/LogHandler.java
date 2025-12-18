package com.aishu.wf.core.common.log.handler;

import com.aishu.wf.core.common.model.dto.OperationLogDTO;

/**
 * @description 日志处理接口
 * @author hanj
 */
public interface LogHandler {

    /**
     * @description 构建操作日志对象
     * @author hanj
     * @param  args
     * @updateTime 2021/5/13
     */
    OperationLogDTO buildLog(Object[] args);

}
