package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.DocShareApi;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.dao.DocShareStrategyAuditorMapper;
import com.aishu.wf.core.doc.dao.DocShareStrategyMapper;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.ContivuousMultilevelDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyAuditorService;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.service.User2roleService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@Slf4j
@Service
public class StrategyUtils {
    @Resource
    private DocShareStrategyAuditorMapper docShareStrategyAuditorMapper;

    @Resource
    private DocShareStrategyMapper docShareStrategyMapper;
    
    @Resource
    private AnyShareConfig anyShareConfig;

    @Autowired
    private DocShareStrategyAuditorService docShareStrategyAuditorService;

    @Autowired
    private ProcessDefinitionService processDefinitionService;

    @Autowired
    private UserService userService;

    @Autowired
    private User2roleService user2roleService;

    private DocShareApi docShareApi;


    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        docShareApi = anyShareClient.getDocSharePrivateApi();
    }

    /**
     * @description 获取策略对应的审核员
     * @author hanj
     * @param auditStrategyId auditStrategyId
     * @updateTime 2021/7/2
     */
    public List<DocShareStrategyAuditor> getAuditors(String auditStrategyId){
        LambdaQueryWrapper<DocShareStrategyAuditor> queryWrapper =new LambdaQueryWrapper<DocShareStrategyAuditor>()
                .eq(DocShareStrategyAuditor::getAuditStrategyId, auditStrategyId).orderByAsc(DocShareStrategyAuditor::getAuditSort);
        return docShareStrategyAuditorMapper.selectList(queryWrapper);
    }

    /**
     * @description 获取共享审核策略
     * @author hanj
     * @param procDefId procDefId
     * @param actDefId actDefId
     * @param docLibId docLibId
     * @updateTime 2021/7/22
     */
    public List<DocShareStrategy> getDocShareStrategy(String procDefId, String actDefId, String docLibId){
        LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId).eq(DocShareStrategy::getActDefId, actDefId);
        List<String> allLibList = Arrays.asList(DocConstants.ALL_USER_DOC_LIB, DocConstants.ALL_DEPARTMENT_DOC_LIB,
                DocConstants.ALL_CUSTOM_DOC_LIB);
        List<String> docLibList = new ArrayList<>();
        docLibList.addAll(allLibList);
        // 查询出指定流程指定环节下当前文档库配置的共享审核策略（默认包含所有个人文档库）
        docLibList.add(docLibId);
        queryWrapper.in(DocShareStrategy::getDocId, docLibList);
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(queryWrapper);
        return docShareStrategyList;
    }

    /**
     * @description 获取审核策略
     * @author hanj
     * @param procDefId procDefId
     * @param actDefId actDefId
     * @updateTime 2021/8/23
     */
    public List<DocShareStrategy> getDocStrategy(String procDefId, String actDefId){
        LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId).eq(DocShareStrategy::getActDefId, actDefId);
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(queryWrapper);
        return docShareStrategyList;
    }

    /**
     * @description 获取审核策略
     * @author hanj
     * @param procDefId procDefId
     * @updateTime 2021/8/23
     */
    public List<DocShareStrategy> getDocStrategy(String procDefId) {
        LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId);
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(queryWrapper);
        List<String> strategyIdList = docShareStrategyList.stream().map(DocShareStrategy::getId).collect(Collectors.toList());
        if(strategyIdList.size() > 0){
            List<DocShareStrategyAuditor> allAuditorList = docShareStrategyAuditorService.list(new LambdaQueryWrapper<DocShareStrategyAuditor>()
                    .in(DocShareStrategyAuditor::getAuditStrategyId, strategyIdList).orderByAsc(DocShareStrategyAuditor::getAuditSort));
            docShareStrategyList.forEach(e -> {
                List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
                for(DocShareStrategyAuditor auditor : allAuditorList){
                    if(e.getId().equals(auditor.getAuditStrategyId())){
                        auditorList.add(auditor);
                    }
                }
                e.setAuditorList(auditorList);
            });
        }
        return docShareStrategyList;
    }

    protected JSONArray getOwnerList(String docId) throws Exception {
        return docShareApi.getOwnerList(docId);
    }

    /**
     * 通过webhook动态获取审核员
     */
    protected String getUserByWebhook(String url) throws Exception {
        //return "[{\"user_id\":\"ef50507a-d5d0-11ed-9eba-b2b2a319b31a\"}]";
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(url).build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 200) {
                return response.body().string();
            } else {
                String errorMsq = String.format("url={%s},status={%s},message={%s},body={%s}",
                        url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    /**
     * @description 查询连续多级审核策略（用于引擎获取连续多级审核策略配置）
     * @author hanj
     * @param procDefId procDefId
     * @param actDefId actDefId
     * @param docUserId docUserId
     * @updateTime 2022/7/7
     */
    public List<ContivuousMultilevelDTO> queryContinuousMultilevelStrategy(String procDefId, String actDefId, String docUserId){
        List<ContivuousMultilevelDTO> resultList = new ArrayList<>();
        ProcessDefinitionModel processDefinitionModel = processDefinitionService.getProcessDef(procDefId);
        if(WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(processDefinitionModel.getCategory())){
            return resultList;
        } else {
            List<DocShareStrategy> docShareStrategyList = this.getDocStrategy(procDefId, actDefId);
            DocShareStrategy docShareStrategy = docShareStrategyList.get(0);
            String strategyType = docShareStrategy.getStrategyType();
            if(WorkflowConstants.STRATEGY_TYPE.MULTILEVEL.getValue().equals(strategyType)){
                String ruleType = docShareStrategy.getRuleType();
                String ruleId = docShareStrategy.getRuleId();
                String levelType = docShareStrategy.getLevelType();
                try {
                    if(WorkflowConstants.RULE_TYPE_ROLE.equals(ruleType)){
                        int multiLevel = 1;

                        // 匹配规则配置了当前用户配置了审核员，则从该用户配置的审核员开始送审
                        List<User2role> currentUser2roleList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                                .eq(User2role::getRoleId, ruleId).eq(User2role::getOrgId, docUserId));
                        if(currentUser2roleList.size() > 0){
                            ContivuousMultilevelDTO contivuousMultilevelDTO = new ContivuousMultilevelDTO();
                            contivuousMultilevelDTO.setLevel(String.valueOf(multiLevel));
                            List<String> assigneeList = currentUser2roleList.stream().map(User2role::getUserId).collect(Collectors.toList());
                            contivuousMultilevelDTO.setMultilevelAssigneeList(assigneeList);
                            resultList.add(contivuousMultilevelDTO);
                            multiLevel++;
                        }

                        // 获取用户部门组织层级数据
                        User user = userService.getUserById(docUserId);
                        if(user.getParentDeps().size() == 0){
                            return resultList;
                        }
                        List<Department> departmentList = chooseUserDepartments(ruleId, user.getParentDeps());
                        if(null == departmentList){
                            return resultList;
                        }
                        Collections.reverse(departmentList);
                        // 若匹配级别类型为空，则直接返回
                        if(StrUtil.isEmpty(levelType)){
                            return resultList;
                        }

                        // 若直属部门未匹配到审核员，则按匹配级别逐级查找审核员直到返回审核员
                        WorkflowConstants.LEVEL_TYPE levelItem = WorkflowConstants.LEVEL_TYPE.getLevelType(levelType);
                        if(levelItem.isHighestLevel()){
                            // 最高级部门审核员（直属部门向上匹配直到向上至最高级部门）
                            List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                            List<User2role> highestLevelUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, departmentIdList);
                            Map<String, List<User2role>> highestLevelUserMap = highestLevelUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
                            for(String departmentId : departmentIdList) {
                                if(highestLevelUserMap.containsKey(departmentId)) {
                                    ContivuousMultilevelDTO contivuousMultilevelDTO = new ContivuousMultilevelDTO();
                                    contivuousMultilevelDTO.setLevel(String.valueOf(multiLevel));
                                    List<User2role> user2RoleList = highestLevelUserMap.get(departmentId);
                                    List<String> assigneeList = user2RoleList.stream().map(User2role::getUserId).collect(Collectors.toList());
                                    contivuousMultilevelDTO.setMultilevelAssigneeList(assigneeList);
                                    resultList.add(contivuousMultilevelDTO);
                                    multiLevel++;
                                }
                            }
                            return resultList;
                        } else if(levelItem.isBelongUp()){
                            int level = levelItem.getLevel();
                            // 直属部门向上匹配
                            List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                            int endIndex = departmentIdList.size() > level ? level + 1 : departmentIdList.size();
                            List<String> belongDepartmentIdList = departmentIdList.subList(0, endIndex);
                            if(belongDepartmentIdList.size() == 0){
                                // 如果没有向上的组织则返回无审核员
                                return resultList;
                            }
                            List<User2role> belongUpUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, belongDepartmentIdList);
                            Map<String, List<User2role>> belongUpUserMap = belongUpUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
                            for(String departmentId : departmentIdList) {
                                if(belongUpUserMap.containsKey(departmentId)) {
                                    ContivuousMultilevelDTO contivuousMultilevelDTO = new ContivuousMultilevelDTO();
                                    contivuousMultilevelDTO.setLevel(String.valueOf(multiLevel));
                                    List<User2role> user2RoleList = belongUpUserMap.get(departmentId);
                                    List<String> assigneeList = user2RoleList.stream().map(User2role::getUserId).collect(Collectors.toList());
                                    contivuousMultilevelDTO.setMultilevelAssigneeList(assigneeList);
                                    resultList.add(contivuousMultilevelDTO);
                                    multiLevel++;
                                }
                            }
                            return resultList;
                        } else if(levelItem.isHighestDown()){
                            int level = levelItem.getLevel();
                            // 最高级部门向下匹配
                            List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                            int endIndex = departmentIdList.size() > level ? (departmentIdList.size() - level) : 1;
                            List<String> highestDownDepartmentIdList = departmentIdList.subList(0, endIndex);
                            if(highestDownDepartmentIdList.size() == 0){
                                // 如果没有向下的组织则返回无审核员
                                return resultList;
                            }
                            List<User2role> highestDownUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, highestDownDepartmentIdList);
                            Map<String, List<User2role>> highestDownUserMap = highestDownUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
                            for(String departmentId : departmentIdList) {
                                if(highestDownUserMap.containsKey(departmentId)) {
                                    ContivuousMultilevelDTO contivuousMultilevelDTO = new ContivuousMultilevelDTO();
                                    contivuousMultilevelDTO.setLevel(String.valueOf(multiLevel));
                                    List<User2role> user2RoleList = highestDownUserMap.get(departmentId);
                                    List<String> assigneeList = user2RoleList.stream().map(User2role::getUserId).collect(Collectors.toList());
                                    contivuousMultilevelDTO.setMultilevelAssigneeList(assigneeList);
                                    resultList.add(contivuousMultilevelDTO);
                                    multiLevel++;
                                }
                            }
                            return resultList;
                        }
                    }
                } catch (Exception e) {
                    log.warn("连续多级，查询连续多级审核策略失败！docShareStrategy：{}", JSON.toJSONString(docShareStrategy), e);
                    throw e;
                }
            }
        }
        return resultList;
    }

    /**
     * 选择用户多个直属部门下，已配置部门审核员的直属部门及上级组织
     * @param ruleId
     * @param parentDeps
     * @return
     */
    private List<Department> chooseUserDepartments(String ruleId, List<List<Department>> parentDeps){
        List<Department> departmentListResult = null;
        for (List<Department> departments : parentDeps) {
            List<String> departmentIdList = departments.stream().map(Department::getId).collect(Collectors.toList());
            List<User2role> user2roleList = user2roleService.getUser2roleListByOrgs(ruleId, departmentIdList);
            if(user2roleList.size() > 0){
                departmentListResult = departments;
                break;
            }
        }
        return departmentListResult;
    }

    /**
     * @description 查询审核策略（用于引擎获取环节审核策略配置）
     * @author hanj
     * @param procDefId 流程定义ID
     * @param actDefId 环节定义ID
     * @param docId 文档ID（结构：gns://文档库id/..目录ID../文件ID）
     * @param docUserId 文档所属用户ID
     * @param docLibType 文档库类型
     * @updateTime 2021/8/2
     */
    public DocShareStrategy queryDocShareStrategy(String procDefId, String actDefId, String docId, String docUserId,
                                                  String docLibType) throws Exception {
        DocShareStrategy resultStrategy = new DocShareStrategy();
        ProcessDefinitionModel processDefinitionModel = processDefinitionService.getProcessDef(procDefId);
        if(WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(processDefinitionModel.getCategory())){
            String docLibId = DocConstants.USER_DOC_LIB.equals(docLibType) ? docUserId : this.getDocLibId(docId);
            LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                    .eq(DocShareStrategy::getProcDefId, procDefId).eq(DocShareStrategy::getActDefId, actDefId);
            List<String> allLibList = Arrays.asList(DocConstants.ALL_USER_DOC_LIB, DocConstants.ALL_DEPARTMENT_DOC_LIB,
                    DocConstants.ALL_CUSTOM_DOC_LIB);
            List<String> docLibList = new ArrayList<>();
            docLibList.addAll(allLibList);
            // 查询出指定流程指定环节下当前文档库配置的共享审核策略（默认包含所有文档库）
            docLibList.add(docLibId);
            queryWrapper.in(DocShareStrategy::getDocId, docLibList);
            List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(queryWrapper);
            // 1.根据文档库id查找是否有对应的审核策略
            for (DocShareStrategy docShareStrategy : docShareStrategyList) {
                String strategyDocId = docShareStrategy.getDocId();
                if (StrUtil.isBlank(strategyDocId) || DocConstants.ALL_USER_DOC_LIB.equals(strategyDocId)
                        || DocConstants.ALL_DEPARTMENT_DOC_LIB.equals(strategyDocId) || DocConstants.ALL_CUSTOM_DOC_LIB.equals(strategyDocId)) {
                    continue;
                }
                if (strategyDocId.equals(docLibId)) {
                    return docShareStrategy;
                }
            }

            // 2.根据文档库id未查找到对应的审核策略，则该文档库类型下是否配置所有文档库，若配置，则返回所有文档库
            if (DocConstants.USER_DOC_LIB.equals(docLibType)) {
                //查找是否配置所有个人文档库
                List<DocShareStrategy> allUserDocLibList = docShareStrategyList.stream().filter(strategy ->
                        strategy.getDocId().equals(DocConstants.ALL_USER_DOC_LIB)).collect(Collectors.toList());
                resultStrategy = allUserDocLibList.size() > 0 ? allUserDocLibList.get(0) : new DocShareStrategy();
            } else if(DocConstants.DEPARTMENT_DOC_LIB.equals(docLibType)) {
                //查找是否配置所有部门文档库
                List<DocShareStrategy> allDepartmentDocLibList = docShareStrategyList.stream().filter(strategy ->
                        strategy.getDocId().equals(DocConstants.ALL_DEPARTMENT_DOC_LIB)).collect(Collectors.toList());
                resultStrategy =  allDepartmentDocLibList.size() > 0 ? allDepartmentDocLibList.get(0) : new DocShareStrategy();
            } else if(DocConstants.CUSTOM_DOC_LIB.equals(docLibType)) {
                //查找是否配置所有自定义文档库
                List<DocShareStrategy> allCustomDocLibList = docShareStrategyList.stream().filter(strategy ->
                        strategy.getDocId().equals(DocConstants.ALL_CUSTOM_DOC_LIB)).collect(Collectors.toList());
                resultStrategy = allCustomDocLibList.size() > 0 ? allCustomDocLibList.get(0) : new DocShareStrategy();
            }
        } else{
            List<DocShareStrategy> docShareStrategyList = this.getDocStrategy(procDefId, actDefId);
            resultStrategy = docShareStrategyList.size() > 0 ? docShareStrategyList.get(0) : new DocShareStrategy();
        }

        return resultStrategy;
    }

    /**
     * 根据文档ID，截取文档库ID
     * @param docId 文档ID
     * @return
     */
    public String getDocLibId(String docId) {
        if(null == docId){
            return "";
        }
        int index = docId.indexOf(StrUtil.SLASH, DocConstants.GNS_PROTOCOL.length());
        // 文档库ID（文档ID的第一级为文档库ID）
        return index != -1 ? docId.substring(0, index) : docId;
    }
}
