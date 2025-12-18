package com.aishu.wf.core.doc.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@ApiModel(value = "第三方审核请求对象")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThirdAuditModel {

    @ApiModelProperty(value = "触发发送通知的事件类型名")
    private String eventtype;

    @ApiModelProperty(value = "申请时间，unix时间戳(单位：微秒)")
    private String createdate;

    @ApiModelProperty(value = "申请发起者的显示名")
    private String creatorName;

    @ApiModelProperty(value = "文件密级,5~15，如果是文件夹，则为0")
    private String csflevel;

    @ApiModelProperty(value = "申请记录唯一标识")
    private String applyid;

    @ApiModelProperty(value = "文档 gns 路径")
    private String docid;

    @ApiModelProperty(value = "文档名称")
    private String docname;

    @ApiModelProperty(value = "是否为文件夹")
    private String isdir;

    @ApiModelProperty(value = "权限操作类型")
    private String optype;

    @ApiModelProperty(value = "访问者类型")
    private String accessortype;

    @ApiModelProperty(value = "访问者名称")
    private String accessorname;

    @ApiModelProperty(value = "拒绝权限值")
    private String denyvalue;

    @ApiModelProperty(value = "允许权限值")
    private String allowvalue;

    @ApiModelProperty(value = "截至时间，unix时间戳(单位：微秒)")
    private String endtime;

    @ApiModelProperty(value = "是否启用继承")
    private String inherit;

}
