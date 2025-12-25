package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.XmlUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.service.DocShareStrategyAuditorService;
import com.aishu.wf.core.doc.service.DocShareStrategyConfigService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.cmd.RefreshProcessDefineCacheCmd;
import com.aishu.wf.core.engine.core.cmd.UpdateDeploymentResourceCmd;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import com.aishu.wf.core.engine.core.model.dto.ExpireReminderDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessModelService;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.UserTask;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.pvm.PvmActivity;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.ReadOnlyProcessDefinition;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.repository.Deployment;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.repository.ProcessDefinitionQuery;
import org.activiti.validation.ProcessValidator;
import org.activiti.validation.ProcessValidatorFactory;
import org.activiti.validation.ValidationError;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipInputStream;

/**
 * @description 流程定义实现类
 * @author lw
 */
@Slf4j
@Service
@Transactional(propagation = Propagation.SUPPORTS)
public class ProcessDefinitionServiceImpl extends AbstractServiceHelper implements ProcessDefinitionService {

    @Autowired
    private RoleService roleService;

    @Autowired
    private OrgService orgService;

    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @Autowired
    private ProcessConfigService processConfigService;

    @Autowired
    private ProcessDefinitionServiceImpl processDefinitionServiceImpl;

    @Autowired
    private ProcessDefinitionResource processDefinitionResource;

    @Autowired
    private ProcessModelService processModelService;

    @Autowired
    private UserService userService;

    @Autowired
    private DictService dictService;

    @Autowired
    private NsqSenderService nsqSenderService;

    @Autowired
    private DocShareStrategyService docShareStrategyService;

    @Autowired
    private DocShareStrategyConfigService docShareStrategyConfigService;

    @Autowired
    private DocShareStrategyAuditorService docShareStrategyAuditorService;

    @Autowired
    private ThreadPoolTaskExecutor executor;
    @Autowired
    private ProcessDefinitionService processDefinitionService;

    /**
     * 查询流程定义列表
     *
     * @param queryDTO 查询对象
     * @return
     */
    @Override
    public IPage<ProcessInfoConfig> findProcessDefinitionList(ProcessDefinitionDTO queryDTO, String userId) {
        ProcessInfoConfig query = new ProcessInfoConfig();
        if (StrUtil.isNotBlank(queryDTO.getKey())) {
            query.setProcessDefKey(queryDTO.getKey());
        }
        if (StrUtil.isNotBlank(queryDTO.getType_id())) {
            query.setProcessTypeId(queryDTO.getType_id());
        }
        if (StrUtil.isNotBlank(queryDTO.getName())) {
            query.setProcessDefName(queryDTO.getName());
        }
        if (StrUtil.isNotBlank(queryDTO.getCreate_user())) {
            query.setCreateUserName(queryDTO.getCreate_user());
        }
        if (StrUtil.isNotBlank(queryDTO.getAuditor())) {
            query.setAuditor(queryDTO.getAuditor());
        }
        if (StrUtil.isNotBlank(String.valueOf(queryDTO.getFilter_invalid()))) {
            query.setFilterInvalid(queryDTO.getFilter_invalid());
        }

        if (StrUtil.isNotBlank(String.valueOf(queryDTO.getTemplate()))) {
            query.setTemplate(queryDTO.getTemplate());

        }
        if (!this.checkRole(queryDTO.getRoles()) || queryDTO.getProcess_client() == 1) {
            query.setCreateUser(userId);
        }
        query.setTenantId(queryDTO.getTenant_id());
        query.setFilterShare(queryDTO.getFilter_share());
        return processConfigService.findProcessInfoConfigsPage(queryDTO, query);
    }

    /**
     * @description 查询实名共享流程
     * @author ouandyang
     * @param  tenantId
     * @updateTime 2021/5/20
     */
    @Override
    public ProcessInfoConfig findRenameProcessDefinition(String tenantId) {
        ProcessInfoConfig params = new ProcessInfoConfig();
        params.setProcessDefKey(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY);
        params.setTenantId(tenantId);
        List<ProcessInfoConfig> list = processConfigService.findProcessInfoConfigs(params);
        return CollUtil.isEmpty(list) ? null : list.get(0);
    }

    @Override
    public ProcessInfoConfig findProcessDefinitionByKey(String key) {
        ProcessInfoConfig params = new ProcessInfoConfig();
        params.setProcessDefKey(key);
        List<ProcessInfoConfig> list = processConfigService.findProcessInfoConfigs(params);
        return CollUtil.isEmpty(list) ? null : list.get(0);
    }

    @Override
    public void deleteBatchProcessDef(List<String> idList){
        List<ProcessInfoConfig> processInfoConfigList = processConfigService.getBatchProcessInfoConfig(idList);

        if(processInfoConfigList.size() == 0){
            return;
        }
        // 批量删除流程定义信息
        boolean result = processConfigService.deleteBatchProcessInfoConfig(idList);
        if(result){
            List<String> procDefKeyList = processInfoConfigList.stream().map(ProcessInfoConfig::getProcessDefKey).collect(Collectors.toList());
            // 发送NSQ-流程定义失效通知
            processNsqMessage(NsqConstants.CORE_PROC_DEF_INVALID, "delete", procDefKeyList, RequestUtils.getUserId());
            // 发送NSQ-workflow审核流程被删除
            processDelNsqMessage(procDefKeyList);

            LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
            this.asynDeleteProcessDefinitionLog(processInfoConfigList, logBaseDTO);

        }
    }

