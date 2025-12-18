package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.service.User2roleService;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DeptAuditorStrategyImpl implements AuditorStrategy{
    @Autowired
    private UserService userService;

    @Autowired
    private User2roleService user2roleService;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        // 实现部门审核员策略
        return deptAuditorGetAuditors(docShareStrategy, docUserId);
    }

    /**
     * @description 部门审核员，获取审核员
     * @author hanj
     * @param docShareStrategy docShareStrategy
     * @updateTime 2022/2/24
     */
    private List<DocShareStrategyAuditor> deptAuditorGetAuditors(DocShareStrategy docShareStrategy, String docUserId) throws Exception {
        List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
        String ruleType = docShareStrategy.getRuleType();
        String ruleId = docShareStrategy.getRuleId();
        String levelType = docShareStrategy.getLevelType();
        try {
            if(WorkflowConstants.RULE_TYPE_ROLE.equals(ruleType)){
                // 获取审核员匹配规则所有配置的审核员
                List<User2role> allUser2roleList = user2roleService.list(new LambdaQueryWrapper<User2role>().eq(User2role::getRoleId, ruleId));
                if(allUser2roleList.size() == 0){
                    return auditorList;
                }
                List<DocShareStrategyAuditor> allUser2roleResult = builderAuditorByUser2role(allUser2roleList);
                List<String> userIdList = allUser2roleResult.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
                List<User> userList = userService.getUserList(userIdList);

                // 过滤禁用的审核员
                allUser2roleResult = this.filterAuditorByEnabled(allUser2roleResult, userList);
                if (CollUtil.isEmpty(allUser2roleResult)) {
                    return auditorList;
                }

                // 匹配规则配置了当前用户配置了审核员，则直接送审至该用户配置的审核员
                List<User2role> currentUser2roleList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                        .eq(User2role::getRoleId, ruleId).eq(User2role::getOrgId, docUserId));
                if(currentUser2roleList.size() > 0 && checkUser2roleExist(allUser2roleResult, currentUser2roleList).size() > 0){
                    return builderAuditorByUser2role(currentUser2roleList);
                }

                // 获取用户部门组织层级数据
                User user = userService.getUserById(docUserId);
                if(user.getParentDeps().size() == 0){
                    return auditorList;
                }
                List<Department> departmentList = chooseUserDepartments(ruleId, user.getParentDeps());
                if(null == departmentList){
                    return auditorList;
                }
                Collections.reverse(departmentList);

                // 若匹配级别类型为空，则直接返回
                if(StrUtil.isEmpty(levelType)){
                    return auditorList;
                }

                // 若直属部门匹配到审核员，则直接返回直属部门审核员
                String directlyOrgId = departmentList.get(0).getId();
                List<User2role> directlyUser2roleList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                        .eq(User2role::getRoleId, ruleId).eq(User2role::getOrgId, directlyOrgId));
                if(directlyUser2roleList.size() > 0 && checkUser2roleExist(allUser2roleResult, directlyUser2roleList).size() > 0){
                    return builderAuditorByUser2role(directlyUser2roleList);
                }

                // 若直属部门未匹配到审核员，则按匹配级别逐级查找审核员直到返回审核员
                WorkflowConstants.LEVEL_TYPE levelItem = WorkflowConstants.LEVEL_TYPE.getLevelType(levelType);
                if(levelItem.isHighestLevel()){
                    // 最高级部门审核员（直属部门向上匹配直到向上至最高级部门）
                    List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                    List<User2role> highestLevelUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, departmentIdList);
                    LinkedHashMap<String, List<User2role>> highestLevelUserMap = highestLevelUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId, LinkedHashMap::new, Collectors.toList()));
                    return highestLevelUser2roleList.size() > 0 ? builderAuditorByUser2role(buildUser2roleExist(allUser2roleResult, highestLevelUserMap))
                            : builderAuditorByUser2role(highestLevelUser2roleList);
                } else if(levelItem.isBelongUp()){
                    int level = levelItem.getLevel();
                    // 直属部门向上匹配

                    List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                    // 直属部门向上匹配的层级是用户所属直属部门往上追溯的层级，如用户所处部门为[d,c,b,a],其直属部门为d,根部门为a
                    // 则直属部门往上三级为[d,c,b,a]，直属部门往上二级为[d,c,b]
                    // 直属部门往上四级为[d,c,b,a]
                    int endIndex = departmentIdList.size() > level ? level + 1 : departmentIdList.size();

                    List<String> belongDepartmentIdList = departmentIdList.subList(0, endIndex);
                    if(belongDepartmentIdList.size() == 0){
                        // 如果没有向上的组织则返回无审核员
                        return auditorList;
                    }
                    List<User2role> belongUpUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, belongDepartmentIdList);

                    LinkedHashMap<String, List<User2role>> belongUpUserMap = belongUpUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId, LinkedHashMap::new, Collectors.toList()));
                    List<DocShareStrategyAuditor> res = belongUpUser2roleList.size() > 0 ? builderAuditorByUser2role(buildUser2roleExist(allUser2roleResult, belongUpUserMap))
                    : builderAuditorByUser2role(belongUpUser2roleList);

                    return res;
                } else if(levelItem.isHighestDown()){
                    int level = levelItem.getLevel();
                    // 最高级部门向下匹配
                    List<String> departmentIdList = departmentList.stream().map(Department::getId).collect(Collectors.toList());
                    int endIndex = departmentIdList.size() > level ? (departmentIdList.size() - level) : 1;
                    List<String> highestDownDepartmentIdList = departmentIdList.subList(0, endIndex);
                    if(highestDownDepartmentIdList.size() == 0){
                        // 如果没有向下的组织则返回无审核员
                        return auditorList;
                    }
                    List<User2role> highestDownUser2roleList = user2roleService.getUser2roleListByOrgs(ruleId, highestDownDepartmentIdList);
                    LinkedHashMap<String, List<User2role>> highestDownUserMap = highestDownUser2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId, LinkedHashMap::new, Collectors.toList()));
                    List<DocShareStrategyAuditor> res = highestDownUser2roleList.size() > 0 ? builderAuditorByUser2role(buildUser2roleExist(allUser2roleResult, highestDownUserMap))
                    : builderAuditorByUser2role(highestDownUser2roleList);
                    return res;
                }
            }
        } catch (Exception e) {
            log.warn("部门审核员，获取审核员处理失败！docShareStrategy：{}", JSON.toJSONString(docShareStrategy), e);
            throw e;
        }
        return auditorList;
    }

    /**
     * @description 部门审核员，校验审核员是否存在
     * @author hanj
     * @param allUser2roleResult allUser2roleResult
     * @param user2roleList user2roleList
     * @updateTime 2022/12/13
     */
    private List<User2role> checkUser2roleExist(List<DocShareStrategyAuditor> allUser2roleResult, List<User2role> user2roleList){
            List<String> allUserIds = allUser2roleResult.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
            List<String> userIds = user2roleList.stream().map(User2role::getUserId).collect(Collectors.toList());
            if(containsAny(userIds, allUserIds)){
                return user2roleList;
            }
        return new ArrayList<>();
    }

    /**
     * @description 部门审核员，构建校验审核员是否存在，返回存在的层级数据
     * @author hanj
     * @param allUser2roleResult allUser2roleResult
     * @param highestLevelUserMap highestLevelUserMap
     * @updateTime 2022/12/13
     */
    private List<User2role> buildUser2roleExist(List<DocShareStrategyAuditor> allUser2roleResult, Map<String, List<User2role>> highestLevelUserMap){
        for (String key : highestLevelUserMap.keySet()){
            List<User2role> user2roleList = highestLevelUserMap.get(key);
            List<String> userIds = user2roleList.stream().map(User2role::getUserId).collect(Collectors.toList());
            List<String> auditorIds = allUser2roleResult.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
            if(containsAny(userIds, auditorIds)){
                return user2roleList;
            }
        }
        return new ArrayList<>();
    }

    private boolean containsAny(Collection<?> source, Collection<?> candidates) {
        if (ObjectUtil.isEmpty(source) || ObjectUtil.isEmpty((candidates))) {
            return false;
        }
        for (Object candidate : candidates) {
            if (source.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description 根据组织部门id过滤部门审核员
     * @author hanj
     * @param user2roleList user2roleList
     * @updateTime 2022/2/24
     */
    private List<DocShareStrategyAuditor> builderAuditorByUser2role(List<User2role> user2roleList){
        List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
        for(User2role User2role : user2roleList){
            DocShareStrategyAuditor auditor = DocShareStrategyAuditor.builder().userId(User2role.getUserId()).userCode(User2role.getUserCode())
                    .userName(User2role.getUserName()).auditSort(User2role.getSort()).build();
            auditorList.add(auditor);
        }
        return auditorList;
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
}
