package com.aishu.wf.core.engine.identity.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "部门审核员规则角色参数对象")
@Data
public class DeptAuditorRuleRoleQueryDTO extends BasePage {

    @ApiModelProperty(value = "规则ID", example = "")
    private String id;

    @ApiModelProperty(value = "规则名称", example = "")
    private String name;

    @ApiModelProperty(value = "审核员名称", example = "")
    private String auditor;

    @ApiModelProperty(value = "用户的角色集合", hidden = true)
    private String roles;

    @ApiModelProperty(value = "规则名称", hidden = true)
    private String[] names;

    @ApiModelProperty(value = "审核员名称", hidden = true)
    private String[] auditors;

    @ApiModelProperty(value = "是否客户端流程中心（0表示否  1表示是）", hidden = true)
    private Integer process_client = 0;

    @ApiModelProperty(value = "是否是审核员规则模板（Y表示是）", hidden = true)
    private String  template ;

    @ApiModelProperty(value = "租户类型", hidden = true)
    private String  tenant_id;
}
