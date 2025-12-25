package com.aishu.wf.core.engine.core.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@ApiModel(value = "第三方审核配置数据类")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThirdAuditConfigDTO {

    @NotNull(message = "是否启用第三方审核为必填参数")
    @ApiModelProperty(value = "是否启用第三方审核", required = true, example = "true")
    private Boolean is_open;

    @ApiModelProperty(value = "第三方审核地址", example = "https://www.baidu.com")
    private String webhook_url;

 }
