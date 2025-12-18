package com.aishu.wf.api.model;

import cn.hutool.core.date.DateUtil;

import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyDTO;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

import static cn.hutool.core.date.DatePattern.UTC_PATTERN;

@ApiModel(value = "流程建模对象")
@Data
public class ProcessModelVO {

    @ApiModelProperty(value = "流程定义ID", example = "Process_20YPUS2H:2:6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
    private String id;

    @ApiModelProperty(value = "流程定义key", example = "Process_20YPUS2H")
    private String key;

    @ApiModelProperty(value = "流程定义名称", example = "测试新建流程123")
    private String name;

    @ApiModelProperty(value = "租户ID", example = "as_workflow")
    private String tenant_id;

    @ApiModelProperty(value = "流程xml", example = "<?xml />")
    private String flow_xml;

    @ApiModelProperty(value = "流程高级设置")
    private AdvancedSetupDTO advancedSetup;

    @ApiModelProperty(value = "共享文档审核访问配置")
    private List<DocShareStrategyDTO> docShareStrategyList;

    @ApiModelProperty(value = "流程定义类型", example = "doc_share")
    private String type;

    @ApiModelProperty(value = "流程定义类型名称", example = "文档共享审核")
    private String type_name;

    @ApiModelProperty(value = "流程定义说明", example = "这个一个文档共享审核流程定义")
    private String description;

    @ApiModelProperty(value = "流程版本号", example = "0")
    private Integer version;

    @ApiModelProperty(value = "流程创建者", example = "admin")
    private String create_user;

    @ApiModelProperty(value = "流程创建者名称", example = "admin")
    private String create_user_name;

    @ApiModelProperty(value = "流程创建时间", example = "2018-02-11T09:40:11Z")
    private String create_time;

    public static ProcessModelVO builder(ProcDefModel procDefModel) {
        ProcessModelVO vo = new ProcessModelVO();
        vo.setId(procDefModel.getId());
        vo.setKey(procDefModel.getKey());
        vo.setName(procDefModel.getName());
        vo.setTenant_id(procDefModel.getTenantId());
        vo.setFlow_xml(procDefModel.getFlowXml());
        vo.setType(procDefModel.getType());
        vo.setType_name(procDefModel.getTypeName());
        vo.setDescription(procDefModel.getDescription());
        vo.setVersion(procDefModel.getVersion());
        vo.setCreate_user(procDefModel.getCreateUser());
        vo.setCreate_user_name(procDefModel.getCreateUserName());
        vo.setCreate_time(DateUtil.format(procDefModel.getCreateTime(), UTC_PATTERN));
        vo.setAdvancedSetup(procDefModel.getAdvancedSetup());
        if(!WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(procDefModel.getType()) ||
            WorkflowConstants.WORKFLOW_TYPE_SHARE.equals(procDefModel.getType()) && !CommonConstants.TENANT_AS_WORKFLOW.equals(procDefModel.getTenantId())){
            List<DocShareStrategyDTO> docShareStrategyDTOList = new ArrayList<>();
            for (DocShareStrategy strategy : procDefModel.getDocShareStrategyList()) {
                docShareStrategyDTOList.add(DocShareStrategyDTO.builder(strategy));
            }
            vo.setDocShareStrategyList(docShareStrategyDTOList);
        }
        return vo;
    }

}
