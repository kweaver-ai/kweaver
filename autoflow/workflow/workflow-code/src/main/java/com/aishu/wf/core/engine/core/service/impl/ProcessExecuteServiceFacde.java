package com.aishu.wf.core.engine.core.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.handler.GlobalBizHandler;
import com.aishu.wf.core.engine.core.handler.GlobalBizHandlerInterceptor;
import com.aishu.wf.core.engine.core.handler.GlobalBizHandlerInvocation;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.cache.TaskEntityDataShare;
import com.aishu.wf.core.engine.core.service.ProcessExecuteService;
import com.aishu.wf.core.engine.util.WorkFlowException;

@Service
public class ProcessExecuteServiceFacde {

    protected Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    ProcessExecuteService processExecuteService;
    public static final String EXECUTE_STATUS_SUCCESS = "SUCCESS";
    public static final String EXECUTE_STATUS_ERROR = "ERROR";

	/**
     * 流程执行接口
     *
     * @param processInputModel
     * @return Map<String, Object>
     */
    public Map<String, Object> nextExecute(ProcessInputModel processInputModel) {
        TaskEntityDataShare.clear();
        Map<String, Object> result =new  HashMap<String, Object>() ; 
        try {
        	result = processExecuteService.nextExecute(processInputModel);
        }catch(WorkFlowException e) {
        	if(e.getExceptionErrorCode().toString().indexOf("S00")!=-1) { 
        		throw new WorkFlowException(e.getExceptionErrorCode(), e.getWebShowErrorMessage());
        	}
        	// 设置返回参数
        	result.put("executeStatus", ProcessExecuteService.EXECUTE_STATUS_ERROR);
        	result.put("processInputModel", processInputModel);
        	result.put("executeErrorCode", e.getExceptionErrorCode());
        	result.put("executeErrorMsg", e.getMessage());
        	return result;
        }
        ProcessInstanceModel processInstanceModel = (ProcessInstanceModel) result.get("processInstanceModel");
        try {
            if (processInstanceModel != null) {
                notifyByThread(result, processInstanceModel);
            }
        } catch (Exception e) {
            logger.warn("", e);
        } finally {
            TaskEntityDataShare.clear();
        }
        return result;
    }

    /**
     * 流程执行后通知处理器
     *
     * @param processInstanceModel
     */
    private void notifyByThread(final Map<String, Object> resultMap, final ProcessInstanceModel processInstanceModel) {
        ExecutorService pool = Executors.newCachedThreadPool();
        pool.execute(() -> notifyTask(resultMap));
        pool.shutdown();
    }

    /**
     * 流程执行后通知处理器
     *
     * @param resultMap
     */
    private void notifyTask(Map<String, Object> resultMap) {
        GlobalBizHandlerInterceptor interceptor = new GlobalBizHandlerInterceptor();
        Map<String, Object> services = ApplicationContextHolder.getBeans(GlobalBizHandler.class);
        if (services.isEmpty()) {
            return;
        }
        for (Entry<String, Object> service : services.entrySet()) {
            try {
                interceptor.handleInvocation(new GlobalBizHandlerInvocation((GlobalBizHandler) service.getValue(), resultMap));
            } catch (Exception e) {
                String errorMsg = String.format("调用全局业务代理[%s]出现异常,resultMap对象数据为[%s]", service, resultMap);
                logger.warn(errorMsg, e);
            }
        }
    }

}