    /**
     * 部署流程
     *
     * @param processDeploymentDTO 流程建模定义对象
     * @param opType       操作类型（新建：new，更新：update）
     * @return
     */
    @Override
    public String deployProcess(ProcessDeploymentDTO processDeploymentDTO, String opType, String userId) {
        ExpireReminderDTO.validateParameter(processDeploymentDTO.getAdvanced_setup() == null ? null
                : processDeploymentDTO.getAdvanced_setup().getExpire_reminder());
        ProcDefModel procDefModel = ProcessDeploymentDTO.builderModel(processDeploymentDTO);
        String name = procDefModel.getName();
        String key = procDefModel.getKey();
        String procDefId = procDefModel.getId();
        String flowXml = ProcessDefinitionUtils.base64ToString(procDefModel.getFlowXml());
        flowXml= settingName(name,flowXml);
        String tenantId = procDefModel.getTenantId();
        String type = procDefModel.getType();
        String typeName = procDefModel.getTypeName();
        String description = procDefModel.getDescription();
        boolean isCopy = "1".equals(String.valueOf(processDeploymentDTO.getIs_copy())) ? true : false;
        List<DocShareStrategy> docShareStrategyList = procDefModel.getDocShareStrategyList();
        try {
            if (StringUtils.isEmpty(name) || StringUtils.isEmpty(key) || StringUtils.isEmpty(flowXml)
                    || StringUtils.isEmpty(tenantId)) {
                throw new IllegalArgumentException("保存流程失败，参数为空");
            }
            for (DocShareStrategy docShareStrategy : docShareStrategyList) {
                if (!docShareStrategy.getAuditModel().equals("zjsh")) {
                    continue;
                }
                List<DocShareStrategyAuditor> flowAuditorList = docShareStrategy.getAuditorList();
                for (DocShareStrategyAuditor flowAuditor : flowAuditorList) {
                    if (!StrUtil.isBlank(flowAuditor.getOrgType()) && !flowAuditor.getOrgType().equals("user")) {
                        throw new IllegalArgumentException("依次审核环节，用户列表不能包含组织");
                    }
                }
            }
            byte[] bpmnBytes = flowXml.getBytes(StandardCharsets.UTF_8);
            List<String> oldActDefIds = new ArrayList<>();
            if ("new".equals(opType)) {
                procDefId = processModelService.deploy(bpmnBytes, key, name, tenantId, docShareStrategyList, type, typeName, description, userId, isCopy,processDeploymentDTO.getTemplate());
            }else if ("update".equals(opType)) {
                //获取修改前的流程定义
                List<DocShareStrategy> docShareStrategies =  docShareStrategyService.listDocShareStrategy(Arrays.asList(procDefId), false);
                oldActDefIds = docShareStrategies.stream().map(DocShareStrategy::getActDefId).distinct().collect(Collectors.toList());
                ProcessDefinitionModel oldProcDefModel = processDefinitionService.getProcessDef(procDefId);
                if(!oldProcDefModel.getProcDefName().equals(name)){
                    modifyNsqMessage(NsqConstants.CORE_PROC_NAME_REALNAME, type, key, name);
                }
                procDefId = processModelService.deployCascadeUpdate(bpmnBytes, procDefId, name, docShareStrategyList, type, typeName, description, userId);
            } else {
                throw new IllegalArgumentException("opType[" + opType + "]错误");
            }
            // 更新自动审核开关选项（实名共享/匿名共享）
            if(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY.equals(key)){
                AdvancedSetupDTO advancedSetup = processDeploymentDTO.getAdvanced_setup();
                if(null != advancedSetup){
                    dictService.saveAutoAuditSwitch(WorkFlowContants.RENAME_AUTO_AUDIT_SWITCH, advancedSetup.getRename_switch());
                }
            } else if(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY.equals(key)){
                AdvancedSetupDTO advancedSetup = processDeploymentDTO.getAdvanced_setup();
                if(null != advancedSetup){
                    dictService.saveAutoAuditSwitch(WorkFlowContants.ANONYMITY_AUTO_AUDIT_SWITCH, advancedSetup.getAnonymity_switch());
                }
            } else {
                AdvancedSetupDTO advancedSetup = processDeploymentDTO.getAdvanced_setup();
                if(null != advancedSetup){
                    // 保存流程同一审核员重复审核类型
                    docShareStrategyService.saveAdvancedSetup(procDefId, advancedSetup);
                    docShareStrategyConfigService.saveDocAuditStrategyConfig(procDefId, advancedSetup);
                }
            }
            asyncHandleUpdateProcDef(docShareStrategyList, oldActDefIds, opType, procDefId);
        } catch (RestException re) {
            throw re;
        } catch (Exception e) {
                String errorMsg = String.format("[%s]流程部署失败,错误信息:[%s]", key, e.getLocalizedMessage());
                throw new IllegalArgumentException(errorMsg);
        }
        return procDefId;
    }

