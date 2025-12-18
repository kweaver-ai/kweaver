package com.aishu.wf.core.engine.config.model;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;
import java.util.List;

@ApiModel(value = "流程建模实体")
@Data
public class ProcDefModel {

    @ApiModelProperty(value = "流程定义ID", example = "Process_20YPUS2H:2:6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
    private String id;

    @ApiModelProperty(value = "流程定义key", example = "Process_20YPUS2H")
    private String key;

    @ApiModelProperty(value = "流程定义名称", example = "测试新建流程123")
    private String name;

    @ApiModelProperty(value = "租户ID", example = "as_workflow")
    private String tenantId;

    @ApiModelProperty(value = "流程xml", example = "<?xml />")
    private String flowXml;

    @ApiModelProperty(value = "共享文档审核访问配置")
    private List<DocShareStrategy> docShareStrategyList;

    @ApiModelProperty(value = "流程高级设置")
    private AdvancedSetupDTO advancedSetup;

    @ApiModelProperty(value = "流程定义类型", example = "doc_share")
    private String type;

    @ApiModelProperty(value = "流程定义类型名称", example = "文档共享审核")
    private String typeName;

    @ApiModelProperty(value = "流程定义说明", example = "这个一个文档共享审核流程定义")
    private String description;

    @ApiModelProperty(value = "流程版本号", example = "0")
    private Integer version;

    @ApiModelProperty(value = "流程创建者", example = "admin")
    private String createUser;

    @ApiModelProperty(value = "流程创建者名称", example = "admin")
    private String createUserName;

    @ApiModelProperty(value = "流程创建时间", example = "2021-03-16T11:11:58.000+00:00")
    private Date createTime;
}
