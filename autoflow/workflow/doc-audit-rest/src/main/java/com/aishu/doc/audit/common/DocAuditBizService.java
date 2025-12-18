package com.aishu.doc.audit.common;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * @description 文档审核流程执行类
 * @author lw
 */
public interface DocAuditBizService {

	/**
	 * @description 提交流程前置事件，用于对ProcessInputModel或DocAuditApplyModel进行修改补充，影响流程提交和业务数据保存
	 * @author ouandyang
	 * @param processInputModel  流程输入参数
	 * @param docAuditApplyModel 文档审核申请数据
	 * @updateTime 2021/8/16
	 */
	void submitProcessBefore(ProcessInputModel processInputModel,DocAuditApplyModel docAuditApplyModel);

	/**
	 * @description 提交流程后置事件，基于ProcessInputModel或DocAuditApplyModel进行业务后置处理，如发送消息或通知，注：流程已默认发送了审核消息和邮件
	 * @author ouandyang
	 * @param processInstanceModel 流程实例数据
	 * @param docAuditApplyModel   文档审核申请数据
	 * @updateTime 2021/8/16
	 */
	void submitProcessAfter(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel);

	/**
	 * @description 发送审核结果通知
	 * @author ouandyang
	 * @param  bizId
	 * @param  auditResult
	 * @updateTime 2021/9/1
	 */
	void sendAuditNotify(String bizId, String auditResult, String auditType, String applyType);

	/**
	 * @description 提交流程异常处理
	 * @author ouandyang
	 * @param  docAuditApplyModel 文档审核申请数据
	 * @param  model 流程输入数据
	 * @param  processInstanceModel 流程实例数据
	 * @param  we 异常
	 * @updateTime 2022/3/2
	 */
	void submitErrorHandle(DocAuditApplyModel docAuditApplyModel, ProcessInputModel model,
			ProcessInstanceModel processInstanceModel, WorkFlowException we);
}
