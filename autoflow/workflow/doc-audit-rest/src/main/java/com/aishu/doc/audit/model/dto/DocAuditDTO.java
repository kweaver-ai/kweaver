package com.aishu.doc.audit.model.dto;

import javax.validation.constraints.NotBlank;

import com.aishu.wf.core.common.model.BasePage;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "列表查询参数")
@Data
public class DocAuditDTO extends BasePage {

    @ApiModelProperty(value = "文档名称")
    private String docName;

    @ApiModelProperty(value = "类型；realname共享给指定用户的申请，anonymous共享给任意用户的申请，sync同步申请，flow流转申请，security定密申请")
    @NotBlank
    private String type;

    @ApiModelProperty(value = "审核状态；pending-审核中，pass-已通过，reject-已驳回，avoid-自动审核通过，默认全部")
    @ArrayValuable(values = {
            WorkflowConstants.AUDIT_STATUS_DSH,
            WorkflowConstants.AUDIT_RESULT_PASS,
            WorkflowConstants.AUDIT_RESULT_REJECT,
            WorkflowConstants.AUDIT_RESULT_AVOID
    }, message = "status值不正确")
    private String status;
}
