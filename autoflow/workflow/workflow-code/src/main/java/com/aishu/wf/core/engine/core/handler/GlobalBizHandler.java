package com.aishu.wf.core.engine.core.handler;

import java.util.Map;

/**
 * 引擎业务应用全局回调处理接口
 *
 * @author lw
 * @version: 1.0
 */
public interface GlobalBizHandler {

    String EXECUTE_STATUS_SUCCESS = "SUCCESS";
    String EXECUTE_STATUS_ERROR = "ERROR";
    String EXECUTE_STATUS_KEY = "executeStatus";
    String PROCESS_INST_RESULT_KEY = "processInstanceModel";

    /**
     * 回调执行
     *
     * @param resultMap
     */
    void execute(Map<String, Object> resultMap);

}
