package com.aishu.doc.audit.vo;

import javax.validation.constraints.NotBlank;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author siyu.chen
 * @version 1.0
 * @description: TODO
 * @date 2023 7/19
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="转审参数实体")
public class Transfer {

    @ApiModelProperty(value = "转审原因")
    private String reason;

    @NotBlank(message = "转审人不能为空")
    @ApiModelProperty(value = "审核员")
    private String auditor;
}
