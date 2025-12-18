package com.aishu.wf.core.doc.model;

import com.alibaba.fastjson.JSONObject;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
@ApiModel(value="自动审核（密级）对象")
public class FreeAuditConfigModel {

    @ApiModelProperty(value = "密级集合")
    private List<JSONObject> csf_levels;

    @ApiModelProperty(value = "当前设置的密级")
    private Integer csf_level;

    @ApiModelProperty(value = "直属部门免审核状态")
    private String department_avoid_status;
}