package com.aishu.doc.audit.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "待办列表查询参数")
@Data
public class DocAuditTaskDTO extends BasePage {

    @ApiModelProperty(value = "文档名称")
    private String doc_name;

    @ApiModelProperty(value = "发起人数组")
    private String [] apply_user_names;

    @ApiModelProperty(value = "摘要数组")
    private String [] abstracts;

    @ApiModelProperty(value = "文档Id")
    private String biz_id;

    @ApiModelProperty(value = "类型，realname表示共享给指定用户的申请 anonymous表示共享给任意用户的申请 sync表示同步申请 flow表示流转申请 security表示定密申请")
    private String type;

}
