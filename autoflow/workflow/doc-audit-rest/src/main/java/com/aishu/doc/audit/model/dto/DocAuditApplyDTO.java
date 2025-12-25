package com.aishu.doc.audit.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "申请列表查询参数")
@Data
public class DocAuditApplyDTO extends BasePage {

    @ApiModelProperty(value = "文档名称")
    private String doc_name;

    @ApiModelProperty(value = "类型，realname表示共享给指定用户的申请 anonymous表示共享给任意用户的申请 sync表示同步申请 flow表示流转申请 security表示定密申请")
    private String type;

    @ApiModelProperty(value = "审核状态，默认全部 pending表示审核中 pass表示已通过 reject表示已驳回 avoid表示自动审核通过 undone表示已撤销 failed表示发起失败")
    @ArrayValuable(values = {
            DocConstants.AUDIT_STATUS_PENDING,
            DocConstants.AUDIT_STATUS_PASS,
            DocConstants.AUDIT_STATUS_REJECT,
            DocConstants.AUDIT_STATUS_AVOID,
            DocConstants.AUDIT_STATUS_FAILED,
            DocConstants.AUDIT_STATUS_UNDONE,
            DocConstants.AUDIT_STATUS_SENDBACK
    }, message = "status值不正确")
    private String status;

    @ApiModelProperty(value = "摘要集合", hidden = true)
    private String[] abstracts;

}
