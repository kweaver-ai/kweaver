package com.aishu.doc.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.handler.biz.DocAuditLogService;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.common.util.OperationLogConstants;
import cn.hutool.json.JSONUtil;

/**
 * @description 文档审核退回记录日志
 * @author siyu.chen
 */
@Component(value = OperationLogConstants.SENDBACK_LOG)
public class SendBackLogHandler extends AbstractLogHandler implements LogHandler {

    @Override
    protected OperationLogDTO buildLogMsg(Object[] args) {
        DocAuditHistoryModel docAuditHistoryModel = (DocAuditHistoryModel) args[0];
        String serviceSuffix = "";
        if(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") == null){
            serviceSuffix = docAuditHistoryModel.getBizType();
        }
        DocAuditLogService docAuditBizService = ApplicationContextHolder.getBean(DocConstants.DOC_AUDIT_LOG_PRFIX + serviceSuffix, DocAuditLogService.class);
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(docAuditBizService.buildSendBackLogMsg(docAuditHistoryModel, (String)args[2]));
        log.setExMsg(docAuditBizService.buildSendBackExMsg(docAuditHistoryModel));
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
