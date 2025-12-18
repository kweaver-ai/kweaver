package com.aishu.wf.api.model.config;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

/**
 * @description 自动审核部门VO
 * @author hanj
 */
@Data
@Builder
@ApiModel(value="自动审核部门对象")
public class FreeAuditDeptVO {

    @ApiModelProperty(value = "自动审核id", required = true)
    private String id;

    @ApiModelProperty(value = "部门名称", required = true)
    private String department_name;

    public FreeAuditDeptVO(String id, String department_name) {
        this.id = id;
        this.department_name = department_name;
    }
}