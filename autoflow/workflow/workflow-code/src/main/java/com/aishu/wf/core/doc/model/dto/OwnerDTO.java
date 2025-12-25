package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import lombok.Data;

@Data
@ApiModel(value = "获取文档所有者参数对象")
public class OwnerDTO {
    private String id;
    private String name;
    private String type;
}
