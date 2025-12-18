package com.aishu.wf.core.engine.core.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 流程任务对象
 *
 * @author Liuchu
 * @since 2021-3-20 16:36:49
 */
@Data
@ApiModel(value = "流程任务对象")
public class ProcessTaskModel implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "任务ID", example = "67f28095-7d55-11eb-b88e-0242ac12000e")
    String id;

    @ApiModelProperty(value = "任务名称", example = "67f28095-7d55-11eb-b88e-0242ac12000e")
    String name;

    @ApiModelProperty(value = "流程定义ID", example = "Process_QM57BLUS:6:67f28095-7d55-11eb-b88e-0242ac12000e")
    String procDefId;

    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程")
    String procDefName;

    @ApiModelProperty(value = "流程实例ID", example = "a9ffcaf-8645-11eb-93b1-00ff1169f9ce")
    String procInstId;

    @ApiModelProperty(value = "任务定义Key", example = "7e3ebcd-6606-11eb-819b-5654eb2299f3")
    String key;

    @ApiModelProperty(value = "审核员部门ID", example = "7a9ffcd-7c92-11eb-9bd1-00ff1169f9ce")
    String assigneeOrgId;

    @ApiModelProperty(value = "审核员部门名称", example = "技术中心")
    String assigneeOrgName;

    @ApiModelProperty(value = "审核员ID", example = "d3cc8f02-7c92-11eb-9bd1-00ff1601c9e0")
    String assigneeUserId;

    @ApiModelProperty(value = "审核员名称", example = "王五")
    String assigneeUserName;

    @ApiModelProperty(value = "流程标题", example = "共享审核流程标题")
    String procTitle;

    @ApiModelProperty(value = "流程起草人Id", example = "admin")
    String sendUserId;

    @ApiModelProperty(value = "流程起草人", example = "管理员")
    String sendUserName;

    @ApiModelProperty(value = "流程起草部门ID", example = "3cc8f02-7c92-11eb-9bd1-00ff1601c9e0")
    String sendOrgId;

    @ApiModelProperty(value = "流程起草部门名称", example = "技术中心")
    String sendOrgName;

    @ApiModelProperty(value = "创建时间", example = "2021-03-04 10:39:08")
    Date createTime;

}
