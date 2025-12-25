package com.aishu.wf.core.engine.core.handler;

import java.util.Map;
import java.util.Objects;

import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.anyshare.thrift.service.EacplogThriftService;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.config.model.ProcessErrorLog;
import com.aishu.wf.core.engine.config.service.ProcessErrorLogManager;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.JsonUtil;
import com.aishu.wf.core.thrift.eacplog.ncTLogItem;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;

import lombok.extern.slf4j.Slf4j;

/**
 * 流程全局日志处理器
 *
 * @author Liuchu
 * @since 2021-3-16 10:44:37
 */
@Service
@Slf4j
public class ProcessLogHandler implements GlobalBizHandler {
    @Autowired
    private ProcessErrorLogManager processErrorLogManager;
    @Autowired
    NsqSenderService nsqSenderService;
    /**
     * 执行入口
     */
    @Override
    public void execute(Map<String, Object> resultMap) {
        ProcessInstanceModel result = (ProcessInstanceModel) resultMap.get(GlobalBizHandler.PROCESS_INST_RESULT_KEY);
        try {
            String executeStatus = (String) resultMap.get(GlobalBizHandler.EXECUTE_STATUS_KEY);
            // 处理异常日志
            if (Objects.equals(executeStatus, GlobalBizHandler.EXECUTE_STATUS_ERROR)) {
                ProcessInputModel processInputModel = (ProcessInputModel) resultMap.get("processInputModel");
                String executeErrorMsg = (String) resultMap.get("executeErrorMsg");
                ProcessErrorLog infoLog = buildProcessErrorLog(processInputModel, executeErrorMsg);
                processErrorLogManager.save(infoLog);
            }
        } catch (Exception e) {
            log.warn("保存流程运行日志失败，processInstanceModel：" + result, e);
        }
    }
    /*
     * public void syncLog2EacpLog(ProcessErrorLog infoLog) { try { ncTLogItem item
     * = new ncTLogItem(); item.setUserId(infoLog.getCreator())
     * .setLevel("info".equals(infoLog.getProcessLogLevel()) ?
     * ncTLogLevel.NCT_LL_INFO : ncTLogLevel.NCT_LL_WARN)
     * .setLogType(ncTLogType.NCT_LT_MANAGEMENT) .setOpType(1)
     * .setDate(System.currentTimeMillis() * 1000)
     * .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0"
     * ) .setMsg(infoLog.getProcessMsg()) .setExMsg(infoLog.getErrorMsg());
     * eacplogThriftService.saveEacpLog(item); } catch (Exception e) {
     * log.error("同步流程日志到EacpLog失败！", e); } }
     */

    /**
     * 构建流程正常运行日志对象
     *
     * @param processInstanceModel 流程执行返回对象
     * @return ProcessErrorLog 日志对象
     */
    private ProcessErrorLog buildProcessInfoLog(ProcessInstanceModel processInstanceModel) {
        String jsonMsg = JsonUtil.convertToJson(processInstanceModel);
        ProcessInputModel processInputModel = processInstanceModel.getProcessInputModel();
        ProcessErrorLog processErrorLog = new ProcessErrorLog(
                StringUtils.isEmpty(processInstanceModel.getTopProcInstId()) ? processInputModel.getWf_procInstId()
                        : processInstanceModel.getTopProcInstId(),
                processInputModel.getWf_procTitle(),
                processInputModel.getWf_sendUserId() == null ? processInputModel.getWf_sender() : processInputModel.getWf_sendUserId(),
                processInputModel.getWf_actionType(), "", jsonMsg);
        processErrorLog.setAppId(processInputModel.getWf_appId());
        if (processInputModel.getWf_receivers() != null && !processInputModel.getWf_receivers().isEmpty()) {
            processErrorLog.setReceivers(processInputModel.getWf_receivers().toString());
        } else {
            processErrorLog.setReceivers(processInputModel.getWf_receiver());
        }
        processErrorLog.setProcessLogLevel("info");
        processErrorLog.setProcessDefName(processInputModel.getWf_procDefName());
        processErrorLog.setUserTime(processInstanceModel.getUseTime());
        return processErrorLog;
    }

    /**
     * 记录流程运行异常日志
     *
     * @param processInputModel 流程执行输入参数
     * @param errorMsg          错误信息
     * @return ProcessErrorLog 日志对象
     */
    private ProcessErrorLog buildProcessErrorLog(ProcessInputModel processInputModel, String errorMsg) {
        String jsonMsg = JsonUtil.convertToJson(processInputModel);
        ProcessErrorLog processErrorLog = new ProcessErrorLog(
                StringUtils.isEmpty(processInputModel.getWf_procInstId()) ? processInputModel.getWf_curActDefId()
                        : processInputModel.getWf_procInstId(),
                processInputModel.getWf_procTitle(),
                processInputModel.getWf_sendUserId() == null ? processInputModel
                        .getWf_sender() : processInputModel.getWf_sendUserId(),
                processInputModel.getWf_actionType(), errorMsg, jsonMsg);
        processErrorLog.setAppId(processInputModel.getWf_appId());
        if (processInputModel.getWf_receivers() != null
                && !processInputModel.getWf_receivers().isEmpty()) {
            processErrorLog.setReceivers(processInputModel.getWf_receivers().toString());
        } else {
            processErrorLog.setReceivers(processInputModel.getWf_receiver());
        }
        processErrorLog.setProcessLogLevel("error");
        processErrorLog.setProcessDefName(processInputModel.getWf_procDefName());
        return processErrorLog;
    }

}