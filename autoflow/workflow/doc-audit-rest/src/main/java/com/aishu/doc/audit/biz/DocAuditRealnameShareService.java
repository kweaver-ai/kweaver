package com.aishu.doc.audit.biz;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import com.aishu.doc.audit.common.DocAuditAfterService;
import com.aishu.doc.audit.common.DocAuditBizService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;

/**
 * @description 共享给指定用户的申请-流程执行类
 * @author ouandyang
 */
@Slf4j
@Service(value = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX + DocConstants.BIZ_TYPE_REALNAME_SHARE)
public class DocAuditRealnameShareService implements DocAuditBizService {

    @Autowired
    NsqSenderService nsqSenderService;
    @Autowired
    DocAuditAfterService docAuditAfterService;
    @Autowired
    DictService dictService;

	@Override
	public void submitProcessBefore(ProcessInputModel processInputModel, DocAuditApplyModel docAuditApplyModel) {
		JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        processInputModel.setWf_uniteCategory(WorkflowConstants.WORKFLOW_TYPE_SHARE);
        Map<String, Object> fields = processInputModel.getFields();
        fields.put("docLibType", detail.get("docLibType"));
        fields.put("deadline", detail.get("expiresAt"));

        fields.put("opType", detail.get("opType"));
        fields.put("readPolicy", detail.get("readPolicy"));

        fields.put("inherit", detail.get("inherit"));
        fields.put("allowed", detail.get("allowValue"));
        fields.put("denied", detail.get("denyValue"));
        fields.put("accessorId", detail.get("accessorId"));
        fields.put("accessorName", detail.get("accessorName"));
        fields.put("accessorType", detail.get("accessorType"));
        fields.put("readPolicy", detail.get("readPolicy"));

        // 涉密模式状态
        Dict secretDict = dictService.findDictByCode(SecretDTO.DICT_SECRET_SWITCH);
        fields.put("secretSwitch", null != secretDict && "y".equals(secretDict.getDictName()) ? "y" : "n");
	}

	@Override
	public void submitProcessAfter(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		// TODO Auto-generated method stub
	}

    @Override
	public void sendAuditNotify(String bizId, String auditResult, String auditType, String applyType) {
        nsqSenderService.sendAuditNotify(NsqConstants.CORE_AUDIT_SHARE_REALNAME_NOTIFY, bizId,
                DocConstants.AUDIT_STATUS_PASS.equals(auditResult));
        if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(auditType)) {
            nsqSenderService.sendAuditNotify(NsqConstants.WORKFLOW_AUDIT_RESULT + "." + applyType, bizId, auditResult, new ArrayList<>());
        }
    }

	@Override
	public void submitErrorHandle(DocAuditApplyModel docAuditApplyModel, ProcessInputModel model,
			ProcessInstanceModel processInstanceModel, WorkFlowException we) {
		if (StrUtil.isNotEmpty(model.getWf_curActInstId()) || !we.getExceptionErrorCode().isNotAuditorErr()) {
			throw we;
		}

		// 判断自动审核开关打开时,自动审核内部仅发审核通过，不发通知消息
		Dict switchDict = dictService.findDictByCode(WorkFlowContants.RENAME_AUTO_AUDIT_SWITCH);
        if(switchDict != null && "y".equals(switchDict.getDictName())){
        	docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.AVOID.getValue(),
        			WorkflowConstants.AUDIT_RESULT_PASS, false);
        } else {
        	docAuditAfterService.saveErrorBizData(docAuditApplyModel, we.getExceptionErrorCode(),
        			model, processInstanceModel);
        }
	}


}
