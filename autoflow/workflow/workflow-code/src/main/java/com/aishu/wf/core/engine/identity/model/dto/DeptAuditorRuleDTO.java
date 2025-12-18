package com.aishu.wf.core.engine.identity.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

@ApiModel(value = "部门审核员规则参数对象")
@Data
public class DeptAuditorRuleDTO {

    @ApiModelProperty(value = "组织ID", example = "", required = true)
    private String org_id;

    @ApiModelProperty(value = "组织名称", example = "", required = true)
    private String org_name;

    @ApiModelProperty(value = "审核人员列表")
    private List<DeptAuditorDTO> auditor_list;

    @ApiModelProperty(value = "审核人员名称", example = "", hidden = true)
    private String auditor_names;
}
