package com.aishu.wf.core.engine.identity.model.dto;

import com.aishu.wf.core.engine.identity.model.Role;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

@ApiModel(value = "部门审核员规则角色参数对象")
@Data
public class DeptAuditorRuleRoleDTO {

    @ApiModelProperty(value = "规则ID")
    private String rule_id;

    @ApiModelProperty(value = "规则名称", example = "", required = true)
    @Size(max = 128,message = "规则名称不能超过128")
    private String rule_name;

    @ApiModelProperty(value = "流程租户ID", example = "as_workflow")
    private String tenant_id;

    @ApiModelProperty(value = "是否为审核员规则模板", example = "Y")
    private String template;

    @ApiModelProperty(value = "部门审核员规则列表")
    private List<DeptAuditorRuleDTO> dept_auditor_rule_list;

    /*public static DeptAuditorRuleRoleDTO builder(Role role) {
        DeptAuditorRuleRoleDTO deptAuditorRuleRoleDTO = new DeptAuditorRuleRoleDTO();
        deptAuditorRuleRoleDTO.setRole_id(role.getRoleId());
        deptAuditorRuleRoleDTO.setRole_name(role.getRoleName());
        deptAuditorRuleRoleDTO.setRole_sort(role.getRoleSort());
        deptAuditorRuleRoleDTO.setRole_type(role.getRoleType());
        deptAuditorRuleRoleDTO.setRole_app_id(role.getRoleAppId());

        List<User2role> auditorList = role.getAuditorList();
        List<DeptAuditorRuleDTO> deptAuditorRuleDTOList = new ArrayList<>();
        List<DeptAuditorDTO> auditorDTOList = new ArrayList<>();
        auditorList.forEach(item -> {
            DeptAuditorDTO auditorDTO = DeptAuditorDTO.builder(item);
            auditorDTOList.add(auditorDTO);
        });
        return deptAuditorRuleRoleDTO;
    }*/

    public static Role builderModel(DeptAuditorRuleRoleDTO deptAuditorRuleRoleDTO) {
        Role role = new Role();
        role.setRoleId(deptAuditorRuleRoleDTO.getRule_id());
        role.setRoleName(deptAuditorRuleRoleDTO.getRule_name());
        role.setRoleAppId(deptAuditorRuleRoleDTO.getTenant_id());
        role.setTemplate(deptAuditorRuleRoleDTO.getTemplate());
        return role;
    }
}
