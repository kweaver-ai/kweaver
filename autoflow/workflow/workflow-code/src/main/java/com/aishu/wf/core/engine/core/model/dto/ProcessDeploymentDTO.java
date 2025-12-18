package com.aishu.wf.core.engine.core.model.dto;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyDTO;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;
import java.util.stream.Collectors;

@ApiModel(value = "流程建模参数对象")
@Data
public class ProcessDeploymentDTO {

    @ApiModelProperty(value = "流程定义ID", example = "Process_20YPUS2H:2:6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
    private String id;

    @ApiModelProperty(value = "流程定义key", example = "Process_20YPUS2H")
    @Size(max = 50,message = "流程定义key不能超过50")
    private String key;

    @ApiModelProperty(value = "流程定义名称", example = "测试新建流程123")
    @Size(max = 128,message = "流程定义名称不能超过128")
    private String name;

    @NotBlank(message = "流程租户ID不能为空")
    @ApiModelProperty(value = "流程租户ID", example = "workflow")
    @Size(max = 60,message = "流程租户ID不能超过60")
    private String tenant_id;

    @ApiModelProperty(value = "流程xml", example = "<?xml />")
    private String flow_xml;

    @ApiModelProperty(value = "共享文档审核访问策略")
    private List<DocShareStrategyDTO> audit_strategy_list;

    @ApiModelProperty(value = "流程高级设置")
    @Valid
    private AdvancedSetupDTO advanced_setup;

    @ApiModelProperty(value = "流程定义类型", example = "doc_share")
    //@Size(max = 10,message = "流程定义类型不能超过10")
    private String type;

    @ApiModelProperty(value = "流程定义类型名称", example = "文档共享审核")
    @Size(max = 20,message = "流程定义类型名称不能超过20")
    private String type_name;

    @ApiModelProperty(value = "是否是流程模板", example = "是否是流程模板")
    private String template;

    @ApiModelProperty(value = "流程定义说明", example = "这个一个文档共享审核流程定义")
    @Size(max = 300,message = "流程定义说明不能超过300")
    private String description;

    @ApiModelProperty(value = "流程版本号", example = "0")
    @Max(value = 100,message = "流程版本号太大")
    private Integer version;

    @ApiModelProperty(value = "是否复制流程（0标识否，1表示是）", example = "0")
    @Max(value = 1,message = "是否复制流程太大")
    private Integer is_copy;

    public static ProcessDeploymentDTO builder(ProcDefModel procDefModel) {
        ProcessDeploymentDTO modelRequest = new ProcessDeploymentDTO();
        modelRequest.setId(procDefModel.getId());
        modelRequest.setKey(procDefModel.getKey());
        modelRequest.setName(procDefModel.getName());
        modelRequest.setTenant_id(procDefModel.getTenantId());
        modelRequest.setFlow_xml(procDefModel.getFlowXml());
        List<DocShareStrategy> scopeList = procDefModel.getDocShareStrategyList();
        List<DocShareStrategyDTO> scopeRequests = scopeList.stream().map(DocShareStrategyDTO::builder).collect(Collectors.toList());
        modelRequest.setAudit_strategy_list(scopeRequests);
        modelRequest.setType(procDefModel.getType());
        modelRequest.setType_name(procDefModel.getTypeName());
        modelRequest.setDescription(procDefModel.getDescription());
        modelRequest.setVersion(procDefModel.getVersion());
        if (procDefModel.getAdvancedSetup() != null) {
            AdvancedSetupDTO advancedSetupDTO = new AdvancedSetupDTO();
            advancedSetupDTO.setRename_switch(procDefModel.getAdvancedSetup().getRename_switch());
            advancedSetupDTO.setAnonymity_switch(procDefModel.getAdvancedSetup().getAnonymity_switch());
            advancedSetupDTO.setPerm_config(procDefModel.getAdvancedSetup().getPerm_config());
            modelRequest.setAdvanced_setup(advancedSetupDTO);
        }
        return modelRequest;
    }

    public static ProcDefModel builderModel(ProcessDeploymentDTO modelRequest) {
        ProcDefModel model = new ProcDefModel();
        model.setId(modelRequest.getId());
        model.setKey(modelRequest.getKey());
        model.setName(modelRequest.getName());
        model.setTenantId(modelRequest.getTenant_id());
        model.setFlowXml(modelRequest.getFlow_xml());
        List<DocShareStrategyDTO> scopeRequestList = modelRequest.getAudit_strategy_list();
        List<DocShareStrategy> scopeRequests = scopeRequestList.stream()
                .map(DocShareStrategyDTO::builderModel).collect(Collectors.toList());
        model.setDocShareStrategyList(scopeRequests);
        model.setType(modelRequest.getType());
        model.setTypeName(modelRequest.getType_name());
        model.setDescription(modelRequest.getDescription());
        model.setVersion(modelRequest.getVersion());
        return model;
    }

}
