package com.aishu.wf.api.model;

import com.aishu.wf.core.doc.model.CountersignInfo;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2023/1/3 17:48
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "加签信息对象")
public class CountersignInfoVO {

    @ApiModelProperty(value = "流程实例ID")
    private String proc_inst_id;

    @ApiModelProperty(value = "任务ID")
    private String task_id;

    @ApiModelProperty(value = "任务定义KEY")
    private String task_def_key;

    @ApiModelProperty(value = "加签的审核员")
    private String countersign_auditor;

    @ApiModelProperty(value = "加签的审核员名称")
    private String countersign_auditor_name;

    @ApiModelProperty(value = "加签人")
    private String countersign_by;

    @ApiModelProperty(value = "加签人名称")
    private String countersign_by_name;

    @ApiModelProperty(value = "加签原因")
    private String reason;

    @ApiModelProperty(value = "批次")
    private Integer batch;

    @ApiModelProperty(value = "创建时间")
    private Date create_time;

    public static CountersignInfoVO buildCountersignInfoVO(CountersignInfo countersignInfo) {
        CountersignInfoVO result = CountersignInfoVO.builder().proc_inst_id(countersignInfo.getProcInstId())
                .task_id(countersignInfo.getTaskId())
                .task_def_key(countersignInfo.getTaskDefKey())
                .countersign_auditor(countersignInfo.getCountersignAuditor())
                .countersign_auditor_name(countersignInfo.getCountersignAuditorName())
                .countersign_by_name(countersignInfo.getCountersignByName())
                .reason(countersignInfo.getReason())
                .batch(countersignInfo.getBatch())
                .create_time(countersignInfo.getCreateTime())
                .countersign_by(countersignInfo.getCountersignBy()).build();
        return result;
    }
}
