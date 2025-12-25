package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * @description 处理流程实例作废操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.INSTANCE_CANCEL_LOG)
public class ProcessInstanceCancelLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    private ProcessInstanceService processInstanceService;
    @Autowired
    private I18nController i18n;


    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(this.buildMsg(args));
        log.setExMsg(this.buildExMsg(args));
        log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
        log.setOpType(this.getOpType());
        return log;
    }

    /**
     * @description 构建操作描述
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildMsg(Object[] args) {
        List<String> procInstIds = Collections.unmodifiableList((List<String>) args[0]);
        if (procInstIds.size() == 1) {
            return StrUtil.format(i18n.getMessage("discardWorkflow") + " “{}”", procInstIds.get(0));
        } else {
            StringBuilder builder = new StringBuilder(i18n.getMessage("bulkDiscardWorkflow"));
            for (String procInstId : procInstIds) {
                builder.append("“").append(procInstId).append("”");
            }
            return builder.toString();
        }
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildExMsg(Object[] args) {
        List<String> procInstIds = Collections.unmodifiableList((List<String>) args[0]);
        if (procInstIds.size() == 1) {
            ProcessInstanceModel instance = processInstanceService.getProcessInstanceById(procInstIds.get(0));
            return StrUtil.format(i18n.getMessage("workflowName") + " “{}”", instance.getProcTitle());
        } else {
            StringBuilder builder = new StringBuilder(i18n.getMessage("bulkDiscardWorkflow"));
            for (String procInstId : procInstIds) {
                ProcessInstanceModel instance = processInstanceService.getProcessInstanceById(procInstId);
                builder.append("["+i18n.getMessage("workflowName")+" “").append(instance.getProcTitle()).append("”]");
            }
            return builder.toString();
        }
    }

    /**
     * @description 获取当前操作的类型
     * @author hanj
     * @param
     * @updateTime 2021/4/30
     */
    protected Integer getOpType() {
        return ncTManagementType.NCT_MNT_AUDIT_MGM.getValue();
    }

}
