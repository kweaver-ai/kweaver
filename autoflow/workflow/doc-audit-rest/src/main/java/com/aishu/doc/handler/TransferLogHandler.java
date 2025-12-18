package com.aishu.doc.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.doc.handler.biz.DocAuditLogService;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;

import cn.hutool.json.JSONUtil;

/**
 * @description 文档审核转审记录日志
 * @author siyu.chen
 */
@Component(value = OperationLogConstants.Transfer_LOG)
public class TransferLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    protected AnyShareConfig anyShareConfig;

    @Override
    protected OperationLogDTO buildLogMsg(Object[] args) {
        DocAuditHistoryModel docAuditHistoryModel = (DocAuditHistoryModel) args[0];
        String serviceSuffix = "";
        if(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") == null){
            serviceSuffix = docAuditHistoryModel.getBizType();
        }
        DocAuditLogService docAuditBizService = ApplicationContextHolder.getBean(DocConstants.DOC_AUDIT_LOG_PRFIX + serviceSuffix, DocAuditLogService.class);
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(docAuditBizService.buildTransferLogMsg((String) args[3], docAuditHistoryModel.getBizType(), (String) args[4]));
        log.setExMsg(docAuditBizService.buildTransferLogExMsg(docAuditHistoryModel));
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
