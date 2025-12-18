package com.aishu.wf.core.engine.core.service.impl;

import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.aishu.wf.core.doc.model.dto.ShareStrategyDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyConfigService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import com.aishu.wf.core.engine.core.model.dto.ExpireReminderDTO;
import com.aishu.wf.core.engine.core.model.dto.PermConfigDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.aishu.wf.core.engine.core.model.warp.DocShareStrategyWarp;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessModelService;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.activiti.bpmn.converter.BpmnXMLConverter;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.UserTask;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.util.io.InputStreamSource;
import org.activiti.engine.repository.DeploymentBuilder;
import org.activiti.validation.ProcessValidator;
import org.activiti.validation.ProcessValidatorFactory;
import org.activiti.validation.ValidationError;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @description 流程模型实现类
 * @author hanj
 */
@Service
@Transactional(propagation = Propagation.SUPPORTS)
@Slf4j
public class ProcessModelServiceImpl extends AbstractServiceHelper implements ProcessModelService {

	@Autowired
	private ProcessDefinitionService processDefinitionService;

	@Autowired
	private ProcessInfoConfigManager processInfoConfigManager;

	@Autowired
	ActivityRuleManager activityRuleManager;

	@Autowired
	private DocShareStrategyService docShareStrategyService;

	@Autowired
	private SyncBpmnModelToDb syncBpmnModelToDb;

	@Autowired
	private DictService dictService;

	@Autowired
	private ProcessModelServiceImpl processModelServiceImpl;

	@Autowired
	private ThreadPoolTaskExecutor executor;

	@Autowired
	private DocShareStrategyConfigService docShareStrategyConfigService;


	/**
	 * 新流程定义获取所有信息
	 * @param procDefId
	 * @return
	 */
	public ProcDefModel getProcessDefModelByProcDefId(String procDefId) {
		ProcDefModel procDefModel = new ProcDefModel();
		ProcessDefinitionModel processDefinition = processDefinitionService.getProcessDef(procDefId);
		if (processDefinition == null) {
			throw new IllegalArgumentException(String.format("流程定义[%s]不存在", procDefId));
		}

		ProcessInfoConfig infoConfig = processInfoConfigManager.getById(processDefinition.getProcDefId());
		String processXml = processDefinitionService.loadProcessXml(processDefinition.getProcDefId());
		procDefModel.setId(processDefinition.getProcDefId());
		procDefModel.setName(processDefinition.getProcDefName());
		procDefModel.setKey(processDefinition.getProcDefKey());
		procDefModel.setFlowXml(processXml);
		procDefModel.setDescription(infoConfig.getRemark());
		procDefModel.setType(infoConfig.getProcessTypeId());
		procDefModel.setCreateTime(infoConfig.getCreateTime());
		procDefModel.setVersion(infoConfig.getProcessVersion());
		procDefModel.setTypeName(infoConfig.getProcessTypeName());
		procDefModel.setTenantId(infoConfig.getTenantId());
		procDefModel.setCreateUser(infoConfig.getCreateUser());
		procDefModel.setCreateUserName(infoConfig.getCreateUserName());

		if(!WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(procDefModel.getType()) ||
			WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(procDefModel.getType()) && !CommonConstants.TENANT_AS_WORKFLOW.equals(procDefModel.getTenantId())){
			List<DocShareStrategy> strategyList = docShareStrategyService.getDocStrategy(procDefId);
			// 获取节点配置
			ObjectMapper objectMapper = new ObjectMapper();
        	objectMapper.addMixIn(DocShareStrategy.class, DocShareStrategyWarp.class);
			for (DocShareStrategy element: strategyList) {
				List<DocShareStrategyConfig> strategyConfigs = docShareStrategyConfigService.list(new LambdaQueryWrapper<DocShareStrategyConfig>()
					.eq(DocShareStrategyConfig::getProcDefId, element.getProcDefId())
					.eq(DocShareStrategyConfig::getActDefId, element.getActDefId()));
				Map<String, String> strategyConfigsMap = strategyConfigs.stream().collect(Collectors.toMap(DocShareStrategyConfig::getName, DocShareStrategyConfig::getValue));
				try {
					String jsonString = objectMapper.writeValueAsString(strategyConfigsMap);
					DocShareStrategy strategy = JSON.parseObject(jsonString, DocShareStrategy.class);
					element.setSendBackSwitch(strategy.getSendBackSwitch());
				} catch (Exception e) {
					element.setSendBackSwitch("N");
				}
			}
			procDefModel.setDocShareStrategyList(strategyList);
		}
		//查询流程高级设置
		if(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY.equals(procDefModel.getKey())){
			Dict autoSwitch = dictService.findDictByCode(WorkFlowContants.RENAME_AUTO_AUDIT_SWITCH);
			if(null != autoSwitch){
				AdvancedSetupDTO advancedSetup = new AdvancedSetupDTO();
				advancedSetup.setRename_switch(autoSwitch.getDictName());
				procDefModel.setAdvancedSetup(advancedSetup);
			}
		} else if(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY.equals(procDefModel.getKey())){
			Dict autoSwitch = dictService.findDictByCode(WorkFlowContants.ANONYMITY_AUTO_AUDIT_SWITCH);
			if(null != autoSwitch){
				AdvancedSetupDTO advancedSetup = new AdvancedSetupDTO();
				advancedSetup.setAnonymity_switch(autoSwitch.getDictName());
				procDefModel.setAdvancedSetup(advancedSetup);
			}
		} else {
			// 获取流程同一审核员重复审核类型
			DocShareStrategy  docShareStrategy = docShareStrategyService.getDocShareStrategy(procDefModel.getId());
			AdvancedSetupDTO advancedSetup = new AdvancedSetupDTO();
			advancedSetup.setRepeat_audit_rule(docShareStrategy.getRepeatAuditType());
			advancedSetup.setPerm_config(docShareStrategy.getPermConfig()==null? null : JSON.parseObject(docShareStrategy.getPermConfig(), PermConfigDTO.class));
			StrategyConfigsDTO strategyConfigs = docShareStrategy.getStrategyConfigs() == null ? null
					: JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
			advancedSetup.setEdit_perm_switch(strategyConfigs != null && strategyConfigs.getEditPermSwitch()!= null? strategyConfigs.getEditPermSwitch() : false);
			advancedSetup.setAudit_idea_config(strategyConfigs != null && strategyConfigs.getAuditIdeaConfig() != null ? strategyConfigs.getAuditIdeaConfig() : null);
			procDefModel.setAdvancedSetup(advancedSetup);
		}
		return procDefModel;
	}


