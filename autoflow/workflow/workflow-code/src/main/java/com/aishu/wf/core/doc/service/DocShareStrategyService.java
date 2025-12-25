package com.aishu.wf.core.doc.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;

import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.dao.DocShareStrategyAuditorMapper;
import com.aishu.wf.core.doc.dao.DocShareStrategyMapper;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.aishu.wf.core.doc.model.dto.CheckDocShareStrategyDTO;
import com.aishu.wf.core.doc.model.dto.ContivuousMultilevelDTO;
import com.aishu.wf.core.doc.model.dto.ShareStrategyDTO;
import com.aishu.wf.core.doc.strategy.impl.AuditorStrategyContext;
import com.aishu.wf.core.doc.strategy.impl.StrategyUtils;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.service.ActivityInfoConfigManager;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleDTO;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.HistoricTaskInstanceQueryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.annotation.Nonnull;
import javax.annotation.Resource;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DocShareStrategyService extends ServiceImpl<DocShareStrategyMapper, DocShareStrategy> {

    @Resource
    private DocShareStrategyMapper docShareStrategyMapper;

    @Resource
    private DocShareStrategyAuditorMapper docShareStrategyAuditorMapper;

    @Autowired
    private ActivityInfoConfigManager activityInfoConfigManager;

    @Resource
    private DocShareStrategyAuditorService docShareStrategyAuditorService;

    @Autowired
    private UserService userService;

    @Autowired
    private DocShareStrategyService docShareStrategyService;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    @Autowired
    private ProcessDefinitionService processDefinitionService;

    @Autowired
    private DeptAuditorRuleService deptAuditorRuleService;

    @Autowired
    private ProcessInstanceService processInstanceService;

    @Autowired
    DocShareStrategyConfigService docShareStrategyConfigService;

    @Autowired
    private AuditorStrategyContext auditorStrategyContext;

    @Autowired
    private StrategyUtils strategyUtils;

    public Page<DocShareStrategy> findPage(Page<DocShareStrategy> page, DocShareStrategy query) {
        return docShareStrategyMapper.selectPage(page, Wrappers.query(query));
    }

    public Integer update(DocShareStrategy entity) {
        return docShareStrategyMapper.updateById(entity);
    }

    /**
     * @description 获取审核策略分页数据
     * @author hanj
     * @param queryDTO queryDTO
     * @updateTime 2021/7/2
     */
    public IPage<DocShareStrategy> findDocShareStrategyPage(ShareStrategyDTO queryDTO){
        IPage<DocShareStrategy> pageResult = docShareStrategyMapper.findDocShareStrategyPage(new Page<>(queryDTO.getOffset(),
                queryDTO.getLimit()), queryDTO.getProc_def_id(), queryDTO.getDoc_names(), queryDTO.getDoc_type(), queryDTO.getAuditors());
        List<DocShareStrategy> list = pageResult.getRecords();
        List<String> strategyIdList = new ArrayList<>();
        if(list.size() == 0){
            return pageResult;
        }
        list.forEach(e -> {
            strategyIdList.add(e.getId());
        });
        List<DocShareStrategyAuditor> allAuditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                .in(DocShareStrategyAuditor::getAuditStrategyId, strategyIdList).orderByAsc(DocShareStrategyAuditor::getAuditSort));
        list.forEach(e -> {
            List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
            String auditorNames = "";
            int level = 1;
            for(DocShareStrategyAuditor auditor : allAuditorList){
                if(e.getId().equals(auditor.getAuditStrategyId())){
                    auditorList.add(auditor);
                    if(StrUtil.isNotBlank(auditorNames)){
                        auditorNames += "、" + auditor.getUserName() + "（" +  auditor.getUserCode() + "）";
                    } else {
                        auditorNames = auditor.getUserName() + "（" +  auditor.getUserCode() + "）";
                    }
                    level++;
                }
            }
            e.setAuditorList(auditorList);
            e.setAuditorNames(auditorNames);
        });
        pageResult.setRecords(list);
        return pageResult;
    }

    /**
     * @description 根据文档库id删除审核策略
     * @author hanj
     * @param docId docId
     * @updateTime 2021/7/2
     */
    public void deleteDocShareStrategyByDocId(String docId) {
        List<DocShareStrategy> list = docShareStrategyMapper.selectList(
                new LambdaQueryWrapper<DocShareStrategy>().eq(DocShareStrategy::getDocId, docId));
        list.forEach(e -> {
            docShareStrategyAuditorMapper.delete(
                    new LambdaQueryWrapper<DocShareStrategyAuditor>().eq(DocShareStrategyAuditor::getAuditStrategyId, e.getId()));
        });
        docShareStrategyMapper.delete(
                new LambdaQueryWrapper<DocShareStrategy>().eq(DocShareStrategy::getDocId, docId));
    }

    /**
     * @description 根据流程定义id删除审核策略
     * @author hanj
     * @param procDefId procDefId
     * @updateTime 2021/7/2
     */
    public void deleteDocShareStrategyByProcDefId(String procDefId) {
        List<DocShareStrategy> list = docShareStrategyMapper.selectList(
                new LambdaQueryWrapper<DocShareStrategy>().eq(DocShareStrategy::getProcDefId, procDefId));
        list.forEach(e -> {
            docShareStrategyAuditorMapper.delete(
                    new LambdaQueryWrapper<DocShareStrategyAuditor>().eq(DocShareStrategyAuditor::getAuditStrategyId, e.getId()));
        });
        docShareStrategyMapper.delete(
                new LambdaQueryWrapper<DocShareStrategy>().eq(DocShareStrategy::getProcDefId, procDefId));
    }

    /**
     * 根据流程定义ID、环节定义ID、文档ID，查找审核人员列表
     *
     * @param procDefId   流程定义ID
     * @param actDefId    环节定义ID
     * @param docId       文档ID（结构：gns://文档库id/..目录ID../文件ID）
     * @param docLibType  文档库类型
     * @param docCsfLevel 文档库密级
     * @param docUserId   文档所属用户ID
     * @return
     */
    public List<DocShareStrategyAuditor> getDocAuditorList(String procDefId, String actDefId, String docId, String docLibType,
    @Nonnull Integer docCsfLevel, String docUserId, String procInstId, String repeatAuditType) throws Exception {
        return this.getDocAuditorList( procDefId,  actDefId,  docId,  docLibType, docCsfLevel,  docUserId,  procInstId,  repeatAuditType, new HashMap<>());
    }

    @SuppressWarnings("unchecked")
    public List<DocShareStrategyAuditor> getDocAuditorList(String procDefId, String actDefId, String docId, String docLibType,
                                                           @Nonnull Integer docCsfLevel, String docUserId, String procInstId, String repeatAuditType, Map<String, Object> fields) throws Exception {
        List<DocShareStrategyAuditor> result = new ArrayList<>();
        ProcessDefinitionModel processDefinitionModel = processDefinitionService.getProcessDef(procDefId);
        try {
            String ownAuditorType = "";
            // 适配新的共享审核,通过申请类型+流程定义key来区分新的申请类型,原流程定义key为Process_SHARE001、Process_SHARE002
            String procDefKey = processDefinitionModel.getProcDefKey();
            if(WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(processDefinitionModel.getCategory()) &&
                (procDefKey.equals("Process_SHARE001") || procDefKey.equals("Process_SHARE002"))){
                String docLibId = DocConstants.USER_DOC_LIB.equals(docLibType) ? docUserId : strategyUtils.getDocLibId(docId);
                // 根据文档库id查找共享审核策略
                List<DocShareStrategy> docShareStrategyList = this.getDocShareStrategy(procDefId, actDefId, docLibId);
                if (CollUtil.isEmpty(docShareStrategyList)) {
                    throw new WorkFlowException(ExceptionErrorCode.S0001, ExceptionErrorCode.S0001.getErrorDesc());
                }

                ownAuditorType = docShareStrategyList.get(0).getOwnAuditorType();
                // 根据文档共享审核策略过滤共享审核员
                result = this.filterAuditorByStrategy(docShareStrategyList, docLibId, docLibType);
                if (CollUtil.isEmpty(result)) {
                    throw new WorkFlowException(ExceptionErrorCode.S0002, ExceptionErrorCode.S0002.getErrorDesc());
                }
            } else {
                List<DocShareStrategy> docShareStrategyList = this.getDocStrategy(procDefId, actDefId);
                if (CollUtil.isEmpty(docShareStrategyList)) {
                    throw new WorkFlowException(ExceptionErrorCode.S0001, ExceptionErrorCode.S0001.getErrorDesc());
                }
                DocShareStrategy docShareStrategy = docShareStrategyList.get(0);
                String strategyType = docShareStrategy.getStrategyType();
                ownAuditorType = docShareStrategy.getOwnAuditorType();
                
                // 使用 AuditorStrategyContext 执行策略
                result = auditorStrategyContext.executeStrategy(strategyType, docShareStrategy, procDefId, docUserId, fields);
            }

            // 去重重复元素，防止创建重复的审核记录，导致服务不可用
            result = result.stream().distinct().collect(Collectors.toList());
            // 查找审核员的用户信息
            List<String> userIdList = result.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
            List<User> userList = userService.getUserList(userIdList);

            // 过滤禁用的审核员
            result = this.filterAuditorByEnabled(result, userList);
            if (CollUtil.isEmpty(result)) {
                throw new WorkFlowException(ExceptionErrorCode.S0002, ExceptionErrorCode.S0002.getErrorDesc());
            }

            // 4.0版本增加"审核员与发起人为同一人时自动通过/自动拒绝"配置，不包括文档共享
            if(WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(processDefinitionModel.getCategory()) || result.size() > 1) {
            	// 不能审核自己发起流程
                result = this.filterShareAuditor(result, docUserId, ownAuditorType);
                if (CollUtil.isEmpty(result)) {
                    throw new WorkFlowException(ExceptionErrorCode.S0003, ExceptionErrorCode.S0003.getErrorDesc());
                }
            }

            // 根据文档密级过滤共享审核员
            result = this.filterAuditorByCsfLevel(result, docCsfLevel, userList, processDefinitionModel.getCategory());
            if (CollUtil.isEmpty(result)) {
                throw new WorkFlowException(ExceptionErrorCode.S0004, ExceptionErrorCode.S0004.getErrorDesc());
            }
            
            // 当同一审核员重复审核同一申请时，是否允许重复审核
            result = this.filterRepeatAuditor(procDefId, procInstId, result, repeatAuditType);
            if (CollUtil.isEmpty(result)) {
                throw new WorkFlowException(ExceptionErrorCode.S0005, ExceptionErrorCode.S0005.getErrorDesc());
            }

        } catch (WorkFlowException we) {
            log.warn("未查找到审核员！异常信息为：" + we.getMessage() + "入参为：procDefId={}，actDefId={}，docId={}，docLibType={}，docCsfLevel={}，docUserId={}，procInstId={}",
                    procDefId, actDefId, docId, docLibType, docCsfLevel, docUserId, procInstId);
            throw we;
        } catch (Exception e) {
            log.warn("查找审核人员列表失败！异常为：" + e.getMessage() + "入参为：procDefId={}，actDefId={}，docId={}，docLibType={}，docCsfLevel={}，docUserId={}，procInstId={}",
                    procDefId, actDefId, docId, docLibType, docCsfLevel, docUserId, procInstId, e);
            throw e;
        }

        return result;
    }

    /**
     * 过滤掉共享流程发起人是审核员的数据
     *
     * @param auditorList   共享审核员集合
     * @param starterUserId 发起人用户ID
     * @return 审核员ID集合
     */
    private List<DocShareStrategyAuditor> filterShareAuditor(List<DocShareStrategyAuditor> auditorList, String starterUserId, String ownAuditorType) {
        // 如果ownAuditorType为自己审自己，则不对列表进行过滤
        if (StrUtil.isNotBlank(ownAuditorType) && ownAuditorType.equals("self_audit")){
            return auditorList;
        }
        return auditorList.stream().filter(item -> !item.getUserId().equals(starterUserId))
                .collect(Collectors.toList());
    }

    /**
     * 当同一审核员重复审核同一申请时，是否允许重复审核
     * @author ouandyang
     * @param procInstId	流程实例ID
     * @param assigneeList	审核员ID集合
     * @return 审核员ID集合
     */
    public List<DocShareStrategyAuditor> filterRepeatAuditor(String procDefId, String procInstId, List<DocShareStrategyAuditor> assigneeList, String repeatAuditType) {
        List<DocShareStrategyAuditor> result = Lists.newArrayList();
        if(null == repeatAuditType) {
            repeatAuditType = docShareStrategyService.getRepeatAuditType(procDefId);
        }
        // 只能审核一次
        if (WorkFlowContants.REPEAT_AUDIT_RULE_ONCE.equals(repeatAuditType) && StrUtil.isNotBlank(procInstId)) {
            HistoricTaskInstanceQueryImpl query = new HistoricTaskInstanceQueryImpl();
            query.processInstanceId(procInstId);

            List<HistoricTaskInstance> historyTasks = processInstanceService.getHistoryTaskList(procInstId);
            for(DocShareStrategyAuditor auditor : assigneeList) {
                boolean isExist = historyTasks.stream().filter(his -> null != his.getAssignee() && his.getAssignee().equals(auditor.getUserId()) && "completed".equals(his.getDeleteReason())).findAny().isPresent();
                if(!isExist) {
                    result.add(auditor);
                }
            }
        } else {
            result = assigneeList;
        }
        return result;
    }

    /**
     * @description 获取共享审核策略
     * @author hanj
     * @param procDefId procDefId
     * @param actDefId actDefId
     * @param docLibId docLibId
     * @updateTime 2021/7/22
     */
    private List<DocShareStrategy> getDocShareStrategy(String procDefId, String actDefId, String docLibId){
        return strategyUtils.getDocShareStrategy(procDefId, actDefId, docLibId);
    }

    /**
     * @description 获取审核策略
     * @author hanj
     * @param procDefId procDefId
     * @param actDefId actDefId
     * @updateTime 2021/8/23
     */
    private List<DocShareStrategy> getDocStrategy(String procDefId, String actDefId){
        return strategyUtils.getDocStrategy(procDefId, actDefId);
    }

    /**
     * @description 获取审核策略
     * @author hanj
     * @param procDefId procDefId
     * @updateTime 2021/8/23
     */
    public List<DocShareStrategy> getDocStrategy(String procDefId){
        return strategyUtils.getDocStrategy(procDefId);
    }

    public DocShareStrategy queryDocShareStrategy(String procDefId, String actDefId, String docId, String docUserId,
                                                  String docLibType) throws Exception {
        return strategyUtils.queryDocShareStrategy(procDefId, actDefId, docId, docUserId, docLibType);
    }

    public List<ContivuousMultilevelDTO> queryContinuousMultilevelStrategy(String procDefId, String actDefId, String docUserId){
        return strategyUtils.queryContinuousMultilevelStrategy(procDefId, actDefId, docUserId);
    }

    public String queryNoAuditorType(String procDefId, String actDefId, Integer docCsfLevel, String docUserId, String procInstId, DocShareStrategy docShareStrategy) throws Exception {
        return queryNoAuditorType( procDefId,  actDefId,  docCsfLevel,  docUserId,  procInstId,  docShareStrategy,  new HashMap<>());
    }
    /**
     * @description 查询未匹配到部门审核员类型，自动拒绝：auto_reject；自动通过：auto_pass;（用于引擎获取自动审核处理类型）
     * @author hanj
     * @param procDefId 流程定义ID
     * @param actDefId 环节定义ID
     * @updateTime 2021/8/2
     */
    public String queryNoAuditorType(String procDefId, String actDefId, Integer docCsfLevel, String docUserId, String procInstId, DocShareStrategy docShareStrategy, Map<String, Object> fields) throws Exception {
        if("EndEvent_1wqgipp".equals(actDefId)){
            return null;
        }
        List<DocShareStrategy> docShareStrategyList = this.getDocStrategy(procDefId, actDefId);
        String noAuditorType = docShareStrategyList.size() > 0 ? docShareStrategyList.get(0).getNoAuditorType() : null;
        String ownAuditorType = docShareStrategyList.size() > 0 ? docShareStrategyList.get(0).getOwnAuditorType() : null;
        String repeatAuditType = null != docShareStrategy ? docShareStrategy.getRepeatAuditType() : null;
        try {
            List<DocShareStrategyAuditor> auditorList = getDocAuditorList(procDefId, actDefId, null,
                    null, docCsfLevel, docUserId, procInstId, repeatAuditType,fields);
            if(auditorList.size() > 0){
            	// 判断审核员与发起人为同一人时，审核类型，自动拒绝：auto_reject；自动通过：auto_pass
            	List<DocShareStrategyAuditor> ownAuditorList = auditorList.stream().filter(item -> !item.getUserId().equals(docUserId)).collect(Collectors.toList());
                if(ownAuditorList.size() > 0) {
                	return null;
                } else {
                	return null != docShareStrategy ? docShareStrategy.getOwnAuditorType() : ownAuditorType;
                }
            }
        } catch (Exception e) {
        }
        return null != docShareStrategy ? docShareStrategy.getNoAuditorType() : noAuditorType;
    }

    /**
     * @description 过滤禁用的审核员
     * @author ouandyang
     * @param  list 审核员
     * @updateTime 2021/7/12
     */
    public List<DocShareStrategyAuditor> filterAuditorByEnabled(List<DocShareStrategyAuditor> list, List<User> userList) throws Exception {
        List<DocShareStrategyAuditor> result = new ArrayList<DocShareStrategyAuditor>();
        for (DocShareStrategyAuditor item : list) {
            List<User> findUserList = userList.stream().filter(u -> u.getUserId()
                    .equals(item.getUserId())).collect(Collectors.toList());
            boolean flag = findUserList.size() > 0 ? findUserList.get(0).getEnabled() : false;
            if (flag) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * 根据文档共享审核策略过滤共享审核员
     *
     * @param docShareStrategyList 审核策略集合
     * @param docLibId     文档库ID
     * @param docLibType  文档库类型
     * @return
     */
    public List<DocShareStrategyAuditor> filterAuditorByStrategy(List<DocShareStrategy> docShareStrategyList, String docLibId,
                                                                 String docLibType) throws Exception {
        List<DocShareStrategyAuditor> resultList = Lists.newArrayList();
        // 1.根据文档库id查找是否有对应的审核策略，若有，则返回对应的审核人员列表
        for (DocShareStrategy docShareStrategy : docShareStrategyList) {
            String strategyDocId = docShareStrategy.getDocId();
            if (StrUtil.isBlank(strategyDocId) || DocConstants.ALL_USER_DOC_LIB.equals(strategyDocId)
                    || DocConstants.ALL_DEPARTMENT_DOC_LIB.equals(strategyDocId) || DocConstants.ALL_CUSTOM_DOC_LIB.equals(strategyDocId)) {
                continue;
            }
            if (strategyDocId.equals(docLibId)) {
                List<DocShareStrategyAuditor> auditorList = strategyUtils.getAuditors(docShareStrategy.getId());
                resultList.addAll(auditorList);
                break;
            }
        }

        if(resultList.size() > 0){
            return resultList;
        }

        // 2.根据文档库id未查找到对应的审核策略，则该文档库类型下是否配置所有文档库，若配置，则返回所有文档库对于的审核员
        if (DocConstants.USER_DOC_LIB.equals(docLibType)) {
            //查找是否配置所有个人文档库
            List<DocShareStrategy> allUserDocLibList = docShareStrategyList.stream().filter(strategy ->
                    strategy.getDocId().equals(DocConstants.ALL_USER_DOC_LIB)).collect(Collectors.toList());
            return allUserDocLibList.size() > 0 ? strategyUtils.getAuditors(allUserDocLibList.get(0).getId()) : resultList;
        } else if(DocConstants.DEPARTMENT_DOC_LIB.equals(docLibType)) {
            //查找是否配置所有部门文档库
            List<DocShareStrategy> allDepartmentDocLibList = docShareStrategyList.stream().filter(strategy ->
                    strategy.getDocId().equals(DocConstants.ALL_DEPARTMENT_DOC_LIB)).collect(Collectors.toList());
            return allDepartmentDocLibList.size() > 0 ? strategyUtils.getAuditors(allDepartmentDocLibList.get(0).getId()) : resultList;
        } else if(DocConstants.CUSTOM_DOC_LIB.equals(docLibType)) {
            //查找是否配置所有自定义文档库
            List<DocShareStrategy> allCustomDocLibList = docShareStrategyList.stream().filter(strategy ->
                    strategy.getDocId().equals(DocConstants.ALL_CUSTOM_DOC_LIB)).collect(Collectors.toList());
            return allCustomDocLibList.size() > 0 ? strategyUtils.getAuditors(allCustomDocLibList.get(0).getId()) : resultList;
        }

        return resultList;
    }

    /**
     * 根据文档密级过滤共享审核员
     * @param auditorList 审核员集合
     * @param docCsfLevel 文档密级
     * @return
     */
    private List<DocShareStrategyAuditor> filterAuditorByCsfLevel(List<DocShareStrategyAuditor> auditorList,
                                                                  Integer docCsfLevel, List<User> userList,String category) {
        List<DocShareStrategyAuditor> result = Lists.newArrayList();
        for (DocShareStrategyAuditor item : auditorList) {
            List<User> findUserList = userList.stream().filter(u -> u.getUserId()
                    .equals(item.getUserId())).collect(Collectors.toList());
            // 比较审核员密级和文档密级，如果审核员密级大于或等于文档的密级，才能够进行审核
            boolean flag = findUserList.size() > 0 ? docCsfLevel.compareTo(findUserList.get(0).getCsfLevel()) <= 0 : false;
            if (flag) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * @description 保存审核策略
     * @author hanj
     * @param  procDefId
     * @param procDefName
     * @param userId
     * @param shareStrategyList
     * @updateTime 2021/5/20
     */
    public void saveDocAuditStrategy(String procDefId, String procDefName, String userId,
                                     List<DocShareStrategy> shareStrategyList, boolean recordLog,String tenantId) {
        Date now = new Date();
        List<DocShareStrategy> docShareStrategyList = new ArrayList<>();
        List<DocShareStrategyAuditor> docShareStrategyAuditorList = new ArrayList<>();
        List<DocShareStrategyConfig> docShareStrategyConfigList = new ArrayList<>();
        for(DocShareStrategy shareStrategy : shareStrategyList){
            shareStrategy.setId(UUID.randomUUID().toString());
            shareStrategy.setProcDefId(procDefId);
            shareStrategy.setProcDefName(procDefName);
            shareStrategy.setCreateTime(now);
            shareStrategy.setCreateUserId(userId);
            // xiashenghui bengin
            // 当前控制台创建的都是对应功能的流程，可去除此逻辑
            // if(!CommonConstants.TENANT_AS_WORKFLOW.equals(tenantId) && WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(shareStrategy.getStrategyType())){
            if(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(shareStrategy.getStrategyType()) ||
                WorkflowConstants.STRATEGY_TYPE.MULTILEVEL.getValue().equals(shareStrategy.getStrategyType())){
                DeptAuditorRuleRoleDTO deptAuditorRuleRoleDTO = new DeptAuditorRuleRoleDTO();
                deptAuditorRuleRoleDTO.setRule_id(shareStrategy.getRuleId());
                deptAuditorRuleRoleDTO.setDept_auditor_rule_list(shareStrategy.getDept_auditor_rule_list());
                deptAuditorRuleRoleDTO.setRule_name("");
                deptAuditorRuleRoleDTO.setTenant_id(userId);
                shareStrategy.setRuleId(deptAuditorRuleService.saveDeptAuditorRule(deptAuditorRuleRoleDTO, userId));
            }
            // xiashenghui end

            List<DocShareStrategyAuditor> auditorList = convertDocAuditStrategyAuditor(shareStrategy.getAuditorList(),
                    shareStrategy.getId(), userId);

            if (StrUtil.isNotBlank(shareStrategy.getSendBackSwitch())) {
                DocShareStrategyConfig docShareStrategyConfig = DocShareStrategyConfig.builder()
                        .id(UUID.randomUUID().toString())
                        .procDefId(procDefId)
                        .actDefId(shareStrategy.getActDefId())
                        .name("sendBackSwitch")
                        .value(shareStrategy.getSendBackSwitch())
                        .build();
                docShareStrategyConfigList.add(docShareStrategyConfig);
            }
            docShareStrategyAuditorList.addAll(auditorList);
            docShareStrategyList.add(shareStrategy);
            if(docShareStrategyList.size() == 200){
                docShareStrategyAuditorService.saveBatch(docShareStrategyAuditorList);
                docShareStrategyService.saveBatch(docShareStrategyList);
                docShareStrategyConfigService.saveBatch(docShareStrategyConfigList);
                docShareStrategyAuditorList = new ArrayList<>();
                docShareStrategyList = new ArrayList<>();
                docShareStrategyConfigList = new ArrayList<>();
            }

        }
        if(docShareStrategyList.size() < 200){
            docShareStrategyAuditorService.saveBatch(docShareStrategyAuditorList);
            docShareStrategyService.saveBatch(docShareStrategyList);
            docShareStrategyConfigService.saveBatch(docShareStrategyConfigList);
        }

        //异步记录日志
        if(recordLog){
            LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
            asynShareStrategyLogdeal(docShareStrategyList, logBaseDTO, 1);
        }
    }

    /**
     * @description 批量修改审核策略
     * @author hanj
     * @param shareStrategyList shareStrategyList
     * @updateTime 2021/7/2
     */
    public void updateDocAuditStrategy(List<DocShareStrategy> shareStrategyList, String procDefId, String userId) {
        List<DocShareStrategy> docShareStrategyList = new ArrayList<>();
        List<DocShareStrategyAuditor> docShareStrategyAuditorList = new ArrayList<>();
        for(DocShareStrategy shareStrategy : shareStrategyList){
            List<DocShareStrategy> exitStrategyList = docShareStrategyService.list(new LambdaQueryWrapper<DocShareStrategy>()
                    .eq(DocShareStrategy::getDocId, shareStrategy.getDocId()).eq(DocShareStrategy::getProcDefId, procDefId));
            if(exitStrategyList.size() == 0){
                continue;
            }
            docShareStrategyAuditorService.remove(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                    .eq(DocShareStrategyAuditor::getAuditStrategyId, exitStrategyList.get(0).getId()));
            List<DocShareStrategyAuditor> auditorList = convertDocAuditStrategyAuditor(shareStrategy.getAuditorList(),
                    exitStrategyList.get(0).getId(), userId);
            docShareStrategyAuditorList.addAll(auditorList);

            shareStrategy.setId(exitStrategyList.get(0).getId());
            shareStrategy.setProcDefId(procDefId);
            docShareStrategyList.add(shareStrategy);
        }
        docShareStrategyAuditorService.saveBatch(docShareStrategyAuditorList);
        docShareStrategyService.updateBatchById(docShareStrategyList);
        //异步记录日志
        LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
        asynShareStrategyLogdeal(docShareStrategyList, logBaseDTO, 2);
    }

    /**
     * @description 批量删除审核策略
     * @author hanj
     * @param idList idList
     * @updateTime 2021/7/2
     */
    public void deleteDocAuditStrategy(List<String> idList) {
        List<DocShareStrategy> docShareStrategyList = docShareStrategyService.listByIds(idList);
        List<DocShareStrategyAuditor> allAuditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                .in(DocShareStrategyAuditor::getAuditStrategyId, idList).orderByAsc(DocShareStrategyAuditor::getAuditSort));
        //异步记录日志
        LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
        docShareStrategyList.forEach(e -> {
            List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
            for(DocShareStrategyAuditor auditor : allAuditorList){
                if(e.getId().equals(auditor.getAuditStrategyId())){
                    auditorList.add(auditor);
                }
            }
            e.setAuditorList(auditorList);
        });
        asynShareStrategyLogdeal(docShareStrategyList, logBaseDTO, 3);

        //执行删除
        for(String auditStrategyId : idList){
            docShareStrategyAuditorService.remove(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                    .eq(DocShareStrategyAuditor::getAuditStrategyId, auditStrategyId));
        }
        docShareStrategyService.removeByIds(idList);
    }

    /**
     * @description 获取流程同一审核员重复审核类型
     * @author hanj
     * @param procDefId procDefId
     * @updateTime 2022/3/7
     */
    public String getRepeatAuditType(String procDefId){
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId));
        return docShareStrategyList.size() > 0 ? docShareStrategyList.get(0).getRepeatAuditType() : "once";
    }

    public DocShareStrategy getDocShareStrategy(String procDefId){
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId));
        if (docShareStrategyList.size() <= 0) {
            return DocShareStrategy.builder().repeatAuditType("once").build();
        } 
        return docShareStrategyList.get(0);
    }

    public List<DocShareStrategy> listDocShareStrategy(List<String> procDefIds, Boolean unique){
        LambdaQueryWrapper<DocShareStrategy> wrapper = new LambdaQueryWrapper<DocShareStrategy>().in(DocShareStrategy::getProcDefId, procDefIds);
        if (unique) {
            wrapper = wrapper.groupBy(DocShareStrategy::getProcDefId);
        }
        return docShareStrategyMapper.selectList(wrapper);
    }

    /**
     * @description 保存流程高级设置
     * @author siyu.chen
     * @param procDefId procDefId
     * @param advancedSetupDTO advancedSetup
     * @updateTime 2024/3/20
     */
    public void saveAdvancedSetup(String procDefId, AdvancedSetupDTO advancedSetup){
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId));
        if(docShareStrategyList.size() == 0){
            return;
        }
        DocShareStrategy updateDocShareStrategy = new DocShareStrategy();
        updateDocShareStrategy.setId(docShareStrategyList.get(0).getId());
        updateDocShareStrategy.setRepeatAuditType(advancedSetup.getRepeat_audit_rule());
        if (advancedSetup.getPerm_config() != null){
            updateDocShareStrategy.setPermConfig(JSONUtil.parse(advancedSetup.getPerm_config()).toString());
        }
        StrategyConfigsDTO strategyConfigsDTO = StrategyConfigsDTO.builder()
                .editPermSwitch(
                        advancedSetup.getEdit_perm_switch() == null ? false : advancedSetup.getEdit_perm_switch())
                .auditIdeaConfig(advancedSetup.getAudit_idea_config()).build();
        updateDocShareStrategy.setStrategyConfigs(JSONUtil.parse(strategyConfigsDTO).toString());
        docShareStrategyMapper.update(updateDocShareStrategy, new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId));
    }

    public List<CheckDocShareStrategyDTO> checkAuditStrategy(List<CheckDocShareStrategyDTO> docList, String procDefId){
        List<Map<String, String>> existDocIdList = docShareStrategyMapper.findDocShareStrategyDocId(procDefId);
        List<CheckDocShareStrategyDTO> resultList = new ArrayList<>();
        for(Map<String, String> existDoc : existDocIdList){
            CheckDocShareStrategyDTO existStrategy = new CheckDocShareStrategyDTO();
            boolean isExist = docList.stream().filter(doc -> doc.getDoc_id().equals(existDoc.get("docId"))).findAny().isPresent();
            if(isExist){
                existStrategy.setDoc_id(existDoc.get("docId"));
                existStrategy.setDoc_name(existDoc.get("docId"));
                resultList.add(existStrategy);
            }
        }
        return resultList;
    }


    /**
     * @description 根据流程id，校验流程环节是否配置审核员来返回流程有效性
     * @author hanj
     * @param procDefId procDefId
     * @updateTime 2021/11/9
     */
    public Boolean checkProcessEffectivity(String procDefId){
        // 根据流程定义id找到审核策略
        List<DocShareStrategy> strategyList =  docShareStrategyMapper.selectList(new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId));
        List<String> strategyIdList = strategyList.stream().map(DocShareStrategy::getId).collect(Collectors.toList());
        if(strategyIdList.size() == 0){
            return false;
        }
        // 获取流程所有环节的审核员
        List<DocShareStrategyAuditor> allAuditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                .in(DocShareStrategyAuditor::getAuditStrategyId, strategyIdList).orderByAsc(DocShareStrategyAuditor::getAuditSort));

        // 获取流程的所有环节
        List<ActivityInfoConfig> activityList = activityInfoConfigManager.findActivityInfoConfigs(procDefId);

        // 判断是否存在某一环节无审核员
        for(ActivityInfoConfig activityInfoConfig : activityList){
            List<DocShareStrategy> activityStrategyList = strategyList.stream().filter(strategy -> activityInfoConfig.getActivityDefId()
                    .equals(strategy.getActDefId())).collect(Collectors.toList());
            if(activityStrategyList.size() > 0){
                boolean isExist = allAuditorList.stream().filter(auditors -> activityStrategyList.get(0).getId()
                        .equals(auditors.getAuditStrategyId())).findAny().isPresent();
                if(!isExist){
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @description 转换获取所有策略的审核员集合
     * @author hanj
     * @param  auditorList
     * @param strategyId
     * @param userId
     * @updateTime 2021/5/20
     */
    private List<DocShareStrategyAuditor> convertDocAuditStrategyAuditor(List<DocShareStrategyAuditor> auditorList, String strategyId,
                                                                         String userId){
        Date now = new Date();
        int sort = 1;
        List<DocShareStrategyAuditor> docShareStrategyAuditorList = new ArrayList<>();
        for(DocShareStrategyAuditor auditor : auditorList){
            auditor.setId(UUID.randomUUID().toString());
            auditor.setAuditStrategyId(strategyId);
            auditor.setCreateTime(now);
            auditor.setCreateUserId(userId);
            auditor.setAuditSort(sort);
            docShareStrategyAuditorList.add(auditor);
            sort++;
        }
        return docShareStrategyAuditorList;
    }

    /**
     * @description 异步记录审核策略操作日志
     * @author hanj
     * @param shareStrategyList shareStrategyList
     * @param type type 1：新增；2：修改；3：删除
     * @updateTime 2021/7/2
     */
    public void asynShareStrategyLogdeal(List<DocShareStrategy> shareStrategyList, LogBaseDTO logBaseDTO, int type){
        Runnable run = () -> {
            try {
                if(type == 1){
                    for(DocShareStrategy strategy : shareStrategyList){
                        docShareStrategyService.addShareStrategyLog(strategy, logBaseDTO);
                    }
                } else if (type == 2){
                    for(DocShareStrategy strategy : shareStrategyList){
                        docShareStrategyService.updateShareStrategyLog(strategy, logBaseDTO);
                    }
                } else if(type == 3){
                    for(DocShareStrategy strategy : shareStrategyList){
                        docShareStrategyService.deleteShareStrategyLog(strategy, logBaseDTO);
                    }
                }
            } catch (Exception e) {
            }
        };
        executor.execute(run);
    }

    /**
     * @description 获取指定审核策略信息
     * @author siyu.chen
     * @param String procDefId
     * @param String actDefId
     * @updateTime 2024/3/18
     */
    public DocShareStrategy getShareStrategy(String procDefId, String actDefId) {
        LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId).eq(DocShareStrategy::getActDefId, actDefId);
        DocShareStrategy docShareStrategy = docShareStrategyMapper.selectOne(queryWrapper);
        return docShareStrategy;
    }

    @OperationLog(title = OperationLogConstants.ADD_SHARE_STRATEGY_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void addShareStrategyLog(DocShareStrategy Strategy, LogBaseDTO logBaseDTO){
        log.info("添加审核策略操作日志:{}", JSON.toJSONString(Strategy));
    }

    @OperationLog(title = OperationLogConstants.UPDATE_SHARE_STRATEGY_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void updateShareStrategyLog(DocShareStrategy Strategy, LogBaseDTO logBaseDTO){
        log.info("修改审核策略操作日志:{}", JSON.toJSONString(Strategy));
    }

    @OperationLog(title = OperationLogConstants.DELETE_SHARE_STRATEGY_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void deleteShareStrategyLog(DocShareStrategy Strategy, LogBaseDTO logBaseDTO){
        log.info("删除审核策略操作日志:{}", JSON.toJSONString(Strategy));
    }
}
