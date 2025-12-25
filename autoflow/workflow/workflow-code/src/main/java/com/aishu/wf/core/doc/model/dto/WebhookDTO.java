package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 任意审核消息实体审核动态指定审核人webhook对象
 */
@Data
@ApiModel(value="任意审核消息实体审核动态指定审核人webhook对象")
public class WebhookDTO {

    @ApiModelProperty(value = "策略标识")
    private String strategy_tag;

    @ApiModelProperty(value = "webhook")
    private String webhook;

}