	/**
	 * 新流程定义获取所有信息
	 * @param procDefKey
	 * @param tenantId
	 * @return
	 */
	public ProcDefModel getProcessDefModelByKey(String procDefKey, String tenantId) {
		ProcDefModel procDefModel = new ProcDefModel();
		ProcessDefinitionModel processDefinition = processDefinitionService.getProcessDefBykey(procDefKey, tenantId);
		if (processDefinition == null) {
			throw new IllegalArgumentException(String.format("流程定义key[%s]不存在", procDefKey));
		}
		ProcessInfoConfig infoConfig = processInfoConfigManager.getById(processDefinition.getProcDefId());
		if (infoConfig == null) {
			throw new IllegalArgumentException(String.format("流程定义key[%s]不存在", procDefKey));
		}
		String processXml = processDefinitionService.loadProcessXml(processDefinition.getProcDefId());
		procDefModel.setId(processDefinition.getProcDefId());
		procDefModel.setName(processDefinition.getProcDefName());
		procDefModel.setKey(processDefinition.getProcDefKey());
		procDefModel.setFlowXml(processXml);
		procDefModel.setDescription(infoConfig.getRemark());
		procDefModel.setType(infoConfig.getProcessTypeId());
		procDefModel.setCreateTime(infoConfig.getCreateTime());
		procDefModel.setVersion(infoConfig.getProcessVersion());
		procDefModel.setTypeName(infoConfig.getProcessTypeName());
		procDefModel.setCreateUser(infoConfig.getCreateUser());
		procDefModel.setCreateUserName(infoConfig.getCreateUserName());
		return procDefModel;
	}


