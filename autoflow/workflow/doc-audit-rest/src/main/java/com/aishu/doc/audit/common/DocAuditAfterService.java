package com.aishu.doc.audit.common;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.InternalGroupModel;
import com.aishu.doc.audit.model.dto.DocAuditorDTO;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditDetailService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.DocAuditSenBackMessageService;
import com.aishu.doc.audit.service.InternalGroupService;
import com.aishu.doc.audit.vo.Countersign;
import com.aishu.doc.audit.vo.Transfer;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.doc.msg.service.DocAuditMsgNotice;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.DocShareApi;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.UserProfile;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.doc.service.TransferInfoService;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.dto.PermConfigDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.aishu.wf.core.engine.core.service.ProcessExecuteService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.core.service.WorkFlowClinetService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import lombok.extern.slf4j.Slf4j;

import org.activiti.engine.TaskService;
import org.activiti.engine.task.Attachment;
import org.activiti.engine.task.Task;
import org.apache.commons.collections4.map.HashedMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import java.net.Inet4Address;
import java.net.UnknownHostException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @description 文档审核-业务操作类
 * @author ouandyang
 */
@Slf4j
@Service
public class DocAuditAfterService extends DocAuditCommonService {
	@Autowired
	UserService userService;
	@Autowired
	WorkFlowClinetService workFlowClinetService;
	@Autowired
	NsqSenderService nsqSenderService;
	@Autowired
	DocAuditApplyService docAuditApplyService;
	@Autowired
	DocAuditHistoryService docAuditHistoryService;
	@Autowired
	DictService dictService;
	@Autowired
	DocAuditMsgNotice docAuditMsgNotice;
	@Autowired
	DocAuditAfterService docAuditAfterService;
	@Autowired
	private ProcessExecuteService processExecuteService;
	@Autowired
	DocAuditDetailService docAuditDetailServic;
    @Autowired
    private DocShareStrategyService docShareStrategyService;
	@Autowired
	AnyShareConfig anyShareConfig;
	private UserManagementOperation userManagementOperation;
	private DocShareApi docShareApi;
    @Autowired
    InternalGroupService internalGroupService;
	@Autowired
    private ThreadPoolTaskExecutor executor;
	@Autowired
    TaskService taskService;
    @Autowired
    ProcessInstanceService processInstanceService;
    @Autowired
    CountersignInfoService countersignInfoService;
    @Autowired
    TransferInfoService transferInfoService;
	@Autowired
	DocAuditSubmitService docAuditSubmitService;
	@Autowired
	DocAuditSenBackMessageService docAuditSenBackMessageService;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
        docShareApi = anyShareClient.getDocSharePrivateApi();
    }

	/**
	 * @description 提交流程后置事件
	 * @author ouandyang
	 * @param processInstanceModel 流程实例数据
	 * @param docAuditApplyModel   文档审核申请数据
	 * @updateTime 2021/8/16
	 */
	public void after(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		// 1、未匹配到审核员，processInstanceModel为null，已做异常处理
		// 2、开始环节自动拒绝，已做异常处理
		if (processInstanceModel == null ||
				(StrUtil.isBlank(processInstanceModel.getProcessInputModel().getWf_curActInstId()) && processInstanceModel.isAutoReject())) {
				processInstanceModel.getProcessInputModel().getFields().put("bizId", docAuditApplyModel.getBizId());
				processInstanceModel.getProcessInputModel().getFields().put("startNoAuditor", true);
				// 发送NSQ-记录操作日志、发送邮件、发送消息通知
				nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MSG, JSONUtil.toJsonStr(processInstanceModel));
			return ;
		}
		// 保存业务数据
		this.saveBizData(processInstanceModel, docAuditApplyModel);
		// 配置审核回退信息
		this.setSendBackAuditor(processInstanceModel, docAuditApplyModel);
		// 发送后置消息
		this.sendAfterMessage(processInstanceModel, docAuditApplyModel);
		// 配置附件权限
		this.setAttachmentPerm(processInstanceModel, docAuditApplyModel);
	}

	/**
	 * @description 发送NSQ-记录操作日志、发送邮件、发送消息通知
	 * @author ouandyang
	 * @param processInstanceModel
	 * @updateTime 2021/9/1
	 */
	private void sendAfterMessage(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		HttpServletRequest request = RequestUtils.getRequest();
		if (RequestUtils.getRequest() != null) {
			processInstanceModel.getProcessInputModel().getFields().put("ip", RequestUtils.getIpAddress(request));
			processInstanceModel.getProcessInputModel().getFields().put("userId", RequestUtils.getUserId());
		}
		processInstanceModel.getProcessInputModel().getFields().put("bizId", docAuditApplyModel.getBizId());
		// 邮件需要获取高级配置需要procDefId
		processInstanceModel.getProcessInputModel().getFields().put("procDefId", docAuditApplyModel.getProcDefId());
		// 流程结束时设置当前流程所有审核员的附件信息或当前环节的附件信息
		setAllAttachments(processInstanceModel, docAuditApplyModel);
		processInstanceModel.getProcessInputModel().getFields().put("docNames", docAuditApplyModel.getDocNames());
		docAuditMsgNotice.updateTodoMessageAsync(processInstanceModel);
		// 发送NSQ-记录操作日志、发送邮件、发送消息通知
		nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MSG, JSONUtil.toJsonStr(processInstanceModel));
	}

	/**
	 * @description 保存业务数据
	 * @author ouandyang
	 * @param processInstanceModel 流程输入参数
	 * @param docAuditApplyModel   文档审核申请实体
	 * @updateTime 2021/5/21
	 */
	private void saveBizData(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		String auditor = workFlowClinetService.getAuditors(processInstanceModel);
		docAuditApplyModel.setAuditor(auditor);
		// 获取审核模式
		if (CollUtil.isNotEmpty(processInstanceModel.getNextActivity())) {
			ActivityInstanceModel activityInstanceModel = processInstanceModel.getNextActivity().get(0);
			docAuditApplyModel.setAuditType(activityInstanceModel.getActDefType());
		}
		docAuditApplyModel.setProcInstId(processInstanceModel.getProcInstId());
		if (processInstanceModel.isFinish() || processInstanceModel.isAutoReject()) {
			DocAuditHistoryModel history = new DocAuditHistoryModel();
			BeanUtil.copyProperties(docAuditApplyModel, history);
			// 查询审核结果
			Object auditResult = workFlowClinetService.getProcessInstanceVariables(processInstanceModel.getProcInstId(),
					WorkflowConstants.WORKFLOW_AUDIT_RESULT);
			if ((boolean) auditResult) {
				history.setAuditStatus(AuditStatusEnum.PASS.getValue());
				history.setAuditResult(AuditStatusEnum.PASS.getCode());
				// 自动通过-发送邮件的审核结果
				processInstanceModel.getProcessInputModel().getFields().put("auditIdea", "true");
			} else if (!(boolean) auditResult && docAuditApplyModel.getSendBack() != null
					&& docAuditApplyModel.getSendBack() && !docAuditApplyModel.getIsAudit()) {
				history.setAuditStatus(AuditStatusEnum.SENDBACK.getValue());
				history.setAuditResult(AuditStatusEnum.SENDBACK.getCode());
				// 自动通过-发送邮件的审核结果
				processInstanceModel.getProcessInputModel().getFields().put("auditIdea", "false");
			} else {
				history.setAuditStatus(AuditStatusEnum.REJECT.getValue());
				history.setAuditResult(AuditStatusEnum.REJECT.getCode());
				// 自动通过-发送邮件的审核结果
				processInstanceModel.getProcessInputModel().getFields().put("auditIdea", "false");
			}
			history.setLastUpdateTime(new Date());
			history.setDocNames(docAuditApplyModel.getDocNames());
			docAuditApplyService.removeById(docAuditApplyModel.getId());
			docAuditHistoryService.saveOrUpdate(history);
			docAuditHistoryService.updateHisTaskStatus(history.getAuditStatus(), history.getProcInstId());
			String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
			// 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
			if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
				beanName += docAuditApplyModel.getBizType();
			}
			DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(beanName, DocAuditBizService.class);
			docAuditBizService.sendAuditNotify(history.getBizId(), history.getAuditResult(), history.getBizType(), history.getApplyType());
			processInstanceModel.getProcessInputModel().getFields().put("audit_result", history.getAuditStatus());
			return;
		} else {
			docAuditApplyService.saveOrUpdate(docAuditApplyModel);
			DocAuditHistoryModel history = new DocAuditHistoryModel();
			BeanUtil.copyProperties(docAuditApplyModel, history);
			history.setAuditStatus(AuditStatusEnum.PENDING.getValue());
			history.setLastUpdateTime(new Date());
			docAuditHistoryService.saveOrUpdate(history);
			// 发起流程保存文档明细信息
			if (docAuditApplyModel.getAuditIdea() == null && CollUtil.isNotEmpty(docAuditApplyModel.getDocAuditDetailModels())) {
				docAuditDetailServic.batchSave(docAuditApplyModel.getDocAuditDetailModels(), history.getId());
			}
		}
		// 发送匹配到审核员消息
		String auditData = JSONUtil.toJsonStr(packageAuditData(docAuditApplyModel, processInstanceModel));
		nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_AUDITOR + "." + docAuditApplyModel.getBizType(), auditData);
		if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(docAuditApplyModel.getBizType())) {
			nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_AUDITOR + "." + docAuditApplyModel.getApplyType(), auditData);
		}
	}

	/**
	 * @description 封装NSQ所需参数
	 * @author xiashenghui
	 * @param docAuditApplyModel 申请对象
	 * @updateTime 2022/09/22
	 */
	public Map<String,Object> packageAuditData(DocAuditApplyModel docAuditApplyModel, ProcessInstanceModel processInstanceModel){
		Map<String,Object> map = new HashMap<>();
		map.put("auditors",getAuditorIds(docAuditApplyModel.getAuditor()));
		map.put("apply_id",docAuditApplyModel.getBizId());
		Map<String,Object> advanceConfig = new HashMap<>();
        try{
			ProcessInputModel processInputModel = processInstanceModel.getProcessInputModel();
            DocShareStrategy docShareStrategy = docShareStrategyService.getShareStrategy(processInputModel.getWf_procDefId(), processInputModel.getWf_curActDefId());
            StrategyConfigsDTO strategyConfigs = JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
            advanceConfig.put("edit_perm_switch", strategyConfigs != null && strategyConfigs.getEditPermSwitch() != null? strategyConfigs.getEditPermSwitch() : false);
        }catch (Exception e){
			advanceConfig.put("edit_perm_switch", false);
            log.warn("匹配审核员消息，获取流程配置信息失败", e);
        }
        map.put("advance_config", advanceConfig);
		return map;
	}

	/**
	 * @description 获取当前环节审核员ID数组
	 * @author xiashenghui
	 * @param auditor 审核员对象字符串
	 * @updateTime 2022/09/22
	 */
	public String [] getAuditorIds(String auditor){
		List<String> auditorIds = new ArrayList<>();
		JSONUtil.parseArray(auditor).stream().forEach(key ->{
			auditorIds.add(JSONUtil.parseObj(key).getStr("id"));
		});
		return auditorIds.toArray(new String [0]);
	}

	/**
	 * @description 开始环节自动审核处理
	 * @author ouandyang
	 * @param docAuditApplyModel 文档审核申请数据
	 * @param auditStatus 审核状态
	 * @param sendMsg 是否发送消息
	 * @updateTime 2022/3/1
	 */
	public void saveStartAutoAuditBizData(DocAuditApplyModel docAuditApplyModel,
										  int auditStatus, String auditResult, boolean sendMsg) {
		DocAuditHistoryModel history = new DocAuditHistoryModel();
		BeanUtil.copyProperties(docAuditApplyModel, history);
		history.setAuditType(WorkflowConstants.AUDIT_MODEL.TJSH.getValue());
		history.setAuditStatus(auditStatus);
		history.setAuditResult(auditResult);
		User user = userService.getUserById(history.getApplyUserId());
		history.setApplyUserName(user.getUserName());
		history.setApplyTime(new Date());
		history.setLastUpdateTime(new Date());
		docAuditApplyModel.setApplyUserName(user.getUserName()); // 记录审核日志初始化数据
		docAuditHistoryService.save(history);
		if(null != docAuditApplyModel.getDocAuditDetailModels()){
			docAuditDetailServic.batchSave(docAuditApplyModel.getDocAuditDetailModels(), history.getId());
		}
		// 审核完成后置处理
		auditedNotify(docAuditApplyModel, history, user, sendMsg, true);
	}

	/**
	 * @description 待办自动审核拒绝
	 * @author ouandyang
	 * @param docAuditApplyModel 文档审核申请数据
	 * @param curComment 审核意见
	 * @param sendMsg 是否发送消息
	 * @updateTime 2022/3/2
	 */
	public void savePendingAutoRejectBizData(DocAuditApplyModel docAuditApplyModel, String curComment, boolean sendMsg) {
		// 结束流程
		ProcessInputModel processInputModel = new ProcessInputModel();
		processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_END_PROCESS);
		processInputModel.setWf_procInstId(docAuditApplyModel.getProcInstId());
		processInputModel.setWf_sendUserId(RequestUtils.getUserId());
		processInputModel.setWf_curComment(curComment);
		processInputModel.setWf_commentDisplayArea(docAuditApplyModel.getAuditIdea() ? "同意" : "否决");
		processExecuteService.nextExecute(processInputModel);

		// 更新业务数据
		DocAuditHistoryModel history = new DocAuditHistoryModel();
		BeanUtil.copyProperties(docAuditApplyModel, history);
		history.setAuditStatus(AuditStatusEnum.REJECT.getValue());
		history.setAuditResult(AuditStatusEnum.REJECT.getCode());
		history.setLastUpdateTime(new Date());
		docAuditApplyService.removeById(docAuditApplyModel.getId());
		docAuditHistoryService.saveOrUpdate(history);
		docAuditHistoryService.updateHisTaskStatus(history.getAuditStatus(), history.getProcInstId());

		// 审核完成后置处理
		User user = userService.getUserById(history.getApplyUserId());
		auditedNotify(docAuditApplyModel, history, user, sendMsg, false);
	}

	/**
	 * @description 审核完成后置处理
	 * @author ouandyang
	 * @param docAuditApplyModel docAuditApplyModel
	 * @param history history
	 * @param user 用户信息
	 * @param sendMsg sendMsg
	 * @param recordApplyLog recordApplyLog
	 * @updateTime 2022/3/2
	 */
	private void auditedNotify(DocAuditApplyModel docAuditApplyModel, DocAuditHistoryModel history,
							   User user, boolean sendMsg, boolean recordApplyLog) {
		String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
		// 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
		if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
			beanName += docAuditApplyModel.getBizType();
		}
		DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
				beanName, DocAuditBizService.class);
		docAuditBizService.sendAuditNotify(history.getBizId(), history.getAuditResult(), history.getBizType(), history.getApplyType());

		if (sendMsg) {
			// 初始化流程提交所需参数
			docAuditApplyModel.setAuditIdea(true);
			ProcessInputModel model = initProcessInputModel(docAuditApplyModel, user);
			// 给发起者发送通知消息
			docAuditMsgNotice.sendAutoMsgApplicant(docAuditApplyModel, model);
		}
		if (recordApplyLog) {
			docAuditAfterService.addApplyLog(docAuditApplyModel);
		}
		String ip = "";
		try {
			// 自动审核无法从request中获取用户信息、IP
			ip = Inet4Address.getLocalHost().getHostAddress();
		} catch (UnknownHostException e) {}
		docAuditAfterService.addAuditedLog(history, ip, history.getApplyUserId());
	}

	/**
	 * @description 自动审核保存业务数据
	 * @author hanj
	 * @param docAuditApplyModel docAuditApplyModel
	 * @updateTime 2021/6/17
	 */
	public void saveErrorBizData(DocAuditApplyModel docAuditApplyModel, ExceptionErrorCode errorCode,
								 ProcessInputModel model, ProcessInstanceModel processInstanceModel) {
		DocAuditHistoryModel history = new DocAuditHistoryModel();
		BeanUtil.copyProperties(docAuditApplyModel, history);
		history.setAuditType(WorkflowConstants.AUDIT_MODEL.TJSH.getValue());
		history.setAuditStatus(AuditStatusEnum.FAILED.getValue());
		history.setAuditResult(WorkflowConstants.AUDIT_RESULT_REJECT);
		history.setAuditMsg(errorCode.name());
		User user = userService.getUserById(history.getApplyUserId());
		history.setApplyUserName(user.getUserName());
		history.setApplyTime(new Date());
		history.setLastUpdateTime(new Date());
		docAuditHistoryService.save(history);

		// 发送NSQ拒绝消息
		String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
		// 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
		if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
			beanName += docAuditApplyModel.getBizType();
		}
		DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
				beanName, DocAuditBizService.class);
		docAuditBizService.sendAuditNotify(docAuditApplyModel.getBizId(), DocConstants.AUDIT_STATUS_REJECT, docAuditApplyModel.getBizType(), docAuditApplyModel.getApplyType());
		// 给发起者发送通知消息
		docAuditMsgNotice.sendErrMsgApplicant(errorCode, docAuditApplyModel, model);
	}

	/**
	 * @description 设置附件参数
	 * @author siyu.chen
	 * @param processInstanceModel processInstanceModel
	 * @param docAuditApplyModel docAuditApplyModel
	 * @updateTime 2024/3/24
	 */
	protected void setAllAttachments(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		processInstanceModel.getProcessInputModel().getFields().put("attachments", docAuditApplyModel.getAttachments());
		Boolean isEnd = processInstanceModel.getEndActivityId() != null && processInstanceModel.getEndActivityId().equals("EndEvent_1wqgipp")? true: false;
		if (!isEnd) {
			return;
		}
		List<Attachment> attachments = taskService.getProcessInstanceAttachments(docAuditApplyModel.getProcInstId());
		List<String> docIds = attachments.stream().map(Attachment::getUrl).distinct().collect(Collectors.toList());
		processInstanceModel.getProcessInputModel().getFields().put("allAttachments", docIds);
	}

	/**
	 * @description 创建内部组
	 * @author siyu.chen
	 * @param docAuditApplyModel docAuditApplyModel
	 * @updateTime 2024/3/24
	 */
    public InternalGroupModel createInternalGroup(DocAuditApplyModel docAuditApplyModel) {
		InternalGroupModel  internalGroupModel = null;
        try {
            internalGroupModel = internalGroupService.selectInternalGroupByApplyID(docAuditApplyModel.getBizId());
            if (internalGroupModel != null){
                return internalGroupModel;
            }
            String groupID = userManagementOperation.createInternalGroup();
            // 存储用户组信息
            if (StrUtil.isEmpty(groupID)) {
                throw new Exception("groupID is empty");
            }
            
            internalGroupModel = InternalGroupModel.builder()
                .id(IdUtil.randomUUID())
                .applyID(docAuditApplyModel.getBizId())
                .applyUserID(docAuditApplyModel.getApplyUserId())
                .groupID(groupID)
                .expiredAt(-1)
                .createdAt(CommonUtils.CurrentTimeStamp()).build();
            // 添加记录
            internalGroupService.insertInternalGroup(internalGroupModel);
			return internalGroupModel;
        } catch (Exception e) {
            log.warn("create internal group err, detail:{}", e.getMessage());
			return internalGroupModel;
        }
    }

	/**
	 * @description 审核完成后置处理，设置附件预览、下载权限，用于接口审核通过和nsq发起审核
	 * @author siyu.chen
	 * @param processInstanceModel processInstanceModel
	 * @param docAuditApplyModel docAuditApplyModel
	 * @updateTime 2024/3/20
	 */
	public void setAttachmentPerm(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		Runnable run = () -> {
			try{	
				List<String> attachments = docAuditApplyModel.getAttachments();
				ProcessInputModel processIputModel  = processInstanceModel.getProcessInputModel();
				Boolean isEnd = processInstanceModel.getEndActivityId() != null && processInstanceModel.getEndActivityId().equals("EndEvent_1wqgipp")? true: false;

				// 附件为空并且非流程结束，则跳过
				if (CollUtil.isEmpty(attachments) && !isEnd) {
					return;
				}
				
				InternalGroupModel internalGroupModel = this.createInternalGroup(docAuditApplyModel);
				if (internalGroupModel == null) {
					return;
				}
				String groupID = internalGroupModel.getGroupID();
				if (!CollUtil.isEmpty(attachments)) {
					List<JSONObject> data = new ArrayList<>();
					JSONObject permData = new JSONObject();
					JSONObject accessor = new JSONObject();
					accessor.put("id", groupID);
					accessor.put("type", "internal_group");
					permData.put("accessor", accessor);
					permData.put("allow", new String[] { "preview", "download", "display" });
					data.add(permData);
					for (String attachment : attachments) {
						try {
							// 出错的附件跳过添加权限处理
							docShareApi.setDocPerm(attachment, data);
						} catch (Exception e) {
							log.warn("set doc perm err, detail: {}", e.getMessage());
							continue;
						}
					}
				}
				
				List<String> auditors = docAuditHistoryService.selectAuditorByProInsID(docAuditApplyModel.getProcInstId());
				if (isEnd) {
					DocShareStrategy docShareStrategy =docShareStrategyService.getShareStrategy(processIputModel.getWf_procDefId(), processIputModel.getWf_curActDefId());
					PermConfigDTO permConfig = JSON.parseObject(docShareStrategy.getPermConfig(), PermConfigDTO.class);
					if (permConfig == null) {
						permConfig = new PermConfigDTO();
						permConfig.setStatus("1");
						permConfig.setPerm_switch(true);
						permConfig.setExpired("7");
					}
					// 如果当前流程未开启申请人预览或下载附件开关，则直接跳过
					// 当前流程仅针对审核通过的流程设置申请人权限，审核为其他结果直接跳过
					long expiredAt = CommonUtils.FeatureTimeStamp(Integer.valueOf(permConfig.getExpired()));
					String auditResult = processInstanceModel.getProcessInputModel().getFields().get("audit_result").toString();
					if (permConfig.getPerm_switch() && (permConfig.getStatus().equals("1") && Integer.valueOf(auditResult).equals(3)) ||
						permConfig.getPerm_switch() && (permConfig.getStatus().equals("2"))) {
						if (!auditors.contains(internalGroupModel.getApplyUserID())) {
							auditors.add(internalGroupModel.getApplyUserID());
						}
					}
					internalGroupService.updateInternalGroup(docAuditApplyModel.getBizId(), expiredAt);
					userManagementOperation.updateInternalGroupUser(groupID, auditors);
					return;
				}
				userManagementOperation.updateInternalGroupUser(groupID, auditors);
			} catch (Exception e) {
				log.warn("set auditor attachment perm err, detail: ", e);
			}
		};
		executor.execute(run);
	}

	/**
	 * @description 审核完成后置处理，设置附件预览、下载权限，用于加签和转审
	 * @author siyu.chen
	 * @param processInstanceModel processInstanceModel
	 * @param docAuditApplyModel docAuditApplyModel
	 * @updateTime 2024/3/20
	 */
	public void setAttachmentPerm(DocAuditApplyModel docAuditApplyModel, List<String> auditors) {
		Runnable run = () -> {
			try{	
				InternalGroupModel  internalGroupModel = internalGroupService.selectInternalGroupByApplyID(docAuditApplyModel.getBizId());
				if (internalGroupModel == null) {
					return;
				}
				String groupID = internalGroupModel.getGroupID();
				List<UserProfile> users = userManagementOperation.getInternalGroupUser(groupID);
				List<String> addedAuditors = users.stream().map(UserProfile::getId).collect(Collectors.toList());
				addedAuditors.addAll(auditors);
				addedAuditors = addedAuditors.stream().distinct().collect(Collectors.toList());
				// 更新用户组ID
				userManagementOperation.updateInternalGroupUser(groupID, addedAuditors);
			} catch (Exception e) {
				log.warn("set auditor attachment perm err, detail: {}", e);
			}
		};
		executor.execute(run);
	}

	public void cancleAttachmentPerm(DocAuditApplyModel docAuditApplyModel) {
		Runnable run = () -> {
			try{	
				InternalGroupModel  internalGroupModel = internalGroupService.selectInternalGroupByApplyID(docAuditApplyModel.getBizId());
				if (internalGroupModel == null) {
					return;
				}
				userManagementOperation.deleteInternalGroup(Arrays.asList(internalGroupModel.getGroupID()));
				internalGroupService.deleteInternalGroupByapplyID(docAuditApplyModel.getBizId());
			} catch (Exception e) {
				log.warn("cancle auditor attachment perm err, detail: {}", e.getMessage());
			}
		};
		executor.execute(run);
	}

	public void setSendBackAuditor(ProcessInstanceModel processInstanceModel, DocAuditApplyModel docAuditApplyModel) {
		try{
			ProcessInputModel processIputModel = processInstanceModel.getProcessInputModel();
			List<ActivityInstanceModel> nextActivities = processInstanceModel.getNextActivity();
			if (nextActivities.size() == 0) {
				return;
			}
			Map<String, Object> fileds = processIputModel.getFields();
			String auditType = processIputModel.getWf_nextActDefType();
			String preProcInstId = fileds.get("preProcInstId") == null? "" : fileds.get("preProcInstId").toString();
			String actDefId = processIputModel.getWf_curActDefId();
			if (fileds.get("sendBack") != null && (Boolean) fileds.get("sendBack") && StrUtil.isNotBlank(preProcInstId)) {
				List<CountersignInfo> countersignInfoList = countersignInfoService
					.list(new LambdaQueryWrapper<CountersignInfo>().eq(CountersignInfo::getProcInstId, preProcInstId).eq(CountersignInfo::getTaskDefKey, actDefId));
				this.setPreCounterSignAuditors(docAuditApplyModel, processInstanceModel, countersignInfoList, actDefId, auditType);
				this.setPreTransferAuditors(docAuditApplyModel, countersignInfoList, preProcInstId, actDefId);
				docAuditSenBackMessageService.handleSendBackMessage(preProcInstId, docAuditApplyModel.getApplyUserId(), docAuditApplyModel.getApplyUserId());
			}
		} catch (Exception e) {
			log.warn("set send back auditor err, detail: {}", e);
		}
	}

	private void setPreCounterSignAuditors(DocAuditApplyModel docAuditApplyModel, ProcessInstanceModel processInstanceModel, List<CountersignInfo> countersignInfoList, String actDefId, String auditType) {
		Map<String, List<CountersignInfo>> contersignByMap = countersignInfoList.stream().collect(Collectors.groupingBy(CountersignInfo::getCountersignBy));
		Map<String, Task> taskMap = new HashedMap<>();
		List<Task> tasks = processInstanceService.getProcessTasks(docAuditApplyModel.getProcInstId(), processInstanceModel.getNextActivity().get(0).getActDefId());
		while (tasks.size() > 0) {
			for (Task task : tasks) {
				if (taskMap.containsKey(task.getAssignee())) {
					continue;
				}

				taskMap.put(task.getAssignee(), null);
				if (!contersignByMap.containsKey(task.getAssignee())) {
					continue;
				}
				
				this.counterSign(contersignByMap, task.getAssignee(), task.getId(), auditType, docAuditApplyModel.getBizId());
			}
			tasks = processInstanceService.getProcessTasks(docAuditApplyModel.getProcInstId(), processInstanceModel.getNextActivity().get(0).getActDefId());
			tasks = tasks.stream().filter(item -> !taskMap.containsKey(item.getAssignee())).collect(Collectors.toList());
		}
	}

	private void setPreTransferAuditors(DocAuditApplyModel docAuditApplyModel, List<CountersignInfo> countersignInfoList, String preProcInstId, String actDefId) {
		List<TransferInfo> transfers = transferInfoService
				.list(new LambdaQueryWrapper<TransferInfo>()
						.eq(TransferInfo::getProcInstId, preProcInstId).eq(TransferInfo::getTaskDefKey, actDefId)
						.orderByDesc(TransferInfo::getBatch));
		Map<String, TransferInfo> transfersMap = transfers.stream().collect(Collectors.toMap(TransferInfo::getTransferBy, transfer -> transfer));
		Map<String, List<CountersignInfo>> contersignByMap = countersignInfoList.stream().collect(Collectors.groupingBy(CountersignInfo::getCountersignBy));

		List<Task> processTasks = processInstanceService.getProcessTasks(docAuditApplyModel.getProcInstId(), actDefId);
		List<String> taskAuditors = processTasks.stream().map(Task::getAssignee).collect(Collectors.toList());
		for (String auditor : taskAuditors) {
			if (!transfersMap.containsKey(auditor)) {
				continue;
			}
			String transferBy = auditor;
			while (transfersMap.containsKey(transferBy)) {
				TransferInfo transferInfo = transfersMap.get(transferBy);
				Transfer transfer = Transfer.builder()
				.reason(transferInfo.getReason())
				.auditor(transferInfo.getTransferAuditor()).build();

				docAuditSubmitService.transferByApplyId(docAuditApplyModel.getBizId(), transferBy, transfer, false);
				transferBy = transferInfo.getTransferAuditor();
				// 如果转审后还存在加签信息，则需要添加对应加签审核员
				if (!contersignByMap.containsKey(transferBy)) {
					continue;
				}
				List<DocAuditApplyModel> tasks = docAuditApplyService.selectTaskIDByProcInstID(docAuditApplyModel.getProcInstId());
				for (DocAuditApplyModel task : tasks) {
					if (!task.getAuditor().equals(transferBy)) {
						continue;
					}
					this.counterSign(contersignByMap, transferBy, task.getId(), task.getAuditType(), docAuditApplyModel.getBizId());
				}
			}
		}
	}

	private List<List<CountersignInfo>> groupCounterSignAuditors(Map<String, List<CountersignInfo>> contersignByMap, String auditor) {
		// 先获取分批加签人员列表
		Map<Integer, List<CountersignInfo>> countersignListMap = contersignByMap.get(auditor).stream().collect(Collectors.groupingBy(CountersignInfo::getBatch));
		List<Integer> countersignOrder = countersignListMap.keySet().stream().collect(Collectors.toList());
		List<List<CountersignInfo>> countersignList = new ArrayList<>();
		for (Integer order : countersignOrder) {
			countersignList.add(countersignListMap.get(order).stream().sorted(Comparator.comparing(CountersignInfo::getCreateTime)).collect(Collectors.toList()));
		}

		return countersignList;
	}

	private void counterSign(Map<String, List<CountersignInfo>> contersignByMap, String receiver, String taskID, String auditType, String bizID) {
		List<List<CountersignInfo>> countersignList = this.groupCounterSignAuditors(contersignByMap, receiver);
		for (List<CountersignInfo> item : countersignList) {
			Countersign countersign = Countersign.builder().task_id(taskID).audit_model(auditType).reason(item.get(0).getReason()).build();
			List<String> auditors = new ArrayList<>();
			for (CountersignInfo info : item) {
				auditors.add(info.getCountersignAuditor());
			}
			countersign.setAuditors(auditors);
			docAuditSubmitService.countersignByApplyId(bizID, receiver, countersign, false);
		}
	}
}
