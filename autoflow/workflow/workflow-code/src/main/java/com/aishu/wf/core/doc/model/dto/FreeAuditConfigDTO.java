package com.aishu.wf.core.doc.model.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.FreeAuditConfigModel;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @Description 配置返回参数
 * @Author crzep
 * @Date 2021/4/14 17:24
 * @VERSION 1.0
 **/
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="自动审核（密级）参数对象")
public class FreeAuditConfigDTO {

    @ApiModelProperty(value = "当前设置的密级")
    @NotNull
    private Integer csf_level;

    @ApiModelProperty(value = "直属部门免审核状态")
    @NotBlank
    @ArrayValuable(values = {DocConstants.FREE_AUDIT_SWITCH_ENABLE,
            DocConstants.FREE_AUDIT_SWITCH_DISABLE}, message = "开关状态码不正确")
    private String department_avoid_status;

    /**
     * @description 构建免审核实体
     * @author ouandyang
     * @param
     * @updateTime 2021/5/25
     */
    public FreeAuditConfigModel buildFreeAuditConfigModel() {
        return FreeAuditConfigModel.builder()
                .csf_level(this.getCsf_level())
                .department_avoid_status(this.getDepartment_avoid_status())
                .build();
    }
}