    /**
     *@description 解决流程定义名称包含+号和百分号被替换的问题
     * @author xiashenghui
     * @param defName 流程定义名称 xml
     * @param flowXml 流程xml
     * @return 流程xml
     * @updateTime 2022/6/27
     */


    private String settingName (String defName,String flowXml) {
        if(defName.indexOf("+") != -1 || defName.indexOf("%") != -1){
            Document document = XmlUtil.readXML(flowXml);
            List<Element> elementList = XmlUtil.getElements(document.getDocumentElement(), "process");
            if(elementList.size() == 0){
                throw new WorkFlowException(ExceptionErrorCode.A1000, "获取流程xml模板解析异常");
            }
            Element proceeElement = elementList.get(0);
            proceeElement.setAttribute("name", defName);
            return XmlUtil.toStr(document);
        }
        return flowXml;
    }

    private String validate(byte[] bpmnBytes) {
        String errorMsg = "";
        List<ValidationError> validationErrors = new ArrayList<>();
        try {
            BpmnModel bpmnModel = processModelService.convertByteToBpmnModel(bpmnBytes, "");
            ProcessValidator processValidator = new ProcessValidatorFactory().createDefaultProcessValidator();
            validationErrors = processValidator.validate(bpmnModel);
        } catch (Exception e) {
            errorMsg = "非法的流程模型!";
            log.warn(errorMsg, e);
        }
        if (!validationErrors.isEmpty()) {
            errorMsg = validationErrors.toString();
        }
        return errorMsg;
    }


    /**
     * 判断流程是否存在
     *
     * @param processDefName 流程建模定义对象
     * @param processTypeId  流程建模定义对象
     * @return
     */
    @Override
    public Boolean exists(String processDefName, String processTypeId, String tenantId) {
        if (StrUtil.isBlank(processDefName) && StrUtil.isBlank(processTypeId)) {
            return false;
        }
        ProcessInfoConfig processInfoConfig = new ProcessInfoConfig();
        processInfoConfig.setTenantId(tenantId);
        processInfoConfig.setProcessDefName(processDefName);
        processInfoConfig.setProcessTypeId(processTypeId);
        return processConfigService.checkEntity(processInfoConfig);
    }

    /**
     * @description 根据流程定义key判断流程是否存在
     * @author hanj
     * @param  processDefName
     * @param  processTypeId
     * @param  processDefKey
     * @param  tenantId
     * @updateTime 2021/6/4
     */
    @Override
    public Boolean existsByKey(String processDefName, String processTypeId, String processDefKey, String tenantId) {
        if (StrUtil.isBlank(processDefName) && StrUtil.isBlank(processTypeId)) {
            return false;
        }
        ProcessInfoConfig processInfoConfig = new ProcessInfoConfig();
        processInfoConfig.setTenantId(tenantId);
        processInfoConfig.setProcessDefName(processDefName);
        processInfoConfig.setProcessTypeId(processTypeId);
        processInfoConfig.setProcessDefKey(processDefKey);
        return processConfigService.checkEntity(processInfoConfig);
    }

    /**
     * 删除流程定义
     *
     * @param id        流程定义ID
     * @param isCascade 是否级联删除
     */
    @Override
    public Boolean deleteProcess(String id, boolean isCascade) {
        Boolean result = Boolean.FALSE;
        try {
            ProcessDefinitionModel processDefinition = this.getProcessDef(id);
            if (processDefinition != null) {
                result = this.delete(id, processDefinition.getDeploymentId(), isCascade);
            }
        } catch (Exception e) {
            log.warn("删除流程失败！", e);
        }
        return result;
    }

    /**
     * 获取环节定义信息
     *
     * @param id       流程定义ID
     * @param actDefId 环节定义ID
     */
    @Override
    public ActivityDefinitionModel getActivityDefinitionModel(String id, String actDefId) {
        ActivityDefinitionModel activityDefinitionModel = this.getActivity(id, actDefId);
        if (activityDefinitionModel == null) {
            return null;
        }
        BpmnModel bpmnModel = processModelService.getBpmnModelByProcDefId(id);
        UserTask userTask = ProcessModelUtils.findUserTask(bpmnModel, actDefId);
        List<ActivityResourceModel> activityResources = new ArrayList<>();
        if (!userTask.getCandidateGroups().isEmpty()) {
            List<Role> roles = roleService.findRoleByIds(userTask.getCandidateGroups());
            for (Role role : roles) {
                ActivityResourceModel activityResource = new ActivityResourceModel(role.getRoleId(), "角色",
                        role.getRoleName(), 0, "ROLE",
                        role.getRoleSort());
                activityResource.setRemark(role.getRoleId());
                activityResources.add(activityResource);
            }
        }
        if (!userTask.getCandidateOrgs().isEmpty()) {
            List<Org> orgs = orgService.findOrgByOrgIds(userTask.getCandidateOrgs());
            for (Org org : orgs) {
                ActivityResourceModel activityResource = new ActivityResourceModel(org.getOrgId(), "组织",
                        org.getOrgName(), 0, "ORG", org.getOrgSort());
                activityResource.setRemark(org.getOrgId());
                activityResources.add(activityResource);
            }
        }
        if (!userTask.getCandidateUsers().isEmpty()) {
            for (String userId : userTask.getCandidateUsers()) {
                try {
                    User user = userService.getUserById(userId);
                    if (user != null) {
                        List<Department> directDeptInfoList = user.getDirectDeptInfoList();
                        String name = user.getUserName() + "（" + (directDeptInfoList.isEmpty() ? "" : directDeptInfoList.get(0).getName()) + "）";
                        ActivityResourceModel activityResource = new ActivityResourceModel(userId, "人员",
                                name, 0, "USER", user.getPriority());
                        activityResource.setRemark(userId);
                        activityResources.add(activityResource);
                    }
                } catch (Exception e) {
                    log.warn("",e);
                }
            }
        }
        activityDefinitionModel.setActivityResources(activityResources);
        return activityDefinitionModel;
    }

