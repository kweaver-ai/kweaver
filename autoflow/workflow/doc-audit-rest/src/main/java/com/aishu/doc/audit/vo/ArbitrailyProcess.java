package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import javax.validation.constraints.NotBlank;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/11/18 11:04
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "任意审核消息实体process对象")
public class ArbitrailyProcess {

    @NotBlank(message = "申请类型不能为空")
    @ApiModelProperty(value = "申请类型", required = true)
    private String audit_type;

    @NotBlank(message = "申请ID不能为空")
    @ApiModelProperty(value = "申请ID", required = true)
    private String apply_id;

    @ApiModelProperty(value = "上一个审核申请ID，重新发起时，作废上个申请", required = true)
    private String conflict_apply_id;

    @NotBlank(message = "申请人ID不能为空")
    @ApiModelProperty(value = "申请人ID", required = true)
    private String user_id;

    @ApiModelProperty(value = "申请人名称", required = true)
    private String user_name;

    @ApiModelProperty(value = "流程定义key", required = true)
    private String proc_def_key;

    @ApiModelProperty(value = "预设审核员数组", required = false)
    private List<String> predefined_auditor_ids;

    @ApiModelProperty(value = "是否自动审批", required = false, example = "true")
    private Boolean automatic_approval;
}
