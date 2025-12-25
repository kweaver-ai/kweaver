package com.aishu.wf.core.engine.core.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 流程定义列表查询对象
 *
 * @author Liuchu
 * @since 2021-3-9 15:54:51
 */
@ApiModel(value = "流程定义列表查询对象")
@Data
public class ProcessDefinitionDTO extends BasePage {

    @ApiModelProperty(value = "流程定义key", example = "Process_SHARE001")
    private String key;

    @ApiModelProperty(value = "流程定义类型", example = "doc_sync")
    private String type_id;

    @ApiModelProperty(value = "流程定义名称", example = "文档同步流程")
    private String name;

    @NotBlank(message = "流程租户ID不能为空")
    @ApiModelProperty(value = "流程租户ID", example = "workflow")
    private String tenant_id;

    @ApiModelProperty(value = "审核员或部门审核员规则名称", example = "")
    private String auditor_word;

    @ApiModelProperty(value = "是否过滤失效流程（0表示不过滤  1表示过滤）")
    private Integer filter_invalid;

    @ApiModelProperty(value = "创建者", hidden = true)
    private String create_user;

    @ApiModelProperty(value = "审核员", hidden = true)
    private String auditor;

    @ApiModelProperty(value = "用户的角色集合", hidden = true)
    private String roles;

    @ApiModelProperty(value = "是否是流程模板（Y表示是流程模板）",  example = "Y")
    private String template;


    @ApiModelProperty(value = "是否过滤共享流程（0表示不过滤  1表示过滤）", hidden = true)
    private Integer filter_share = 0;

    @ApiModelProperty(value = "是否客户端流程中心（0表示否  1表示是）", hidden = true)
    private Integer process_client = 0;

    @ApiModelProperty(value = "流程定义名称集合", hidden = true)
    private String[] names;

    @ApiModelProperty(value = "创建者集合", hidden = true)
    private String[] create_users;

    @ApiModelProperty(value = "审核员集合", hidden = true)
    private String[] auditors;

    @ApiModelProperty(value = "部门审核员规则集合", hidden = true)
    private String[] rules;

}
