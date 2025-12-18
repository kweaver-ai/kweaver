package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@ApiModel(value = "第三方审核通知对象")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThirdAuditNotificationDTO {

    @ApiModelProperty(value = "通知类型")
    String type;

    @ApiModelProperty(value = "申请记录唯一标识")
    String applyid;

    @ApiModelProperty(value = "审核结果")
    Boolean result;

    @ApiModelProperty(value = "审核意见")
    String comment;

}
