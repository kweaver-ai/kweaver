package com.aishu.doc.handler;

import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
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
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @description 文档审核撤销记录日志
 * @author ouandyang
 */
@Component(value = OperationLogConstants.DOC_AUDIT_UNDONE_LOG)
public class DocAuditUndoneLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    DocAuditHistoryService docAuditHistoryService;

    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>()
                .eq(DocAuditHistoryModel::getBizId, args[0]));
        String serviceSuffix = "";
        if(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") == null){
            serviceSuffix = docAuditHistoryModel.getBizType();
        }
        DocAuditLogService docAuditBizService = ApplicationContextHolder.getBean(
                DocConstants.DOC_AUDIT_LOG_PRFIX + serviceSuffix,
                DocAuditLogService.class);
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(docAuditBizService.buildUndoneLogMsg(docAuditHistoryModel));
        log.setExMsg(docAuditBizService.buildUndoneLogExMsg(docAuditHistoryModel));
        log.setLogType(ncTLogType.NCT_LT_OPEARTION);
        log.setOpType(ncTDocOperType.NCT_DOT_AUDIT_MGM.getValue());
        return log;
    }

}