	/**
	 * 根据Model部署流程
	 */
	@Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
	@Override
	public String deploy(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
						 List<DocShareStrategy> shareStrategyList, String type, String typeName, String description, String userId, boolean isCopy,String template) {
		String procDefId;
		try {
			if (StringUtils.isEmpty(procDefKey)) {
				throw new IllegalArgumentException("传入procDefKey为空值,无法找到模型！");
			}
			BpmnModel bpmnModel = convertByteToBpmnModel(bpmnBytes, "");
			String processName = procDefName + ".bpmn20.xml";
			DeploymentBuilder deploymentBuilder = repositoryService.createDeployment();
			deploymentBuilder.category(type);
			deploymentBuilder.name(procDefName);
			deploymentBuilder.tenantId(tenantId);
			deploymentBuilder.addInputStream(processName, new ByteArrayInputStream(bpmnBytes)).deploy();
			// 同步模型到数据库中
			ProcessDefinitionModel procDefModel = processDefinitionService.getProcessDefBykey(procDefKey, tenantId);
			procDefModel.setCategory(type);
			procDefModel.setDescription(description);
			procDefId = procDefModel.getProcDefId();
			syncBpmnModelToDb(procDefModel, bpmnModel, typeName, userId,template,tenantId);
			//审核策略不为空，保存审核策略
			if (!shareStrategyList.isEmpty()) {
				docShareStrategyService.deleteDocShareStrategyByProcDefId(procDefId);
				docShareStrategyConfigService.deleteDocShareStrategyConfig(procDefId);
				docShareStrategyService.saveDocAuditStrategy(procDefId, procDefName, userId, shareStrategyList, false,tenantId);
			}

			//异步记录日志
			if(!WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(type)){
				LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
				if(isCopy){
					this.asynCopyProcessDefinitionLog(bpmnBytes, procDefKey, procDefName, tenantId, shareStrategyList, type,
							typeName, description, userId, logBaseDTO);
				} else {
					this.asynAddProcessDefinitionLog(bpmnBytes, procDefKey, procDefName, tenantId, shareStrategyList, type,
							typeName, description, userId, logBaseDTO);
				}
			}

		} catch (Exception e) {
			String errorMsg = String.format("根据流程模型[%s]来部署流程失败,错误信息:[%s]", procDefKey, e.getLocalizedMessage());
			throw new WorkFlowException(errorMsg,e);
		}
		return procDefId;
	}

	/**
	 * 覆盖已有流程定义版本，并更新流程定义的缓存
	 */
	@Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
	@Override
	public String deployCascadeUpdate(byte[] bpmnBytes, String procDefId, String procDefName, List<DocShareStrategy> docShareStrategyList,
			String type, String typeName, String description, String userId) {
		try {
			if (StringUtils.isEmpty(procDefId)) {
				throw new IllegalArgumentException("传入procDefKey为空值,无法找到模型！");
			}
			// 获取最新版本的流程定义
			ProcessDefinitionModel procDefModel = processDefinitionService.getProcessDef(procDefId);
			// 以as_workflow或af_workflow身份创建的流程可跳过此逻辑校验
			if (!procDefModel.getTenantId().contains("workflow") && StrUtil.isNotEmpty(userId)
					&& !procDefModel.getTenantId().equals(userId)) {
				throw new RestException(BizExceptionCodeEnum.A403057014.getCode(), BizExceptionCodeEnum.A403057014.getMessage());
			}
			BpmnModel bpmnModel = convertByteToBpmnModel(bpmnBytes, procDefModel.getProcDefId());
			// 更新bpmn.xml
			processDefinitionService.updateDeploymentResource(procDefModel.getDeploymentId(),
					procDefModel.getProcDefId(), bpmnBytes, false);
			// 更新流程定义缓存
			processDefinitionService.refreshProcessDefineCache(procDefModel.getProcDefId());
			procDefModel.setCategory(type);
			procDefModel.setDescription(description);
			procDefId = procDefModel.getProcDefId();
			// 同步模型到数据库中
			syncBpmnModelToDb(procDefModel, bpmnModel, typeName, userId,"","");
			//审核策略不为空，保存审核策略
			if (!docShareStrategyList.isEmpty()) {
				docShareStrategyService.deleteDocShareStrategyByProcDefId(procDefId);
				docShareStrategyConfigService.deleteDocShareStrategyConfig(procDefId);
				docShareStrategyService.saveDocAuditStrategy(procDefId, procDefName, userId, docShareStrategyList,
						false,procDefModel.getTenantId());
			}
			//异步记录日志
			if(!WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(type)){
				LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
				this.asynUpdateProcessDefinitionLog(bpmnBytes, procDefId, procDefName, docShareStrategyList, type,
						typeName, description, userId, logBaseDTO, procDefModel.getProcDefKey(),procDefModel.getTenantId());
			}
		} catch (RestException re) {
			throw re;
		} catch (Exception e) {
			String errorMsg = String.format("覆盖已有流程定义[%s]版本，并更新流程定义的缓存", procDefId);
			throw new WorkFlowException(errorMsg,e);
		}
		return procDefId;
	}

