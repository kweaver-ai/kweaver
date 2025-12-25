package com.aishu.doc.handler;

import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.handler.biz.DocAuditLogService;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.stereotype.Component;

import java.net.Inet4Address;
import java.net.UnknownHostException;

/**
 * @description 文档审核记录日志
 * @author ouandyang
 */
@Component(value = OperationLogConstants.DOC_AUDIT_UPDATE_LOG)
public class DocAuditPendingLogHandler extends AbstractLogHandler implements LogHandler {

    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        DocAuditApplyModel docAuditApplyModel = (DocAuditApplyModel) args[0];
        String serviceSuffix = "";
        if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
            serviceSuffix = docAuditApplyModel.getBizType();
        }
        DocAuditLogService docAuditBizService = ApplicationContextHolder.getBean(
                DocConstants.DOC_AUDIT_LOG_PRFIX + serviceSuffix,
                DocAuditLogService.class);
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(docAuditBizService.buildAuditLogMsg(docAuditApplyModel, (String)args[2]));
        log.setExMsg(docAuditBizService.buildAuditLogExMsg(docAuditApplyModel));
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
