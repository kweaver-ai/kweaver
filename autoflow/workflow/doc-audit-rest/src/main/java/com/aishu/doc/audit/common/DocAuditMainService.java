package com.aishu.doc.audit.common;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.aishu.wf.core.common.util.WorkflowConstants;

import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAutoAuditService;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.service.ThirdAuditService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.UserService;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 文档审核框架类，所有文档审核入口（发起/审核）
 * @author lw
 */
@Slf4j
@Service
public class DocAuditMainService {
	private final static String APPLY_LOCK_PREFIX = "BIZ_ID_LOCK_";
	private final static String AUDIT_TJSH_LOCK_PREFIX = "AUDIT_TJSH_LOCK_PREFIX";

	@Autowired
	UserService userService;
	@Autowired
	DocAutoAuditService docAutoAuditService;
	@Autowired
	DocAuditApplyService docAuditApplyService;
	@Autowired
	ThirdAuditService thirdAuditService;
	@Autowired
	DocAuditAfterService docAuditAfterService;
	@Autowired
	DocAuditBeforeService docAuditBeforeService;
	@Autowired
	DocAuditSubmitService docAuditSubmitService;
	@Autowired
	RedisLockUtil redisLockUtil;
    @Autowired
    ProcessInstanceService processInstanceService;

	/**
	 * @description nsq流程消息统一处理入口
	 * @author ouandyang
	 * @param docAuditApplyModel 文档审核申请数据
	 * @updateTime 2021/5/13
	 */
	public void startDocAudit(DocAuditApplyModel docAuditApplyModel) {
		// 已经存在的申请则不处理
		if (docAuditBeforeService.checkApplyExist(docAuditApplyModel.getBizId())) {
			return;
		}
		
		// 基于业务ID增加分布式锁，解决同一时间的重复申请
		boolean lockFlag = redisLockUtil.lock(APPLY_LOCK_PREFIX + docAuditApplyModel.getBizId(), docAuditApplyModel.getBizId(), 60);
		if (!lockFlag) {
			log.debug("同一时间出现同一业务ID的申请，不做处理，biz_id:" + docAuditApplyModel.getBizId());
			return ;
		}
		// 作废之前流程
		if (StrUtil.isNotBlank(docAuditApplyModel.getConflictApplyId())) {
			try {
				docAuditSubmitService.cancelConflictByBizId(docAuditApplyModel.getConflictApplyId(),
						docAuditApplyModel.getApplyUserId(), AuditStatusEnum.CANCEL.getValue(), DocConstants.CONFLICT_APPLY, false);
			} catch (RestException e) {
				log.debug("Cancel process error", e);
			} catch (Exception e) {
				log.warn("Cancel process error, docAuditApplyModel:{}", docAuditApplyModel, e);
			}
		}
		/*
		 * // 如果开启第三方审核，文档流转审核、共享审核、定密审核都将通知至第三方 if (thirdAuditService.thirdAudit()) {
		 * return; }
		 */
		// 自动审核逻辑
		if (!docAutoAuditService.executeAutoAudit(docAuditApplyModel)) {
			submitDocAudit(docAuditApplyModel, docAuditApplyModel.getApplyUserId(), null);
		}
		redisLockUtil.unlock(APPLY_LOCK_PREFIX + docAuditApplyModel.getBizId(), docAuditApplyModel.getBizId());
	}

	/**
	 * @description 提交文档审核流程
	 * @author lw
	 * @param docAuditApplyModel 文档审核申请数据
	 * @param userId             用户ID
	 */
	public void submitDocAudit(DocAuditApplyModel docAuditApplyModel, String userId, String token) {
		// 如果是同级审核，添加分布式锁保证并发情况只有一个审核员处理
		Boolean isTJSH = docAuditApplyModel.getAuditType() == null? false : docAuditApplyModel.getAuditType().equals(WorkflowConstants.AUDIT_MODEL.TJSH.getValue());
		if (isTJSH){
			boolean lockFlag = redisLockUtil.lock(AUDIT_TJSH_LOCK_PREFIX + docAuditApplyModel.getBizId(), docAuditApplyModel.getBizId(), 3);
			if (!lockFlag) {
				log.warn("已存在审核员审核此环节, biz_id: {}", docAuditApplyModel.getBizId());
				throw new RestException(BizExceptionCodeEnum.A401001101.getCode(), BizExceptionCodeEnum.A401001101.getMessage());
			}
		}
		try{
			// 提交流程前-框架处理
			ProcessInputModel processInputModel = docAuditBeforeService.before(docAuditApplyModel, userId, token);

			String serviceSuffix = "";
			if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
				serviceSuffix = docAuditApplyModel.getBizType();
			}
			DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
					DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX + serviceSuffix, DocAuditBizService.class);
			// 提交流程前-业务处理
			try {
				docAuditBizService.submitProcessBefore(processInputModel, docAuditApplyModel);
			} catch (Exception e) {
				log.warn("submitProcessBefore error,processInputModel:" + processInputModel, e);
			}
			// 提交流程
			ProcessInstanceModel processInstanceModel = docAuditSubmitService.submit(docAuditApplyModel, processInputModel);
			// 提交流程后-框架处理
			docAuditAfterService.after(processInstanceModel, docAuditApplyModel);
			// 提交流程后-业务处理
			try {
				docAuditBizService.submitProcessAfter(processInstanceModel, docAuditApplyModel);
			} catch (Exception e) {
				log.warn("submitProcessAfter error,processInstanceModel:" + processInstanceModel, e);
			}
		} finally {
			if (isTJSH){
				redisLockUtil.unlock(AUDIT_TJSH_LOCK_PREFIX + docAuditApplyModel.getBizId(), docAuditApplyModel.getBizId());
			}
		}
	}

	/**
	 * @description 回退审核
	 * @author siyu.chen
	 * @param docAuditApplyModel 文档审核申请数据
	 * @param userId             用户ID
	 */
	public void sendBack(DocAuditApplyModel docAuditApplyModel, String userId, String token) {
        Task task = null;
        try {
            task = processInstanceService.getProcessTask(docAuditApplyModel.getProcInstId(), userId);
        } catch (Exception e) {
            log.warn("通过申请ID执行审核退回，当前待办任务未找到，procInstId：{}，userId：{}", docAuditApplyModel.getProcInstId(), userId);
        }
        if (task == null) {
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        
        String customDescriptionJsonStr = task.getDescription();
        if(StrUtil.isEmpty(customDescriptionJsonStr)){
            throw new RestException(BizExceptionCodeEnum.A50001106.getCode(), BizExceptionCodeEnum.A50001106.getMessage());
        }
        JSONObject customDescriptionJson = JSONUtil.parseObj(customDescriptionJsonStr);
        String sendBackSwitch = customDescriptionJson.getStr("sendBackSwitch");
        if(!"Y".equals(sendBackSwitch)){
            throw new RestException(BizExceptionCodeEnum.A50001106.getCode(),BizExceptionCodeEnum.A403057015.getMessage());
        }
		this.submitDocAudit(docAuditApplyModel, userId, token);
    }
}