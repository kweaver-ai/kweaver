package com.aishu.doc.audit.rest;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.common.DocAuditMainService;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditDetailService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.vo.*;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.ProcessMessageOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.TaskAuthCheckDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.google.common.collect.Maps;
import io.swagger.annotations.*;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * @description 文档审核
 * @author ouandyang
 */
@Slf4j
@Validated
@RestController
@Api(tags = "文档审核")
@RequestMapping("/doc-audit")
public class DocAuditRest extends BaseRest {
	@Autowired
	DocAuditApplyService docAuditApplyService;
	@Autowired
	DocAuditHistoryService docAuditHistoryService;
	@Autowired
	ProcessInstanceService processInstanceService;
	@Autowired
	NsqSenderService nsqSenderService;
	@Autowired
	DocAuditMainService docAuditMainService;
	@Autowired
	DocAuditSubmitService docAuditSubmitService;
	@Autowired
	DocAuditDetailService docAuditDetailService;
	@Autowired
	DictService dictService;
	@Autowired
	AuditConfig auditConfig;
	@Autowired
	DocShareStrategyService docShareStrategyService;

	private ProcessMessageOperation processMessageOperation;

	private ProcessMessageOperation getProcessMessageOperation() {
		if (processMessageOperation != null) {
			return processMessageOperation;
		}
		AnyShareConfig anyshareConfig = (AnyShareConfig) ApplicationContextHolder.getBean("anyShareConfig");
		AnyShareClient client = new AnyShareClient(anyshareConfig);
		processMessageOperation = client.getProcessMessageOperation();
		return processMessageOperation;
	}