    /**
     * 根据流程定义ID查询流程定义对象{@link ProcessDefinition}
     *
     * @param processDefinitionId 流程定义对象ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    @Override
    public ProcessDefinitionModel getProcessDef(String processDefinitionId) {
        ProcessDefinition processDefinition = repositoryService
                .createProcessDefinitionQuery()
                .processDefinitionId(processDefinitionId).singleResult();
        if (processDefinition == null) {
            return null;
        }
        return ProcessDefinitionModel.build(processDefinition);
    }

    @Override
    public ActivityDefinitionModel getActivity(String processDefinitionId,
                                               String activityId) {
        ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
        ActivityImpl destActivity = (ActivityImpl) rpd.findActivity(activityId);
        return ActivityDefinitionModel.build(destActivity);
    }

    /**
     * 根据定义key查询所有版本的流程定义数据
     *
     * @param procDefKey 流程定义Key
     * @return 流程定义对象list
     */
    @Override
    public List<ProcessDefinitionModel> findAllVersionProcessDefs(String procDefKey) {
        List<ProcessDefinitionModel> result = new ArrayList<>();
        if (!procDefKey.isEmpty()) {
            ProcessDefinitionQuery processDefinitionQuery = repositoryService.createProcessDefinitionQuery().processDefinitionKey(procDefKey).orderByProcessDefinitionVersion().desc();
            List<ProcessDefinition> processDefinitions = processDefinitionQuery.list();
            if (!processDefinitions.isEmpty()) {
                for (ProcessDefinition processDefinition : processDefinitions) {
                    ProcessDefinitionModel procDefModel = ProcessDefinitionModel.build(processDefinition);
                    ProcessInfoConfig temp = processInfoConfigManager.getById(processDefinition.getId());
                    if (temp != null) {
                        procDefModel.setPdCreateTime(temp.getCreateTime());
                    }
                    result.add(procDefModel);
                }
            }
            return result.isEmpty() ? null : result;
        } else {
            return null;
        }
    }


    /**
     * 根据流程定义ID查询流程定义对象{@link ProcessDefinition}
     *
     * @param processDefinitionKey 流程定义对象ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    @Override
    public ProcessDefinitionModel getProcessDefBykey(String processDefinitionKey, String tenantId) {
        ProcessDefinition processDefinition = repositoryService
                .createProcessDefinitionQuery()
                .processDefinitionKey(processDefinitionKey).processDefinitionTenantId(tenantId).latestVersion().singleResult();
        if (processDefinition == null) {
            return null;
        }
        return ProcessDefinitionModel.build(processDefinition);
    }

    @Override
    public ProcessDefinitionModel getProcessDefBykey(String processDefinitionKey) {
        ProcessDefinition processDefinition = repositoryService
                .createProcessDefinitionQuery()
                .processDefinitionKey(processDefinitionKey).latestVersion().singleResult();
        if (processDefinition == null) {
            return null;
        }
        return ProcessDefinitionModel.build(processDefinition);
    }

    /**
     * 根据用户ID查询有权限起草的流程定义列表{@link ProcessDefinition}
     *
     * @param userId 用户ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    @Override
    public Map<String, List<ProcessDefinitionModel>> findProcessDefStartByUser(String tenantId, String userId, String flowType) {
        List<ProcessDefinition> processDefinitions = repositoryService
                .createProcessDefinitionQuery().processDefinitionTenantId(tenantId).startableByUser(userId).latestVersion().list();
        //key=ProcessInfoConfig.processTypeId,value=List<ProcessDefinitionModel>
        Map<String, List<ProcessDefinitionModel>> result = new LinkedHashMap<String, List<ProcessDefinitionModel>>();
        if (processDefinitions == null || processDefinitions.isEmpty()) {
            log.warn("未找到一条当前用户匹配的流程定义数据,无法查询出流程新建列表");
            return result;
        }
        log.info("找到与当前用户匹配的流程定义数据列表[{}]", result);
        //key=processDefinitionId,value=ProcessDefinitionModel
        Map<String, ProcessDefinitionModel> processDefinitionModelMap = convertToProcessDefinitionModelMap(processDefinitions);
        //获取所有流程配置信息
        ProcessInfoConfig params = new ProcessInfoConfig();
        params.setTenantId(tenantId);
        if (!"null".equals(flowType) && StringUtils.isNotEmpty(flowType)) {
            params.setProcessTypeId(flowType);
        }
        List<ProcessInfoConfig> processInfoConfigs = processConfigService.findProcessInfoConfigs(params);
        if (processInfoConfigs == null || processInfoConfigs.isEmpty()) {
            log.warn("未找到一条当前用户匹配的流程配置数据,无法查询出流程新建列表");
            return result;
        }
        log.info("找到与当前用户匹配的流程配置数据列表[{}]", processInfoConfigs);
        for (ProcessInfoConfig processInfoConfig : processInfoConfigs) {
            /**
             * 通过流程配置中的流程定义ID到processDefinitionModelMap中获取ProcessDefinitionModel
             * 如果processDefinitionModelMap中不存在表明该流程没有在processInfoConfig中进行配置
             */

