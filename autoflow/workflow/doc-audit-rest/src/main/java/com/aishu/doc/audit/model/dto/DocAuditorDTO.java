package com.aishu.doc.audit.model.dto;

import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class DocAuditorDTO {

    @ApiModelProperty(value = "id")
    private String id;

    @ApiModelProperty(value = "名称")
    @NotBlank
    private String name;

    @ApiModelProperty(value = "账号")
    @NotBlank
    private String account;

    @ApiModelProperty(value = "审核状态；pending-审核中，pass-已通过，reject-已驳回，avoid-自动审核通过，默认全部")
    @ArrayValuable(values = {
            WorkflowConstants.AUDIT_STATUS_DSH,
            WorkflowConstants.AUDIT_RESULT_PASS,
            WorkflowConstants.AUDIT_RESULT_REJECT,
            WorkflowConstants.AUDIT_RESULT_AVOID
    }, message = "status值不正确")
    private String status;

    @ApiModelProperty(value = "是否加签审核员，y表示是 n表示否", example = "")
    private String countersign;

    private String auditDate;
}
