package com.aishu.wf.core.engine.identity.model.dto;

import com.aishu.wf.core.engine.identity.model.User2role;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

@ApiModel(value = "部门审核员对象")
@Data
public class DeptAuditorDTO {

    @ApiModelProperty(value = "规则ID", example = "")
    private String rule_id;

    @ApiModelProperty(value = "用户ID", example = "")
    private String user_id;

    @ApiModelProperty(value = "用户编码", example = "")
    private String user_code;

    @ApiModelProperty(value = "用户名称", example = "")
    private String user_name;

    @ApiModelProperty(value = "组织ID", example = "")
    private String org_id;

    @ApiModelProperty(value = "组织名称", example = "")
    private String org_name;

    @ApiModelProperty(value = "备注", example = "")
    private String remark;

    @ApiModelProperty(value = "排序", example = "")
    private Integer sort;

    @ApiModelProperty(value = "创建人ID", example = "")
    private String create_user_id;

    @ApiModelProperty(value = "创建人名称", example = "")
    private String create_user_name;

    @ApiModelProperty(value = "创建时间", example = "")
    private Date create_time;

    public static DeptAuditorDTO builder(User2role user2role) {
        DeptAuditorDTO deptAuditorDTO = new DeptAuditorDTO();
        deptAuditorDTO.setRule_id(user2role.getRoleId());
        deptAuditorDTO.setUser_id(user2role.getUserId());
        deptAuditorDTO.setUser_code(user2role.getUserCode());
        deptAuditorDTO.setUser_name(user2role.getUserName());
        deptAuditorDTO.setOrg_id(user2role.getOrgId());
        deptAuditorDTO.setOrg_name(user2role.getOrgName());
        deptAuditorDTO.setRemark(user2role.getRemark());
        deptAuditorDTO.setSort(user2role.getSort());
        deptAuditorDTO.setCreate_user_id(user2role.getCreateUserId());
        deptAuditorDTO.setCreate_user_name(user2role.getCreateUserName());
        deptAuditorDTO.setCreate_time(user2role.getCreateTime());
        return deptAuditorDTO;
    }

    public static User2role builderModel(DeptAuditorDTO deptAuditorDTO) {
        User2role user2role = new User2role();
        user2role.setRoleId(deptAuditorDTO.getRule_id());
        user2role.setUserId(deptAuditorDTO.getUser_id());
        user2role.setUserCode(deptAuditorDTO.getUser_code());
        user2role.setUserName(deptAuditorDTO.getUser_name());
        user2role.setOrgId(deptAuditorDTO.getOrg_id());
        user2role.setOrgName(deptAuditorDTO.getOrg_name());
        user2role.setRemark(deptAuditorDTO.getRemark());
        user2role.setSort(deptAuditorDTO.getSort());
        user2role.setCreateTime(deptAuditorDTO.getCreate_time());
        user2role.setCreateUserId(deptAuditorDTO.getCreate_user_id());
        user2role.setCreateUserName(deptAuditorDTO.getCreate_user_name());
        return user2role;
    }
}
