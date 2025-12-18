package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

/**
 * 任意审核消息实体workflow对象
 */
@Data
@ApiModel(value="任意审核消息实体workflow对象")
public class WorkflowDTO {

    @ApiModelProperty(value = "审核内容和申请人的最高密级", example = "5")
    private Integer top_csf;

    @ApiModelProperty(value = "申请人名称", example = "[\"target\",\"source\"]")
    private List<String> msg_for_email;

    @ApiModelProperty(value = "audit_type",example = "[\"source\",\"target\",\"mode\"]")
    private List<String> msg_for_log;

    @ApiModelProperty(value = "通知内容（包括摘要，邮件，审核详情，审核消息需要展示的内容），json字符串")
    private String content;

    @ApiModelProperty(value = "摘要信息")
    private String abstract_info;

    @ApiModelProperty(value = "webhooks(用于动态指定审核员)")
    private List<WebhookDTO> webhooks;
}
