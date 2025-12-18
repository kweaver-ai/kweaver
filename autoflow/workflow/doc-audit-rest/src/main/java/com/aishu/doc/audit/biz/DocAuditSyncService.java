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
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;

/**
 * @description 同步共享审核-流程执行类
 * @author ouandyang
 */
@Slf4j
@Service(value = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX + DocConstants.BIZ_TYPE_SYNC)
public class DocAuditSyncService implements DocAuditBizService {

	@Autowired
	NsqSenderService nsqSenderService;
	@Autowired
    DocAuditAfterService docAuditAfterService;

	@Override
	public void submitProcessBefore(ProcessInputModel processInputModel, DocAuditApplyModel docAuditApplyModel) {
		JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
		processInputModel.setWf_uniteCategory(WorkflowConstants.WORKFLOW_TYPE_FLOW);
		Map<String, Object> fields = processInputModel.getFields();
		fields.put("mode", detail.get("mode"));
		fields.put("targetPath", detail.get("targetPath"));
	}

	@Override
	public void submitProcessAfter(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		// TODO Auto-generated method stub
	}

	@Override
	public void sendAuditNotify(String bizId, String auditResult, String auditType, String applyType) {
		nsqSenderService.sendAuditNotify(NsqConstants.CORE_AUDIT_SYNC_NOTIFY, bizId, auditResult, new ArrayList<>());
	}

	@Override
	public void submitErrorHandle(DocAuditApplyModel docAuditApplyModel, ProcessInputModel model,
			ProcessInstanceModel processInstanceModel, WorkFlowException we) {
		if (we.getExceptionErrorCode().isNotAuditorErr()) {
			if (StrUtil.isEmpty(model.getWf_curActInstId())) {
				docAuditAfterService.saveStartAutoAuditBizData(docAuditApplyModel, AuditStatusEnum.REJECT.getValue(),
						WorkflowConstants.AUDIT_RESULT_REJECT, false);
			}
        }
	}

}