	/**
	 * @description 获取文档审核详情
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取文档审核详情")
	@ApiImplicitParam(name = "id", value = "申请ID")
	@GetMapping(value = "/{id}", produces = "application/json; charset=UTF-8")
	public Object info(@PathVariable String id) {
		List<String> ids = Arrays.asList(id.split(","));
		if (ids.size() > 1) {
			return docAuditHistoryService.listDocAuditDetail(ids, this.getUserId());
		} else {
			return docAuditHistoryService.getDocAuditDetail(ids.get(0), this.getUserId());
		}
	}

	/**
	 * @description 提交文档审核流程
	 * @author ouandyang
	 * @param docAuditParam 文档审核参数
	 * @updateTime 2021/5/13
	 */
	@ApiOperation(value = "提交文档审核")
	@ApiImplicitParam(name = "docAuditParam", value = "文档审核参数")
	@PutMapping(value = "")
	public void audit(@Valid @RequestBody DocAuditParam docAuditParam, HttpServletRequest request) {
		DocAuditApplyModel docAuditApplyModel = docAuditApplyService.getById(docAuditParam.getId());
		if (docAuditApplyModel == null) {
			throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
					BizExceptionCodeEnum.A401001101.getMessage());
		}
		docAuditParam.buildDocAuditApplyModel(docAuditApplyModel);
		/*
		 * BaseDocAuditService service = ApplicationContextHolder .getBean("doc_audit_"
		 * + docAuditApplyModel.getBizId(), BaseDocAuditService.class);
		 * service.submitDocAudit(docAuditApplyModel, this.getUserId());
		 */
		docAuditMainService.submitDocAudit(docAuditApplyModel, this.getUserId(), this.getToken(request));
	}

	/**
	 * @description 退回审核
	 * @author siyu.chen
	 * @param docAuditParam 文档审核参数
	 * @updateTime 2024/7/8
	 */
	@ApiOperation(value = "退回审核")
	@ApiImplicitParam(name = "docAuditParam", value = "文档审核参数")
	@PutMapping(value = "/sendback")
	public void sendback(@Valid @RequestBody SendBackParam sendBackParam, HttpServletRequest request) {
		DocAuditApplyModel docAuditApplyModel = docAuditApplyService.getById(sendBackParam.getId());
		if (docAuditApplyModel == null) {
			throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
					BizExceptionCodeEnum.A401001101.getMessage());
		}
		sendBackParam.buildDocAuditApplyModel(docAuditApplyModel);
		docAuditMainService.sendBack(docAuditApplyModel, this.getUserId(), this.getToken(request));
	}

	/**
	 * @description 获取文档审核详情
	 * @author xiashenghui
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取文档审核详情")
	@ApiImplicitParam(name = "bizId", value = "业务关联ID")
	@GetMapping(value = "/biz/{bizId}", produces = "application/json; charset=UTF-8")
	public DocAuditVO details(@PathVariable String bizId) {
		DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByBizId(bizId);
		if (docAuditHistoryModel == null) {
			throw new IllegalArgumentException("该审核详情不存在，本次操作无法生效。");
		}
		String customDescriptionJsonStr = null;
		if (StrUtil.isNotBlank(docAuditHistoryModel.getProcInstId())) {
			try {
				Task task = processInstanceService.getProcessTask(docAuditHistoryModel.getProcInstId(),
						this.getUserId());
				docAuditHistoryModel.setTaskId(task.getId());
				customDescriptionJsonStr = task.getDescription();
			} catch (WorkFlowException e) {
			}
		}
		DocShareStrategy docShareStrategy = docShareStrategyService
				.getDocShareStrategy(docAuditHistoryModel.getProcDefId());
		// 获取对于申请类型前端详情插件信息
		String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType());
		return DocAuditVO.builder(docAuditHistoryModel, frontPluginJsonStr, customDescriptionJsonStr, docShareStrategy);
	}
	/**
	 * @description 获取流程日志
	 * @author hanj
	 * @param applyId 业务关联ID
	 * @updateTime 2021/5/13
	 */
	// @ApiOperation(value = "获取流程日志")
	// @ApiImplicitParams({ @ApiImplicitParam(name = "id", value = "流程实例ID"), })
	// @GetMapping(value = "{applyId}/logs", produces = "application/json;
	// charset=UTF-8")
	// public List<ProcessTraceLogVO> getProcTextLogs(@PathVariable String applyId)
	// {
	// //获取流程实例ID
	// DocAuditHistoryModel History = docAuditHistoryService.getById(applyId);
	// ProcessInstanceLog processInstanceLog =
	// processInstanceService.getProcLogs(History.getProcInstId(), "text");
	// return ProcessTraceLogVO.builderProcessTraceLogVO(processInstanceLog);
	// }

	/**
	 * @description 发起共享给指定用户的申请
	 * @author ouandyang
	 * @param docRealnameShareApply 文件共享实体
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@ApiOperation(value = "发起共享给指定用户的申请")
	@ApiImplicitParam(name = "docRealnameShareApply", value = "文件共享实体")
	@PostMapping(value = "/realname")
	public void save(@Valid @RequestBody DocRealnameShareApply docRealnameShareApply) {
		docRealnameShareApply.setUser_id(getUserId());
		nsqSenderService.sendMessage(NsqConstants.CORE_AUDIT_SHARE_REALNAME_APPLY,
				JSONUtil.toJsonStr(docRealnameShareApply));
	}

	/**
	 * @description 发起共享给任意用户的申请
	 * @author ouandyang
	 * @param docAnonymousShareApply 文件共享实体
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@ApiOperation(value = "发起共享给任意用户的申请")
	@ApiImplicitParam(name = "docAnonymousShareApply", value = "文件共享实体")
	@PostMapping(value = "/anonymous")
	public void save(@Valid @RequestBody DocAnonymousShareApply docAnonymousShareApply) {
		docAnonymousShareApply.setUser_id(getUserId());
		nsqSenderService.sendMessage(NsqConstants.CORE_AUDIT_SHARE_ANONYMOUS_APPLY,
				JSONUtil.toJsonStr(docAnonymousShareApply));
	}

	/**
	 * @description 发起文档同步流程
	 * @author ouandyang
	 * @param docSyncApply 文件同步实体
	 * @updateTime 2021/8/23
	 */
	@Hidden
	@ApiOperation(value = "发起文档同步流程")
	@ApiImplicitParam(name = "docSyncApply", value = "文件同步实体")
	@PostMapping(value = "/sync")
	public void save(@Valid @RequestBody DocSyncApply docSyncApply) {
		docSyncApply.setUser_id(getUserId());
		nsqSenderService.sendMessage(NsqConstants.CORE_AUDIT_SYNC_APPLY, JSONUtil.toJsonStr(docSyncApply));
	}

	/**
	 * @description 发起文档流转流程
	 * @author ouandyang
	 * @param docFlowApply 文件流转实体
	 * @updateTime 2021/8/23
	 */
	@Hidden
	@ApiOperation(value = "发起文档流转流程")
	@ApiImplicitParam(name = "docFlowApply", value = "文件流转实体")
	@PostMapping(value = "/flow")
	public void save(@Valid @RequestBody DocFlowApply docFlowApply) {
		docFlowApply.setUser_id(getUserId());
		JSONObject jsonObject = new JSONObject();
		// List<String> list = new ArrayList<>();
		// list.add("Process_KcJJzQ1a");
		// jsonObject.put("proc_def_keys",list);
		// jsonObject.put("type","delete");
		// jsonObject.put("proc_def_keys","Process_kSHl6lCl");
		nsqSenderService.sendMessage(NsqConstants.CORE_AUDIT_FLOW_APPLY, JSONUtil.toJsonStr(docFlowApply));
		// nsqSenderService.sendMessage(NsqConstants.CORE_PROC_DEF_INVALID,
		// jsonObject.toString());
	}

	/**
	 * @description 发起任意接入审核流程
	 * @author ouandyang
	 * @param arbitrailyApply 任意接入审核实体
	 * @updateTime 2021/8/23
	 */
	@Hidden
	@ApiOperation(value = "发起任意接入审核流程")
	@ApiImplicitParam(name = "arbitrailyApply", value = "任意审核实体")
	@PostMapping(value = "/arbitrarily")
	public void save(@Valid @RequestBody ArbitrailyApply arbitrailyApply) {
		arbitrailyApply.getProcess().setUser_id(getUserId());
		arbitrailyApply.setData(
				"{\"submitter\":{\"id\":\"e85afcf6-5fd9-11ed-a6a4-8e47f138098b\",\"name\":\"1\",\"target_path\":\"我是1的自定义\",\"sync_mode\":\"copy\",\"submit_time\":\"2022-11-1609:45:27\"},\"docs\":[{\"id\":\"gns://2DDD8E754DAC446584E8659F87C3C4FE\",\"data_name\":\"mm.jpg\",\"data_path\":\"1/mm.jpg\",\"size\":\"94622\"}]}");
		arbitrailyApply.getWorkflow()
				.setContent("{\"source\": \"文档名称：新建文本110\",\"target\": \"目标位置：xxx/新建文件夹33\",\"mode\": \"同步模式：拷贝\"}");
		arbitrailyApply.getWorkflow().setAbstract_info("{\"icon\": \"folder\",\"text\": \"新建文本110\"}");
		nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_APPLY, JSONUtil.toJsonStr(arbitrailyApply));
	}

	@ApiOperation(value = "判断用户是否具备审核权限", notes = "1.当类型为我的申请时，判断当前用户是否为申请者  " +
			"\n 2.当类型为我的待办时，判断当前用户是否为审核员且用户密级大于文档密级 " +
			"\n 3.当类型为我的已办时，判断当前用户是否为审核员")
	@GetMapping(value = "/authority", produces = "application/json; charset=UTF-8")
	public TaskCheckResultVO checkAuthority(
			@Valid @ApiParam(name = "documentAuthorityDTO", value = "校验审核权限查询对象") TaskAuthCheckDTO documentAuthorityDTO) {
		DocAuditHistoryModel auditApply = docAuditHistoryService
				.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getProcInstId,
						documentAuthorityDTO.getProc_inst_id()));
		if (null == auditApply) {
			throw new IllegalArgumentException("未找到申请业务数据。");
		}
		Integer csfLevel = auditApply.getCsfLevel() == null
				&& !WorkflowConstants.TYPE_TASK.equals(documentAuthorityDTO.getType()) ? 999 : auditApply.getCsfLevel();
		boolean result = processInstanceService.checkAuditAuth(documentAuthorityDTO.getType(),
				documentAuthorityDTO.getProc_inst_id(), getUserId(), csfLevel);
		return TaskCheckResultVO.builder(result, AuditStatusEnum.getCodeByValue(auditApply.getAuditStatus()),
				DocAuditApplyListVO.buildProcessAuditorVoList(auditApply.getAuditor()));
	}

	/**
	 * @description 获取共享审核详情
	 * @author hanjian
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@PageQuery
	@ApiOperation(value = "获取共享审核详情", notes = "")
	@ApiImplicitParam(name = "bizId", value = "申请ID")
	@GetMapping(value = "/{id}/info", produces = "application/json; charset=UTF-8")
	public DocAuditShareInfoVO shareInfo(@PathVariable String bizId) {
		QueryWrapper<DocAuditApplyModel> query = new QueryWrapper<>();
		query.lambda().eq(DocAuditApplyModel::getBizId, bizId);
		DocAuditApplyModel docAuditApplyModel = docAuditApplyService.getOne(query);
		if (docAuditApplyModel == null) {
			throw new IllegalArgumentException("该共享审核详情不存在，本次操作无法生效。");
		}
		return DocAuditShareInfoVO.builder(docAuditApplyModel);
	}

	/**
	 * @description 获取共享审核列表
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@PageQuery
	@ApiOperation(value = "获取共享审核列表", notes = "")
	@ApiImplicitParams({
			@ApiImplicitParam(name = "biz_type", value = "共享类型（realname共享给指定用户的申请，anonymous共享给任意用户的申请）", example = "realname"),
			@ApiImplicitParam(name = "doc_id", value = "文档id", example = "") })
	@GetMapping(value = "/share", produces = "application/json; charset=UTF-8")
	public List<DocAuditShareVO> shareList(@RequestParam String biz_type, @RequestParam String doc_id) {
		List<DocAuditApplyModel> docAuditApplyList = docAuditApplyService.list(
				new LambdaQueryWrapper<DocAuditApplyModel>().eq(DocAuditApplyModel::getApplyUserId, this.getUserId())
						.eq(DocAuditApplyModel::getBizType, biz_type).apply("doc_id like {0}", doc_id));
		return DocAuditShareVO.builder(docAuditApplyList);
	}

	/**
	 * @description 撤销申请
	 * @author ouandyang
	 * @updateTime 2021/7/27
	 */
	@PageQuery
	@ApiOperation(value = "撤销申请")
	@ApiImplicitParam(name = "apply_id", value = "申请ID")
	@DeleteMapping(value = "/{apply_id}", produces = "application/json; charset=UTF-8")
	public void cancel(@PathVariable String apply_id) {
		docAuditSubmitService.revocationByApplyId(apply_id, this.getUserId(), DocConstants.DELETE_REASON_REVOCATION);
	}

	@PageQuery
	@ApiOperation(value = "加签")
	@ApiImplicitParam(name = "apply_id", value = "申请ID")
	@PostMapping(value = "/countersign/{apply_id}", produces = "application/json; charset=UTF-8")
	public void countersign(@PathVariable String apply_id, @RequestBody Countersign countersign) {
		docAuditSubmitService.countersignByApplyId(apply_id, this.getUserId(), countersign, true);
	}

	@PageQuery
	@ApiOperation(value = "转审")
	@ApiImplicitParam(name = "apply_id", value = "申请ID")
	@PostMapping(value = "/transfer/{apply_id}", produces = "application/json; charset=UTF-8")
	public void transfer(@PathVariable String apply_id, @Validated @RequestBody Transfer transfer) {
		docAuditSubmitService.transferByApplyId(apply_id, this.getUserId(), transfer, true);
	}

	@ApiOperation(value = "加签信息集合")
	@GetMapping(value = "/countersign/list/{apply_id}/{task_id}", produces = "application/json; charset=UTF-8")
	public List<CountersignInfo> countersignList(@PathVariable String apply_id, @PathVariable String task_id) {
		return docAuditApplyService.countersignInfoList(apply_id, task_id);
	}

	@ApiOperation(value = "加签信息日志集合")
	@GetMapping(value = "/countersign/logs/{proc_inst_id}", produces = "application/json; charset=UTF-8")
	public List<CountersignInfo> countersignLogs(@PathVariable String proc_inst_id) {
		return docAuditApplyService.countersignInfoLogs(proc_inst_id);
	}

	@GetMapping(value = "/avatars/{userIds}", produces = "application/json; charset=UTF-8")
	public List<Map<String, Object>> avatars(@PathVariable List<String> userIds) {
		List<Map<String, Object>> resultList = new ArrayList<>();
		for (String userID : userIds) {
			Dict dict = dictService.findDictByCode("avatars_" + userID);
			Map<String, Object> result = Maps.newHashMap();
			result.put("id", userID);
			result.put("avatar_url", null != dict ? dict.getDictName() : "");
			resultList.add(result);
		}
		return resultList;
	}

	@PutMapping(value = "/to-do-list/{messageId}/handler_id", produces = "application/json; charset=UTF-8")
	public void UpdateTodoListHandler(@PathVariable String messageId, @Valid @RequestBody UpdateTodoListHandlerVO data) {
		ProcessMessageOperation processMessageOperation = getProcessMessageOperation();
		List<String> receivers = new ArrayList<>();
		receivers.add(this.getUserId());

		try {
			processMessageOperation.updateTodoMessageReceiverHandler(messageId, receivers, data.getHandlerId());
		} catch (Exception e) {
			throw new InternalError("更新待办消息失败。");
		}
	}
}
