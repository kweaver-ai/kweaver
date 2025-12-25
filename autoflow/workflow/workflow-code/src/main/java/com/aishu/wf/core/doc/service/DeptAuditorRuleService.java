package com.aishu.wf.core.doc.service;

import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleQueryDTO;
import com.aishu.wf.core.engine.identity.service.User2roleService;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/2/16 18:06
 */
@Slf4j
@Service
public class DeptAuditorRuleService {

    @Autowired
    private RoleService roleService;

    @Autowired
    private User2roleService user2roleService;

    @Autowired
    private DeptAuditorRuleService deptAuditorRuleService;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    @Resource
    private UserManagementService userManagementService;

    /**
     * @description 分页获取部门审核员规则
     * @author hanj
     * @param queryDTO queryDTO
     * @updateTime 2022/2/19
     */
    public IPage<Role> findDeptAuditorRulePage(DeptAuditorRuleRoleQueryDTO queryDTO, String userId){
        String roleCreator = null;
        String tenantId = null;
        if (!this.checkRole(queryDTO.getRoles())) {
            roleCreator = userId;
        }
        if(queryDTO.getProcess_client() == 1){
            tenantId = userId;
        }else if (StrUtil.isNotEmpty(queryDTO.getTenant_id()) && queryDTO.getTenant_id().equals(CommonConstants.TENANT_AF_WORKFLOW)){
            tenantId =  CommonConstants.TENANT_AF_WORKFLOW;
        } else {
            tenantId = CommonConstants.TENANT_AS_WORKFLOW;
        }
        IPage<Role> pageResult = roleService.findDeptAuditorRuleRolePage(new Page<>(queryDTO.getPageNumber(),
                queryDTO.getPageSize()), queryDTO.getId(), queryDTO.getName(), queryDTO.getNames(), queryDTO.getAuditors(), roleCreator, tenantId,queryDTO.getTemplate());
        List<Role> list = pageResult.getRecords();
        List<String> ruleIdList = new ArrayList<>();
        if(list.size() == 0){
            return pageResult;
        }
        list.forEach(e -> {
            ruleIdList.add(e.getRoleId());
        });
        List<User2role> allAuditorList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                .in(User2role::getRoleId, ruleIdList).orderByAsc(User2role::getSort));
        list.forEach(e -> {
            List<User2role> auditorList = new ArrayList<>();
            String auditorNames = "";
            int level = 1;
            for(User2role auditor : allAuditorList){
                if(e.getRoleId().equals(auditor.getRoleId())){
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
     * @description 获取部门审核员规则详情
     * @author hanj
     * @param roleId roleId
     * @updateTime 2022/2/19
     */
    public Role getDeptAuditorRule(String roleId){
        Role role = roleService.getRoleById(roleId);
        if(null != role){
            List<User2role> allAuditorList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                    .eq(User2role::getRoleId, roleId).orderByAsc(User2role::getSort));
            role.setAuditorList(allAuditorList);
        }
        return role;
    }

    /**
     * @description 保存部门审核员规则
     * @author hanj
     * @param deptAuditorRuleRoleDTO
     * @updateTime 2021/5/20
     */
    public String saveDeptAuditorRule(DeptAuditorRuleRoleDTO deptAuditorRuleRoleDTO, String userId) {
        Role role = DeptAuditorRuleRoleDTO.builderModel(deptAuditorRuleRoleDTO);
        List<User2role> deptAuditorList = new ArrayList<>();
        if(StrUtil.isNotBlank(role.getRoleId())){
            List<User2role> auditorList = convertDeptAuditor(deptAuditorRuleRoleDTO.getDept_auditor_rule_list(),
                    role.getRoleId(), userId);
            deptAuditorList.addAll(auditorList);
            user2roleService.remove(new LambdaQueryWrapper<User2role>().eq(User2role::getRoleId, role.getRoleId()));
            List<String> userIds = deptAuditorList.stream().map(User2role::getUserId).collect(Collectors.toList());
            List<ValueObjectEntity> userList = userManagementService.names("user", userIds);
            for (User2role user2role: deptAuditorList) {
                List<ValueObjectEntity> filterUserList = userList.stream().filter(e -> e.getId().equals(user2role.getUserId()))
                        .collect(Collectors.toList());
                user2role.setUserName(filterUserList.size() > 0 ? filterUserList.get(0).getName() : user2role.getUserName());
            }
            user2roleService.saveBatch(deptAuditorList);
            roleService.updateById(role);

            // 记录日志
            LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
            List<Role> roleList = new ArrayList<>();
            roleList.add(role);
            role.setAuditorList(auditorList);
            asynDeptAuditorRuleLogdeal(roleList, logBaseDTO, 2);
        } else {
            role.setRoleId(UUID.randomUUID().toString());
            role.setRoleStatus("qy");
            role.setRoleCreateTime(new Date());
            role.setRoleCreator(userId);
            List<User2role> auditorList = convertDeptAuditor(deptAuditorRuleRoleDTO.getDept_auditor_rule_list(),
                    role.getRoleId(), userId);
            deptAuditorList.addAll(auditorList);
            List<String> userIds = deptAuditorList.stream().map(User2role::getUserId).collect(Collectors.toList());
            List<ValueObjectEntity> userList = userManagementService.names("user", userIds);
            for (User2role user2role: deptAuditorList) {
                List<ValueObjectEntity> filterUserList = userList.stream().filter(e -> e.getId().equals(user2role.getUserId()))
                        .collect(Collectors.toList());
                user2role.setUserName(filterUserList.size() > 0 ? filterUserList.get(0).getName() : user2role.getUserName());
            }
            user2roleService.saveBatch(deptAuditorList);
            roleService.save(role);

            // 记录日志
            LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
            List<Role> roleList = new ArrayList<>();
            roleList.add(role);
            role.setAuditorList(auditorList);
            asynDeptAuditorRuleLogdeal(roleList, logBaseDTO, 1);
        }

        return role.getRoleId();
    }

    /**
     * @description 批量删除部门审核员规则
     * @author hanj
     * @param idList idList
     * @updateTime 2021/7/2
     */
    public void deleteDeptAuditorRule(List<String> idList) {
        List<Role> deleteDeptAuditorRuleList = roleService.listByIds(idList);
        List<User2role> user2roleList = user2roleService.list(new LambdaQueryWrapper<User2role>()
                .in(User2role::getRoleId, idList).orderByAsc(User2role::getSort));
        //异步记录日志
        LogBaseDTO logBaseDTO = RequestUtils.getLogBase();
        deleteDeptAuditorRuleList.forEach(e -> {
            List<User2role> auditorList = new ArrayList<>();
            for(User2role auditor : user2roleList){
                if(e.getRoleId().equals(auditor.getRoleId())){
                    auditorList.add(auditor);
                }
            }
            e.setAuditorList(auditorList);
        });
        asynDeptAuditorRuleLogdeal(deleteDeptAuditorRuleList, logBaseDTO, 3);
        //执行删除
        for(String roleId : idList){
            user2roleService.remove(new LambdaQueryWrapper<User2role>()
                    .eq(User2role::getRoleId, roleId));
        }
        roleService.removeByIds(idList);
    }

    public List<User2role> queryAuditorsByName(String ruleId, String[] deptNames, String[] auditors){
        LambdaQueryWrapper<User2role> queryWrapper = new LambdaQueryWrapper<User2role>().eq(User2role::getRoleId, ruleId);
        if (ArrayUtil.isNotEmpty(auditors)) {
            String sql = "(";
            for (int i = 0; i < auditors.length; i++) {
                if (i > 0) {
                    sql = sql + " or";
                }
                sql = sql + " user_name like '%" + auditors[i] + "%' ";
            }
            sql = sql + ")";
            queryWrapper.apply(sql);
        }
        if (ArrayUtil.isNotEmpty(deptNames)) {
            String sql = "(";
            for (int i = 0; i < deptNames.length; i++) {
                if (i > 0) {
                    sql = sql + " or";
                }
                sql = sql + " org_name like '%" + deptNames[i] + "%' ";
            }
            sql = sql + ")";
            queryWrapper.apply(sql);
        }
        queryWrapper.orderByAsc(User2role::getSort);
        List<User2role> user2roleList = user2roleService.list(queryWrapper);
        return user2roleList;
    }

    /**
     * @description 转换获取所有部门审核员集合
     * @author hanj
     * @param  deptAuditorRuleDTOList
     * @param ruleId
     * @param userId
     * @updateTime 2021/5/20
     */
    private List<User2role> convertDeptAuditor(List<DeptAuditorRuleDTO> deptAuditorRuleDTOList, String ruleId,
                                               String userId){
        int sort = 1;
        List<User2role> deptAuditorList = new ArrayList<>();
        for(DeptAuditorRuleDTO deptAuditorRuleDTO : deptAuditorRuleDTOList){
            List<DeptAuditorDTO> deptAuditorDTOList = deptAuditorRuleDTO.getAuditor_list();
            for(DeptAuditorDTO deptAuditorDTO : deptAuditorDTOList){
                User2role user2role = DeptAuditorDTO.builderModel(deptAuditorDTO);
                user2role.setRoleId(ruleId);
                user2role.setCreateTime(new Date());
                user2role.setCreateUserId(userId);
                user2role.setSort(sort);
                deptAuditorList.add(user2role);
                sort++;
            }
        }
        return deptAuditorList;
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
     * @description 异步记录部门审核员规则操作日志
     * @author hanj
     * @param deleteDeptAuditorRuleList deleteDeptAuditorRuleList
     * @param type type 1：新增；2：修改；3：删除
     * @updateTime 2021/7/2
     */
    public void asynDeptAuditorRuleLogdeal(List<Role> deleteDeptAuditorRuleList, LogBaseDTO logBaseDTO, int type){
        Runnable run = () -> {
            try {
                if(type == 1){
                    for(Role role : deleteDeptAuditorRuleList){
                        deptAuditorRuleService.addDeptAuditorRuleLog(role, logBaseDTO);
                    }
                } else if (type == 2){
                    for(Role role : deleteDeptAuditorRuleList){
                        deptAuditorRuleService.updateDeptAuditorRuleLog(role, logBaseDTO);
                    }
                } else if(type == 3){
                    for(Role role : deleteDeptAuditorRuleList){
                        deptAuditorRuleService.deleteDeptAuditorRuleLog(role, logBaseDTO);
                    }
                }
            } catch (Exception e) {
            }
        };
        executor.execute(run);
    }

    @OperationLog(title = OperationLogConstants.ADD_DEPT_AUDITOR_RULE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void addDeptAuditorRuleLog(Role role, LogBaseDTO logBaseDTO){
        log.info("添加部门审核员规则操作日志:{}", JSON.toJSONString(role));
    }

    @OperationLog(title = OperationLogConstants.UPDATE_DEPT_AUDITOR_RULE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void updateDeptAuditorRuleLog(Role role, LogBaseDTO logBaseDTO){
        log.info("修改部门审核员规则操作日志:{}", JSON.toJSONString(role));
    }

    @OperationLog(title = OperationLogConstants.DELETE_DEPT_AUDITOR_RULE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    public void deleteDeptAuditorRuleLog(Role role, LogBaseDTO logBaseDTO){
        log.info("删除部门审核员规则操作日志:{}", JSON.toJSONString(role));
    }
}
