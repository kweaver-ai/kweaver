package com.aishu.wf.core.engine.core.service.impl;

import com.aishu.wf.core.engine.core.executor.ProcessExecutor;
import com.aishu.wf.core.engine.core.executor.ProcessExecutorFactory;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.cache.TaskEntityDataShare;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessExecuteService;
import com.aishu.wf.core.engine.util.JsonUtil;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional(propagation = Propagation.REQUIRED, readOnly = true)
@Slf4j
public class ProcessExecuteServiceImpl extends AbstractServiceHelper implements ProcessExecuteService {

    @Autowired
    private ProcessExecutorFactory processExecutorFactory;

    @Autowired
    ProcessConfigService processConfigService;

    /**
     * 流程执行接口
     *
     * @param processInputModel
     * @return Map<String, Object>
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public Map<String, Object> nextExecute(ProcessInputModel processInputModel) {
        TaskEntityDataShare.clear();
        long start = System.currentTimeMillis();
        if(log.isDebugEnabled()) {
            String jsonMsg = JsonUtil.convertToJson(processInputModel);
            log.debug("流程执行前消息包,processInputModelJson:{}", jsonMsg);
        }
        ProcessInstanceModel processInstanceModel = null;
        String executeStatus;
        String executeErrorMsg = "";
        ExceptionErrorCode exceptionErrorCode = null;
        try {
            // 初始化
            init(processInputModel);
            processInstanceModel = execute(processInputModel);
            executeStatus = EXECUTE_STATUS_SUCCESS;
        } catch (Exception e) {
            if (e instanceof WorkFlowException) {
                WorkFlowException wfe = WorkFlowException.getWorkFlowException(e);
                if (wfe == null) {
                    wfe = (WorkFlowException) e;
                }
                exceptionErrorCode = wfe.getExceptionErrorCode();
                executeErrorMsg = wfe.getWebShowErrorMessage();
            } else {
                executeErrorMsg = e.getMessage() + "____" +String.format("标题为[%s]的流程执行失败,processInputModel对象数据为[%s]",
                        processInputModel.getWf_procTitle(), processInputModel);
                exceptionErrorCode = ExceptionErrorCode.B2050;
            }
            throw new  WorkFlowException(exceptionErrorCode, executeErrorMsg);
        }
        Map<String, Object> resultMap = new HashMap<>();
        // 设置返回参数
        resultMap.put("executeStatus", executeStatus);
        resultMap.put("processInputModel", processInputModel);
        resultMap.put("processInstanceModel", processInstanceModel);
        resultMap.put("executeErrorCode", exceptionErrorCode);
        resultMap.put("executeErrorMsg", executeErrorMsg);
        log.debug("流程执行后输出参数:resultMap:" + resultMap);
        return resultMap;
    }

    /**
     * 流程执行初始化
     *
     * @param processInputModel
     */
    private void init(ProcessInputModel processInputModel) {
        //将ActivityReceiverModel对象(usercode+orgid)转换成字符串接人人userId
        ProcessDefinitionUtils.convertWf_receivers(processInputModel);
    }

    /**
     * 流程执行
     *
     * @param processInputModel
     * @return
     */
    private ProcessInstanceModel execute(ProcessInputModel processInputModel) {
        ProcessExecutor processExecuteCmd = processExecutorFactory
                .buildProcessExecutor(processInputModel.getWf_actionType());
        if (processExecuteCmd == null) {
            throw new WorkFlowException(ExceptionErrorCode.B2050,
                    "流程执行时无法在ProcessInputModel类中找到对应的wf_actionType操作");
        }
        ProcessInstanceModel processInstanceModel = processExecuteCmd.execute(processInputModel);
        return processInstanceModel;
    }


}
