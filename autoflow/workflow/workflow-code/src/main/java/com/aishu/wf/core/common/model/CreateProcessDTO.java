package com.aishu.wf.core.common.model;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/22 15:58
 */
@Data
public class CreateProcessDTO {

    @ApiModelProperty(value = "流程名称", required = true)
    @NotBlank
    @Size(max = 50, message = "流程定义名称不能超过50")
    protected String process_name;

    @ApiModelProperty(value = "流程定义类型", example = "doc_sync", required = true)
    @Pattern(regexp = "doc_sync|doc_flow", message = "流程定义类型不正确")
    private String process_type;

    @ApiModelProperty(value = "策略类型，指定用户审核：named_auditor；部门审核员：dept_auditor；", required = true)
    @NotBlank
    @Pattern(regexp = "named_auditor|dept_auditor", message = "策略类型不正确")
    protected String strategy_type;

    @ApiModelProperty(value = "部门审核员规则ID")
    protected String rule_id;

    @ApiModelProperty(value = "审核人员列表")
    private List<CreateStrategyAuditorDTO> auditor_list;

    @ApiModelProperty(value = "流程定义KEY", hidden = true)
    protected String process_key;

    @ApiModelProperty(value = "环节定义ID", hidden = true)
    protected String act_def_id;

    @ApiModelProperty(value = "环节定义名称", hidden = true)
    protected String act_def_name;

    @ApiModelProperty(value = "流程定义xml", hidden = true)
    protected String process_xml;

}
