package com.aishu.wf.api.model;

import com.aishu.wf.core.engine.identity.model.User2role;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

@ApiModel(value = "部门审核员对象")
@Data
public class DeptAuditorVO {

    @ApiModelProperty(value = "规则ID")
    private String role_id;

    @ApiModelProperty(value = "用户ID")
    private String user_id;

    @ApiModelProperty(value = "用户账号")
    private String user_code;

    @ApiModelProperty(value = "用户名称")
    private String user_name;

    @ApiModelProperty(value = "用户部门ID")
    private String org_id;

    @ApiModelProperty(value = "用户部门名称")
    private String org_name;

    @ApiModelProperty(value = "排序")
    private Integer sort;

    @ApiModelProperty(value = "创建人ID")
    private String create_user_id;

    @ApiModelProperty(value = "创建时间")
    private Date create_time;

    public static DeptAuditorVO builder(User2role user2role) {
        DeptAuditorVO auditorVO = new DeptAuditorVO();
        auditorVO.setRole_id(user2role.getRoleId());
        auditorVO.setUser_id(user2role.getUserId());
        auditorVO.setUser_code(user2role.getUserCode());
        auditorVO.setUser_name(user2role.getUserName());
        auditorVO.setOrg_id(user2role.getOrgId());
        auditorVO.setOrg_name(user2role.getOrgName());
        auditorVO.setSort(user2role.getSort());
        auditorVO.setCreate_user_id(user2role.getCreateUserId());
        auditorVO.setCreate_time(user2role.getCreateTime());
        return auditorVO;
    }

}
