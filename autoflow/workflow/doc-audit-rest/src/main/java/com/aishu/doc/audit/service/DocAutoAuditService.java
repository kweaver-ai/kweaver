package com.aishu.doc.audit.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.common.DocAuditAfterService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.service.FreeAuditConfigService;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 自动审核处理类
 * @author lw
 */
@Slf4j
@Service
public class DocAutoAuditService {
    @Autowired
    FreeAuditConfigService freeAuditConfigService;
    @Autowired
    DocAuditAfterService docAuditAfterService;

    /**
     * 自动审核逻辑
     * 
     * @description
     * @author ouandyang
     * @param docAuditApplyModel
     * @updateTime 2021/5/13
     */
    public boolean executeAutoAudit(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());

        // 新增逻辑：检查 auto_approval 字段--知识中心
        Object autoApprovalObj = detail.get("autoApproval");
        if (autoApprovalObj != null && (Boolean) autoApprovalObj) {
            // 执行自动审批逻辑
            docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.PASS.getValue(),
                    WorkflowConstants.AUDIT_RESULT_PASS, false);
            return true; // 自动审批执行成功
        }

        // 取消共享，执行自动审核逻辑
        if (DocConstants.OP_TYPE_DELETE.equals(detail.get("opType"))) {
            docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.AVOID.getValue(),
                    WorkflowConstants.AUDIT_RESULT_PASS, false);
            return true;
        }
        // 免审核密级+免审核部门，执行自动审核逻辑
        boolean flag = false;
        if (!DocConstants.SHARED_LINK_PERM.equals(docAuditApplyModel.getApplyType()) &&
                !DocConstants.CHANGE_OWNER.equals(docAuditApplyModel.getApplyType())) {
            return flag;
        }
        if (detail.get("accessorId") != null && detail.get("accessorType") != null) {
            flag = freeAuditConfigService.verdictDeptFreeAudit(docAuditApplyModel.getCsfLevel(),
                    docAuditApplyModel.getApplyUserId(),
                    detail.get("accessorId").toString(), detail.get("accessorType").toString());
        }
        if (flag) {
            docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.AVOID.getValue(),
                    WorkflowConstants.AUDIT_RESULT_PASS, false);
        }
        return flag;
    }
}
