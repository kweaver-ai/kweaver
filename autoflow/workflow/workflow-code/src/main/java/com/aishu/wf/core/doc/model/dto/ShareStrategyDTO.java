package com.aishu.wf.core.doc.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "共享文档审核策略")
@Data
public class ShareStrategyDTO extends BasePage {

    @ApiModelProperty(value = "文档类型，共享：se、定密：st", example = "se")
    private String doc_type;

    @ApiModelProperty(value = "文档名称", example = "测试上传文档123.txt")
    private String doc_name;

    @ApiModelProperty(value = "流程定义ID", example = "Process_FXZ59TKT:1:7286e791-78a6-11eb-8fc3-0242ac12000f")
    private String proc_def_id;

    @ApiModelProperty(value = "审核员名称", example = "审核员名称")
    private String auditor;

    @ApiModelProperty(value = "文档名称", hidden = true)
    private String[] doc_names;

    @ApiModelProperty(value = "审核员名称", hidden = true)
    private String[] auditors;

}
