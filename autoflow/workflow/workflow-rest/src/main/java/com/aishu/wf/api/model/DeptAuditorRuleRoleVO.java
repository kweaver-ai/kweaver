package com.aishu.wf.api.model;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleDTO;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/2/16 19:13
 */
@Data
@ApiModel(value = "部门审核员规则角色对象")
public class DeptAuditorRuleRoleVO {

    @ApiModelProperty(value = "规则ID")
    private String rule_id;

    @ApiModelProperty(value = "规则名称", example = "")
    private String rule_name;

    @ApiModelProperty(value = "流程租户ID", example = "")
    private String tenant_id;

    @ApiModelProperty(value = "部门审核员规则列表")
    private List<DeptAuditorRuleVO> dept_auditor_rule_list;

    @ApiModelProperty(value = "审核人员名称")
    private String auditor_names;

    public static DeptAuditorRuleRoleVO builder(Role role) {
        DeptAuditorRuleRoleVO deptAuditorRuleRoleVO = new DeptAuditorRuleRoleVO();
        deptAuditorRuleRoleVO.setRule_id(role.getRoleId());
        deptAuditorRuleRoleVO.setRule_name(role.getRoleName());
        deptAuditorRuleRoleVO.setTenant_id(role.getRoleAppId());
        deptAuditorRuleRoleVO.setAuditor_names(role.getAuditorNames());
        return deptAuditorRuleRoleVO;
    }

    public static DeptAuditorRuleRoleVO builderDetail(Role role) {
        DeptAuditorRuleRoleVO deptAuditorRuleRoleVO = new DeptAuditorRuleRoleVO();
        if(null != role){
            List<User2role> allAuditorList = role.getAuditorList();
            Map<String, List<User2role>> deptAuditorMap =  allAuditorList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
            List<DeptAuditorRuleVO> deptAuditorRuleVOList = new ArrayList<>();
            for (String orgId : deptAuditorMap.keySet()) {
                DeptAuditorRuleVO deptAuditorRuleVO = new DeptAuditorRuleVO();
                deptAuditorRuleVO.setOrg_id(orgId);
                List<User2role> user2roleList = deptAuditorMap.get(orgId);
                List<DeptAuditorVO> deptAuditorVOList = new ArrayList<>();
                for(User2role user2role : user2roleList){
                    deptAuditorVOList.add(DeptAuditorVO.builder(user2role));
                }
                deptAuditorRuleVO.setAuditor_list(deptAuditorVOList);
                String auditorNames = "";
                for(DeptAuditorVO deptAuditorVO : deptAuditorVOList){
                    if(StrUtil.isNotBlank(auditorNames)){
                        auditorNames += "、" + deptAuditorVO.getUser_name() + "（" +  deptAuditorVO.getUser_code() + "）";
                    } else {
                        auditorNames = deptAuditorVO.getUser_name() + "（" +  deptAuditorVO.getUser_code() + "）";
                    }
                }
                deptAuditorRuleVO.setOrg_name(user2roleList.size() > 0 ? user2roleList.get(0).getOrgName() : null);
                deptAuditorRuleVO.setAuditor_names(auditorNames);
                deptAuditorRuleVOList.add(deptAuditorRuleVO);
            }
            deptAuditorRuleRoleVO.setRule_id(role.getRoleId());
            deptAuditorRuleRoleVO.setRule_name(role.getRoleName());
            deptAuditorRuleRoleVO.setDept_auditor_rule_list(deptAuditorRuleVOList);
        }
        return deptAuditorRuleRoleVO;
    }


    public static List<DeptAuditorRuleDTO> builderDeptAuditorRuleList(Role role) {
        if(null != role){
            List<User2role> allAuditorList = role.getAuditorList();
            Map<String, List<User2role>> deptAuditorMap =  allAuditorList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
            List<DeptAuditorRuleDTO> deptAuditorRuleDTOList = new ArrayList<>();
            for (String orgId : deptAuditorMap.keySet()) {
                DeptAuditorRuleDTO deptAuditorRuleDTO = new DeptAuditorRuleDTO();
                deptAuditorRuleDTO.setOrg_id(orgId);
                List<User2role> user2roleList = deptAuditorMap.get(orgId);
                List<DeptAuditorDTO> deptAuditorVOList = new ArrayList<>();
                for(User2role user2role : user2roleList){
                    deptAuditorVOList.add(DeptAuditorDTO.builder(user2role));
                }
                deptAuditorRuleDTO.setAuditor_list(deptAuditorVOList);
                String auditorNames = "";
                for(DeptAuditorDTO deptAuditorVO : deptAuditorVOList){
                    if(StrUtil.isNotBlank(auditorNames)){
                        auditorNames += "、" + deptAuditorVO.getUser_name() + "（" +  deptAuditorVO.getUser_code() + "）";
                    } else {
                        auditorNames = deptAuditorVO.getUser_name() + "（" +  deptAuditorVO.getUser_code() + "）";
                    }
                }
                deptAuditorRuleDTO.setOrg_name(user2roleList.size() > 0 ? user2roleList.get(0).getOrgName() : null);
                deptAuditorRuleDTO.setAuditor_names(auditorNames);
                deptAuditorRuleDTOList.add(deptAuditorRuleDTO);
            }
            return deptAuditorRuleDTOList;
        }
        return null;
    }

}
