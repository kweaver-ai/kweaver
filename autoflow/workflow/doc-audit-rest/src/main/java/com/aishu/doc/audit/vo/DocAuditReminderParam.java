package com.aishu.doc.audit.vo;

import javax.validation.constraints.Size;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @description 催办接口请求参数
 * @author siyu.chen
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "催办参数对象")
public class DocAuditReminderParam {
    @ApiModelProperty(value = "审核员ID集合", example = "[\"66c29bd7-9c09-468e-80a2-1af606f25ce7\"]", required = true)
    @Size(min = 1)
    private String[] auditors;

    @ApiModelProperty(value = "是否为任意审核", example = "false")
    private Boolean is_arbitrary;

    @Size(max = 300, message = "催办备注")
    @ApiModelProperty(value = "催办备注", example = "催办备注")
    private String remark;
}