	/**
	 * 同步流程模型至数据库
	 */
	@Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
	@Override
	public boolean syncBpmnModelToDb(ProcessDefinitionModel processDefinition, BpmnModel bpmnModel, String typeName,
			String userId,String template, String tenantId) {
		ProcessInfoConfig prevVersionProcessConfig = processInfoConfigManager
				.getPrevVersionProcessConfig(processDefinition.getProcDefId());
		boolean result = syncBpmnModelToDb.syncProcess(bpmnModel, processDefinition, prevVersionProcessConfig, typeName,
				userId, template);
		if (result) {
			result = syncBpmnModelToDb.syncActivity(bpmnModel, processDefinition, prevVersionProcessConfig);
		}
		try {
			if (prevVersionProcessConfig != null) {
				prevVersionProcessConfig.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_N);
				processInfoConfigManager.updateById(prevVersionProcessConfig);
			}
		} catch (Exception e) {
			log.warn("",e);
		}
 		return result;
	}

	/**
	 * 流程是否执行过
	 *
	 * @param procDefId
	 * @return
	 */
	public Boolean processDefinitionHasHistory(String procDefId) {
		List<HistoricTaskInstance> historicTaskInstances = this.historyService.createHistoricTaskInstanceQuery()
				.processDefinitionId(procDefId).listPage(0, 1);
		return !historicTaskInstances.isEmpty();
	}

	/**
	 * 验证BPMN文件
	 *
	 * @param in
	 * @return
	 */
	@Override
	public List<ValidationError> validateBpmnXml(InputStream in) {
		List<ValidationError> validationErrors = null;
		try {
			BpmnModel bpmnModel = this.convertFileToBpmnModel(in);
			ProcessValidator processValidator = new ProcessValidatorFactory().createDefaultProcessValidator();
			validationErrors = processValidator.validate(bpmnModel);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2008, "Error parsing XML", e);
		}
		return validationErrors;
	}

	/**
	 * 验证BPMN模型
	 *
	 * @param bpmnModel
	 * @return
	 */
	@Override
	public List<ValidationError> validateBpmnModel(BpmnModel bpmnModel) {
		List<ValidationError> validationErrors = null;
		try {
			ProcessValidator processValidator = new ProcessValidatorFactory().createDefaultProcessValidator();
			validationErrors = processValidator.validate(bpmnModel);
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2008, "Error parsing XML", e);
		}
		return validationErrors;
	}



	/**
	 * 获取流程对象模型
	 *
	 * @param procDefId
	 * @return
	 */
	@Override
	public BpmnModel getBpmnModelByProcDefId(String procDefId) {
		return processDefinitionService.getRepositoryService().getBpmnModel(procDefId);
	}

	/**
	 * @description 将流程文件转换成流程对象模型
	 * @author hanj
	 * @param  in
	 * @updateTime 2021/5/20
	 */
	@Override
	public BpmnModel convertFileToBpmnModel(InputStream in) {
		BpmnModel bpmnModel;
		try {
			BpmnXMLConverter converter = new BpmnXMLConverter();
			boolean enableSafeBpmnXml = false;
			if (Context.getProcessEngineConfiguration() != null) {
				enableSafeBpmnXml = Context.getProcessEngineConfiguration().isEnableSafeBpmnXml();
			}
			bpmnModel = converter.convertToBpmnModel(new InputStreamSource(in), true, enableSafeBpmnXml);
			// 外部平台导入BPMN文件有可能isExecutable=false,导致引擎不会解析bpmn文件,所以需要加此判断
			if (bpmnModel.getMainProcess() != null && !bpmnModel.getMainProcess().isExecutable()) {
				bpmnModel.getMainProcess().setExecutable(true);
			}
		} catch (Exception e) {
			throw new WorkFlowException(ExceptionErrorCode.B2008, "Error parsing XML", e);
		}
		return bpmnModel;
	}

	/**
	 * 将流程模型转换成字节码
	 *
	 * @param bpmnModel
	 * @return byte[]
	 */
	@Override
	public byte[] convertBpmnModelToByte(BpmnModel bpmnModel) throws WorkFlowException {
		return convertBpmnModelToByte(bpmnModel, "");
	}

	/**
	 * 将流程模型转换成字节码
	 *
	 * @param bpmnModel
	 * @param processDefId
	 * @return byte[]
	 */
	@Override
	public byte[] convertBpmnModelToByte(BpmnModel bpmnModel, String processDefId) throws WorkFlowException {
		byte[] bpmnBytes = null;
		updateProcessStarter(processDefId, bpmnModel);
		BpmnXMLConverter xmlConverter = new BpmnXMLConverter();
		bpmnBytes = xmlConverter.convertToXML(bpmnModel);
		return bpmnBytes;
	}

	/**
	 * 将字节码转为流程模型
	 *
	 * @param bpmnBytes
	 * @param processDefId
	 * @return byte[]
	 */
	@Override
	public BpmnModel convertByteToBpmnModel(byte[] bpmnBytes, String processDefId) throws WorkFlowException {
		BpmnModel bpmnModel = convertFileToBpmnModel(new ByteArrayInputStream(bpmnBytes));
		updateProcessStarter(processDefId, bpmnModel);
		return bpmnModel;
	}

	/**
	 * 更新流程发起人
	 *
	 * @param processDefId
	 * @param bpmnModel
	 */
	private void updateProcessStarter(String processDefId, BpmnModel bpmnModel) {
		UserTask userTask = ProcessModelUtils.findStartUserTask(bpmnModel);
		bpmnModel.getMainProcess().getCandidateStarterGroups().clear();
		bpmnModel.getMainProcess().getCandidateStarterOrgs().clear();
		bpmnModel.getMainProcess().getCandidateStarterUsers().clear();
		if (userTask != null) {
			if (userTask.getCandidateGroups() != null && !userTask.getCandidateGroups().isEmpty()
					&& bpmnModel.getMainProcess().getCandidateStarterGroups().isEmpty()) {
				bpmnModel.getMainProcess().getCandidateStarterGroups().addAll(userTask.getCandidateGroups());
			}
			if (userTask.getCandidateUsers() != null && !userTask.getCandidateUsers().isEmpty()
					&& bpmnModel.getMainProcess().getCandidateStarterUsers().isEmpty()) {
				bpmnModel.getMainProcess().getCandidateStarterUsers().addAll(userTask.getCandidateUsers());
			}
			if (userTask.getCandidateOrgs() != null && !userTask.getCandidateOrgs().isEmpty()
					&& bpmnModel.getMainProcess().getCandidateStarterOrgs().isEmpty()) {
				bpmnModel.getMainProcess().getCandidateStarterOrgs().addAll(userTask.getCandidateOrgs());
			}
		}
		if (!StringUtils.isEmpty(processDefId)) {
			for (String groupId : bpmnModel.getMainProcess().getCandidateStarterGroups()) {
				processDefinitionService.getRepositoryService().deleteCandidateStarterGroup(processDefId, groupId);
				processDefinitionService.getRepositoryService().addCandidateStarterGroup(processDefId, groupId);
			}
			for (String userId : bpmnModel.getMainProcess().getCandidateStarterUsers()) {
				processDefinitionService.getRepositoryService().deleteCandidateStarterUser(processDefId, userId);
				processDefinitionService.getRepositoryService().addCandidateStarterUser(processDefId, userId);
			}
			for (String orgId : bpmnModel.getMainProcess().getCandidateStarterOrgs()) {
				processDefinitionService.getRepositoryService().deleteCandidateStarterOrg(processDefId, orgId);
				processDefinitionService.getRepositoryService().addCandidateStarterOrg(processDefId, orgId);
			}
		}
	}

	/**
	 * @description 异步记录新增流程日志
	 * @author hanj
	 * @param bpmnBytes bpmnBytes
	 * @param procDefKey procDefKey
	 * @param procDefName procDefName
	 * @param tenantId tenantId
	 * @param shareStrategyList shareStrategyList
	 * @param type type
	 * @param typeName typeName
	 * @param description description
	 * @param userId userId
	 * @param logBaseDTO logBaseDTO
	 * @updateTime 2021/9/3
	 */
	public void asynAddProcessDefinitionLog(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
											List<DocShareStrategy> shareStrategyList, String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO){
		Runnable run = () -> {
			try {
				processModelServiceImpl.addProcessDefinitionLog(bpmnBytes, procDefKey, procDefName, tenantId, shareStrategyList,
						type, typeName, description, userId, logBaseDTO);
			} catch (Exception e) {
				log.warn("",e);
			}
		};
		executor.execute(run);
	}

	/**
	 * @description 异步记录复制流程日志
	 * @author hanj
	 * @param bpmnBytes bpmnBytes
	 * @param procDefKey procDefKey
	 * @param procDefName procDefName
	 * @param tenantId tenantId
	 * @param shareStrategyList shareStrategyList
	 * @param type type
	 * @param typeName typeName
	 * @param description description
	 * @param userId userId
	 * @param logBaseDTO logBaseDTO
	 * @updateTime 2021/9/3
	 */
	public void asynCopyProcessDefinitionLog(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
											List<DocShareStrategy> shareStrategyList, String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO){
		Runnable run = () -> {
			try {
				processModelServiceImpl.copyProcessDefinitionLog(bpmnBytes, procDefKey, procDefName, tenantId, shareStrategyList,
						type, typeName, description, userId, logBaseDTO);
			} catch (Exception e) {
				log.warn("",e);
			}
		};
		executor.execute(run);
	}

	/**
	 * @description 异步记录修改流程日志
	 * @author hanj
	 * @param bpmnBytes bpmnBytes
	 * @param procDefId procDefId
	 * @param procDefName procDefName
	 * @param docShareStrategyList docShareStrategyList
	 * @param type type
	 * @param typeName typeName
	 * @param description description
	 * @param userId userId
	 * @param logBaseDTO logBaseDTO
	 * @updateTime 2021/9/3
	 */
	public void asynUpdateProcessDefinitionLog(byte[] bpmnBytes, String procDefId, String procDefName, List<DocShareStrategy> docShareStrategyList,
											   String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO, String procDefKey,String tenantId){
		Runnable run = () -> {
			try {
				processModelServiceImpl.updateProcessDefinitionLog(bpmnBytes, procDefId, procDefName, docShareStrategyList,
						type, typeName, description, userId, logBaseDTO, procDefKey,tenantId);
			} catch (Exception e) {
				log.warn("",e);
			}
		};
		executor.execute(run);
	}

	@OperationLog(title = OperationLogConstants.ADD_PROCESS_DEFINITION_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
	public void addProcessDefinitionLog(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
										List<DocShareStrategy> shareStrategyList, String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO){
	}

	@OperationLog(title = OperationLogConstants.COPY_PROCESS_DEFINITION_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
	public void copyProcessDefinitionLog(byte[] bpmnBytes, String procDefKey, String procDefName, String tenantId,
										List<DocShareStrategy> shareStrategyList, String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO){
	}

	@OperationLog(title = OperationLogConstants.UPDATE_PROCESS_DEFINITION_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
	public void updateProcessDefinitionLog(byte[] bpmnBytes, String procDefId, String procDefName, List<DocShareStrategy> docShareStrategyList,
										   String type, String typeName, String description, String userId, LogBaseDTO logBaseDTO, String procDefKey,String tenantId){
	}
}