            ProcessDefinitionModel processDefinitionModel = processDefinitionModelMap.get(processInfoConfig.getProcessDefId());
            if (processDefinitionModel == null || !processInfoConfig.isRelease()) {
                continue;
            }
            if (result.containsKey(processInfoConfig.getProcessTypeId())) {
                List<ProcessDefinitionModel> processDefinitionModels = result.get(processInfoConfig.getProcessTypeId());
                processDefinitionModels.add(processDefinitionModel);
            } else {
                List<ProcessDefinitionModel> processDefinitionModels = new ArrayList<ProcessDefinitionModel>();
                processDefinitionModels.add(processDefinitionModel);
                result.put(processInfoConfig.getProcessTypeId(), processDefinitionModels);
            }
            //使用processInfoConfig.processDefName作为前台流程显示名称
            if (StringUtils.isNotEmpty(processInfoConfig.getProcessDefName())) {
                processDefinitionModel.setProcDefName(processInfoConfig.getProcessDefName());
            }
            processDefinitionModel.setProcessInfoConfig(processInfoConfig);
        }
        return result;
    }

    /**
     * 部署classpath下面的流程定义
     * <p>
     * 从属性配置文件中获取属性<b>com.blueland.bpm.engine.modules</b>扫描**deployments**
     * </p>
     * <p>
     * 然后从每个**deployments/${module}**查找在属性配置文件中的属性**com.blueland.bpm.engine.module.keys.${
     * submodule}**
     * <p>
     * 配置实例：
     *
     * <pre>
     * #com.blueland.bpm.engine for deploy
     * com.blueland.bpm.engine.modules=budget,erp,oa
     * com.blueland.bpm.engine.module.keys.budget=budget
     * com.blueland.bpm.engine.module.keys.erp=acceptInsurance,billing,effectInsurance,endorsement,payment
     * com.blueland.bpm.engine.module.keys.oa=caruse,leave,officalstamp,officesupply,out,overtime
     * </pre>
     *
     * </p>
     *
     * @param processKey 流程定义KEY
     * @throws Exception
     */
    @Override
    public void deployFromClasspath(String exportDir, String... processKey) {
        try {
            ResourceLoader resourceLoader = new DefaultResourceLoader();
            /*
             * String[] processKeys = { "leave", "leave-dynamic-from",
             * "leave-formkey", "dispatch" };
             */
            for (String loopProcessKey : processKey) {

                /*
                 * 需要过滤指定流程
                 */
                if (ArrayUtils.isNotEmpty(processKey)) {
                    if (ArrayUtils.contains(processKey, loopProcessKey)) {
                        log.debug("hit module of {}", processKey);
                        deploySingleProcess(resourceLoader, loopProcessKey,
                                exportDir);
                    } else {
                        log.debug(
                                "module: {} not equals process key: {}, ignore and continue find next.",
                                loopProcessKey, processKey);
                    }
                } else {
                    /*
                     * 所有流程
                     */
                    deploySingleProcess(resourceLoader, loopProcessKey, exportDir);
                }
            }
        } catch (Exception e) {
            log.warn("", e);
        }
    }

    @Override
    public void updateDeploymentResource(String deploymentId, String processDefinitionId, byte[] resourceByte, boolean isUpdateImage) {
        Command<Void> tempSaveTaskCmd = new UpdateDeploymentResourceCmd(deploymentId, processDefinitionId, resourceByte, isUpdateImage);
        this.managementService.executeCommand(tempSaveTaskCmd);
    }

    @Override
    public void refreshProcessDefineCache(String processDefinitionId) {
        Command<Void> refreshProcessDefineCacheCmd = new RefreshProcessDefineCacheCmd(processDefinitionId);
        this.managementService.executeCommand(refreshProcessDefineCacheCmd);
    }

	/**
	 * 部署单个流程定义
	 *
	 * @param resourceLoader {@link ResourceLoader}
	 * @param processKey     模块名称
	 * @param exportDir      流程定义名称
	 * @throws IOException 找不到zip文件时
	 */
	private ProcessDefinition deploySingleProcess(ResourceLoader resourceLoader, String processKey, String exportDir)
			throws IOException {
		String classpathResourceUrl = "classpath:/deployments/" + processKey + ".zip";
		log.debug("read com.blueland.bpm.engine from: {}", classpathResourceUrl);
		Resource resource = resourceLoader.getResource(classpathResourceUrl);
		InputStream inputStream = resource.getInputStream();
        inputStream.read();
		if (null == inputStream || inputStream.available() == 0) {
			log.warn("ignore deploy com.blueland.bpm.engine module: {}", classpathResourceUrl);
			return null;
		}
		log.debug("finded com.blueland.bpm.engine module: {}, deploy it!", classpathResourceUrl);
		ZipInputStream zis = new ZipInputStream(inputStream);
		Deployment deployment = repositoryService.createDeployment().addZipInputStream(zis).name(processKey + ".bar")
				.deploy();

		// export diagram
		List<ProcessDefinition> list = repositoryService.createProcessDefinitionQuery().deploymentId(deployment.getId())
				.list();
		return list.get(0);
	}

    /**
     * 转换ProcessDefinitionModel
     *
     * @param processDefinitions
     * @return
     */
    private Map<String, ProcessDefinitionModel> convertToProcessDefinitionModelMap(List<ProcessDefinition> processDefinitions) {
        Map<String, ProcessDefinitionModel> processDefinitionModelMap = new HashMap<String, ProcessDefinitionModel>();
        for (ProcessDefinition processDefinition : processDefinitions) {
            processDefinitionModelMap.put(processDefinition.getId(), ProcessDefinitionModel.build(processDefinition));
        }
        return processDefinitionModelMap;
    }

    /**
     * 获取流程起草任务环节
     *
     * @param processDefinitionId
     * @return
     */
    @Override
    public ActivityDefinitionModel getStartActivity(String processDefinitionId) {
        ReadOnlyProcessDefinition rpd = this.getDeployedProcessDefinition(processDefinitionId);
        PvmActivity pvmActivity = rpd.getInitial();
        PvmTransition pvmTransition = pvmActivity.getOutgoingTransitions().get(
                0);
        PvmActivity pvmStartActivity = pvmTransition.getDestination();
        return ActivityDefinitionModel.build(pvmStartActivity);
    }


    @Override
    public List<ActivityResourceModel> getActivityUserTree(String processInstId, String processDefinitionId, String curActInstId,
                                                           String curActivityId, String destActivityId, String userId, String userOrgId, List<String> filterIds, Map conditionMap) {
        List<ActivityResourceModel> activityResources = processDefinitionResource.getNextActivityUser(processInstId, processDefinitionId, curActInstId, curActivityId, destActivityId, userId, filterIds, conditionMap);
        return activityResources;
    }

    @Override
    public List<ActivityDefinitionModel> getNextActivity(String processInstId,
                                                         String processDefinitionId, String activityId, Map conditionMap) {
        List<ActivityDefinitionModel> activityDefinitionModels = processDefinitionResource
                .getNextActivity(processDefinitionId, activityId, processInstId, conditionMap);
        return activityDefinitionModels;
    }

    @Override
    public List<ActivityResourceModel> getResource(String procDefId, String actDefId) {
        return processDefinitionResource.getResource(procDefId, actDefId);
    }

    @Override
    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public boolean delete(String procDefId, String deploymentId, boolean cascade) {
        boolean result = false;
        try {
            getRepositoryService().deleteDeployment(deploymentId, cascade);
            processConfigService.deleteProcessInfoConfig(procDefId);
            result = true;
        } catch (Exception e) {
            log.warn("", e);
        }
        try {
            if (result) {
                processInfoConfigManager.recoverProcessInfoConfig(procDefId);
            }
        } catch (Exception e) {
            log.warn("", e);
        }
        return result;
    }

    /**
     * 加载流程定义的bpmn.xml或图片资源
     *
     * @param processDefinitionId 流程定义ID
     * @param resourceType        image:图片资源,xml:bpmn.xml
     * @return InputStream
     */
    @Override
    public InputStream loadProcessResource(String processDefinitionId,
                                           String resourceType) {
        InputStream resourceAsStream = null;
        try {
            ProcessDefinition processDefinition = repositoryService
                    .createProcessDefinitionQuery()
                    .processDefinitionId(processDefinitionId).singleResult();
            if (processDefinition == null) {
                throw new IllegalArgumentException(String.format("流程定义ID[%s]不存在", processDefinitionId));
            }
            String resourceName = "";
            if ("image".equals(resourceType)) {
                resourceName = processDefinition.getDiagramResourceName();
            } else if ("xml".equals(resourceType)) {
                resourceName = processDefinition.getResourceName();
            }
            resourceAsStream = repositoryService.getResourceAsStream(
                    processDefinition.getDeploymentId(), resourceName);
        } catch (Exception e) {
            log.warn("获取流程定义的bpmn.xml或图片资源出现异常", e);
        }
        return resourceAsStream;
    }

    @Override
    public String loadProcessXml(String processDefinitionId) {
        InputStream in = loadProcessResource(processDefinitionId, "xml");
        String bpmnXml = "";
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            org.apache.commons.io.IOUtils.copy(in, out);
            bpmnXml = out.toString("UTF-8");
        } catch (Exception e) {
            log.warn("获取流程定义的bpmn.xml出现异常", e);
        } finally {
            try {
                in.close();
                out.close();
            } catch (IOException e) {
                log.warn("", e);
            }
        }
        return bpmnXml;
    }

    /**
     * @description 流程失效通知
     * @author hanj
     * @param userId userId
     * @updateTime 2021/11/19
     */
    @Override
    public void processInvalidNotice(String userId){
        // 查询该审核员对应的审核策略
        List<DocShareStrategyAuditor> auditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                .eq(DocShareStrategyAuditor::getUserId, userId));
        List<String> strategyIdList = auditorList.stream().map(DocShareStrategyAuditor::getAuditStrategyId).collect(Collectors.toList());
        List<DocShareStrategy> strategyList = docShareStrategyService.listByIds(strategyIdList);

        // 环节的审核员被全部删除则处理发送流程失效消息
        List<DocShareStrategy> disStrategyList = new ArrayList<>();
        for (DocShareStrategy strategy : strategyList) {
            List<DocShareStrategyAuditor> existAuditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                    .eq(DocShareStrategyAuditor::getAuditStrategyId,strategy.getId()));
            if(existAuditorList.size() > 1){
                continue;
            }
            disStrategyList.add(strategy);
        }


        // 根据审核策略找出流程定义id集合
        List<String> procDefIdList = disStrategyList.stream().map(DocShareStrategy::getProcDefId).collect(Collectors.toList());
        List<String> procDefIdCollect = procDefIdList.stream().distinct().collect(Collectors.toList());
        List<Map<String, Object>> procDefKeyMapList = new ArrayList<>();
        for (String procDefId : procDefIdCollect) {
            Map<String, Object> map = Maps.newHashMap();
            ProcessInfoConfig processInfoConfig = processConfigService.getProcessInfoConfig(procDefId);
            map.put("processType", processInfoConfig.getProcessTypeId());
            map.put("processDefKey", processInfoConfig.getProcessDefKey());
            procDefKeyMapList.add(map);
        }

        Map<String, List<Map>> resultMap = procDefKeyMapList.stream().collect(Collectors.groupingBy(it -> String.valueOf(it.get("processType"))));
        resultMap.forEach((k,v)->{
            List<String> procDefKeyList = v.stream().map(p -> String.valueOf(p.get("processDefKey"))).collect(Collectors.toList());
            // 发送NSQ-流程定义失效效通知
            processNsqMessage(NsqConstants.CORE_PROC_DEF_INVALID, "auditor", procDefKeyList,null);
        });
    }

    @Override
    public void enableProcessDef(String procDefId){
        ProcessInfoConfig updateInfoConfig = new ProcessInfoConfig();
        updateInfoConfig.setProcessDefId(procDefId);
        updateInfoConfig.setProcessMgrIsshow("Y");
        processInfoConfigManager.updateById(updateInfoConfig);
    }

    /**
     * @description 流程生效通知
     * @author hanj
     * @param processDefId processDefId
     * @param strategyList strategyList
     * @updateTime 2021/11/19
     */
    private void processEffectNotice(String processDefId, List<DocShareStrategy> strategyList){
        boolean check = true;
        for (DocShareStrategy strategy : strategyList) {
            List<DocShareStrategyAuditor> auditorList = strategy.getAuditorList();
            if(auditorList.size() == 0){
                check = false;
                break;
            }
        }
        if(check){
            ProcessInfoConfig processInfoConfig = processConfigService.getProcessInfoConfig(processDefId);
            List<String> procDefKeyList = new ArrayList<>();
            procDefKeyList.add(processInfoConfig.getProcessDefKey());
            // 发送NSQ-流程定义生效通知
            processNsqMessage(NsqConstants.CORE_PROC_DEF_EFFECT, "auditor", procDefKeyList,null);
        }
    }

    /**
     * @description 发送流程有效性nsq通知
     * @author hanj
     * @param topic topic
     * @param procDefKeyList procDefKeyList
     * @updateTime 2021/11/19
     */
    private void processNsqMessage(String topic, String type, List<String> procDefKeyList, String userId){
        List<ProcessInfoConfig> processInfoConfigList = processConfigService.getBatchProcessInfoByKey(procDefKeyList);
        Map<String, List<ProcessInfoConfig>> processInfoConfigMap = processInfoConfigList.stream().collect(Collectors.groupingBy(ProcessInfoConfig::getProcessTypeId));
        for (String processTypeId : processInfoConfigMap.keySet()) {
            List<ProcessInfoConfig> processList = processInfoConfigMap.get(processTypeId);
            List<String> procDefKeys = processList.stream().map(ProcessInfoConfig::getProcessDefKey).collect(Collectors.toList());
            Map<String, Object> nsqMap = Maps.newHashMap();
            nsqMap.put("type", type);
            nsqMap.put("proc_type", processTypeId);
            nsqMap.put("proc_def_keys", procDefKeys);
            nsqMap.put("userId", userId);
            nsqSenderService.sendMessage(topic, JSONUtil.toJsonStr(nsqMap));
        }
    }

    /**
     * @description 发送流程有效性nsq通知
     * @author hanj
     * @param procDefKeyList procDefKeyList
     * @updateTime 2021/11/19
     */
    private void processDelNsqMessage(List<String> procDefKeyList){
        List<ProcessInfoConfig> processInfoConfigList = processConfigService.getBatchProcessInfoByKey(procDefKeyList);
        Map<String, List<ProcessInfoConfig>> processInfoConfigMap = processInfoConfigList.stream().collect(Collectors.groupingBy(ProcessInfoConfig::getProcessTypeId));
        for (String processTypeId : processInfoConfigMap.keySet()) {
            List<ProcessInfoConfig> processList = processInfoConfigMap.get(processTypeId);
            List<String> procDefKeys = processList.stream().map(ProcessInfoConfig::getProcessDefKey).collect(Collectors.toList());
            Map<String, Object> nsqMap = Maps.newHashMap();
            nsqMap.put("proc_def_keys", procDefKeys);
            nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_PROC_DELETE + "." + WorkflowConstants.PROCESS_CATEGORY.getAuditType(processTypeId), JSONUtil.toJsonStr(nsqMap));
        }
    }

    /**
     * @description 发送流程定义名称变更nsq通知
     * @author xiashenghui
     * @param topic topic
     * @param procType procType
     * @param procDefKey procDefKey
     * @param newName newName
     * @updateTime 2021/11/19
     */
    private void modifyNsqMessage(String topic,String procType , String procDefKey , String newName){
        Map<String, Object> nsqMap = Maps.newHashMap();
        nsqMap.put("proc_type", procType);
        nsqMap.put("proc_def_key", procDefKey);
        nsqMap.put("new_name", newName);
        nsqSenderService.sendMessage(topic, JSONUtil.toJsonStr(nsqMap));
    }

    /**
     * @description 获取流程定义集合权限判断（true查询所有，false查询自己创建的流程）
     * @author hanj
     * @param roles roles
     * @updateTime 2021/11/12
     */
    private boolean checkRole(String roles){
        if(StrUtil.isBlank(roles)){
            return true;
        }
        List<String> roleIdList = Arrays.asList(roles.split(","));
        // 判断超级管理员
        boolean isSuperAdmin = roleIdList.stream().filter(role -> role.equals(WorkflowConstants.SUPER_ADMIN_ROLE)).findAny().isPresent();
        if(isSuperAdmin){
            return true;
        }
        // 判断安全管理员
        boolean isSecurityAdmin = roleIdList.stream().filter(role -> role.equals(WorkflowConstants.SECURITY_ADMIN_ROLE)).findAny().isPresent();
        if(isSecurityAdmin){
            return true;
        }
        // 判断组织管理员
        boolean isOrganizationAdmin = roleIdList.stream().filter(role -> role.equals(WorkflowConstants.ORGANIZATION_ADMIN_ROLE)).findAny().isPresent();
        if(isOrganizationAdmin){
            return false;
        }
        return true;
    }

        
    /**
     * @description 异步通知审核流程节点是否更新
     * @author siyu.chen
     * @param shareStrategyList shareStrategyList
     * @param procDefId procDefId
     * @updateTime 2024/4/29
     */
    private void asyncHandleUpdateProcDef(List<DocShareStrategy> shareStrategyList, List<String> oldActDefIds, String opType, String procDefId){
        Runnable run = () -> {
            try {
                List<String> curActDefIds = shareStrategyList.stream().map(DocShareStrategy::getActDefId).distinct().collect(Collectors.toList());
                Boolean needRevocation = opType.equals("update") && !curActDefIds.containsAll(oldActDefIds);
                if (!needRevocation) {
                    return;
                }
                Map<String, Object> nsqMap = Maps.newHashMap();
                nsqMap.put("proc_def_id", procDefId);
                nsqSenderService.sendMessage(NsqConstants.CORE_PROC_DEF_MODIFY, JSONUtil.toJsonStr(nsqMap));
            } catch (Exception e) {
                log.warn("",e);
            }
        };
        executor.execute(run);
    }


    public void asynDeleteProcessDefinitionLog(List<ProcessInfoConfig> processInfoConfigList, LogBaseDTO logBaseDTO){
        Runnable run = () -> {
            try {
                for (ProcessInfoConfig processInfoConfig : processInfoConfigList) {
                    List<DocShareStrategy> strategyList = docShareStrategyService.getDocStrategy(processInfoConfig.getProcessDefId());
                    processDefinitionServiceImpl.deleteProcessDefinitionLog(processInfoConfig, strategyList, logBaseDTO);
                }
            } catch (Exception e) {
                log.warn("",e);
            }
        };
        executor.execute(run);
    }

    @OperationLog(title = OperationLogConstants.DELETE_PROCESS_DEFINITION_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void deleteProcessDefinitionLog(ProcessInfoConfig processInfoConfig, List<DocShareStrategy> strategyList, LogBaseDTO logBaseDTO){
    }

}