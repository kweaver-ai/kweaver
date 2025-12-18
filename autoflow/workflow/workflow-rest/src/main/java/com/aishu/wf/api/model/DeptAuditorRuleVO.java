package com.aishu.wf.api.model;

import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User2role;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/6/29 11:46
 */
@Data
@ApiModel(value = "部门审核员规则对象")
public class DeptAuditorRuleVO {

    @ApiModelProperty(value = "组织ID", example = "")
    private String org_id;

    @ApiModelProperty(value = "组织名称", example = "")
    private String org_name;

    @ApiModelProperty(value = "审核人员列表")
    private List<DeptAuditorVO> auditor_list;

    @ApiModelProperty(value = "审核人员名称")
    private String auditor_names;

    public static DeptAuditorRuleVO builder(Role role) {
        DeptAuditorRuleVO deptAuditorRuleVO = new DeptAuditorRuleVO();
        deptAuditorRuleVO.setOrg_id(role.getRoleId());
        deptAuditorRuleVO.setOrg_name(role.getRoleName());
        deptAuditorRuleVO.setAuditor_names(role.getAuditorNames());

        List<User2role> auditorList = role.getAuditorList();
        List<DeptAuditorVO> auditorVOList = new ArrayList<>();
        auditorList.forEach(item -> {
            DeptAuditorVO auditorVO = DeptAuditorVO.builder(item);
            auditorVOList.add(auditorVO);
        });
        deptAuditorRuleVO.setAuditor_list(auditorVOList);
        return deptAuditorRuleVO;
    }
}
