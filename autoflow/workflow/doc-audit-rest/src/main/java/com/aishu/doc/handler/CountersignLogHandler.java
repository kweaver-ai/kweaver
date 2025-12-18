package com.aishu.doc.handler;

import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.handler.biz.DocAuditLogService;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import org.springframework.stereotype.Component;

/**
 * @description 审核加签日志
 */
@Component(value = OperationLogConstants.COUNTERSIGN_LOG)
public class CountersignLogHandler extends AbstractLogHandler implements LogHandler {

    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        DocAuditHistoryModel docAuditHistoryModel = (DocAuditHistoryModel) args[0];
        String serviceSuffix = "";
        if(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") == null){
            serviceSuffix = docAuditHistoryModel.getBizType();
        }
        DocAuditLogService docAuditBizService = ApplicationContextHolder.getBean(
                DocConstants.DOC_AUDIT_LOG_PRFIX + serviceSuffix,
                DocAuditLogService.class);
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(docAuditBizService.buildCountersignLogMsg((String) args[3], (String) args[4]));
        log.setExMsg(docAuditBizService.buildCountersignLogExMsg(docAuditHistoryModel));
        log.setLogType(ncTLogType.NCT_LT_OPEARTION);
        log.setOpType(ncTDocOperType.NCT_DOT_AUDIT_MGM.getValue());
        if (args[1] != null) {
            log.setIp((String) args[1]);
        }
        if (args[2] != null) {
            log.setUserId((String) args[2]);
        }
        return log;
    }
}
