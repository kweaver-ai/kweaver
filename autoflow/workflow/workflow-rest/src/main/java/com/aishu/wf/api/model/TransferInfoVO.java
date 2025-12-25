package com.aishu.wf.api.model;

import com.aishu.wf.core.doc.model.TransferInfo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * @author siyu.chen
 * @version 1.0
 * @description: TODO
 * @date 2023/7/25
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "转审信息对象")
public class TransferInfoVO {

    @ApiModelProperty(value = "流程实例ID")
    private String proc_inst_id;

    @ApiModelProperty(value = "任务ID")
    private String task_id;

    @ApiModelProperty(value = "任务定义KEY")
    private String task_def_key;

    @ApiModelProperty(value = "转审的审核员")
    private String transfer_auditor;

    @ApiModelProperty(value = "转审的审核员名称")
    private String transfer_auditor_name;

    @ApiModelProperty(value = "转审人")
    private String transfer_by;

    @ApiModelProperty(value = "转审人名称")
    private String transfer_by_name;

    @ApiModelProperty(value = "转审原因")
    private String reason;

    @ApiModelProperty(value = "批次")
    private Integer batch;

    @ApiModelProperty(value = "创建时间")
    private Date create_time;

    public static TransferInfoVO buildTransferInfoVO(TransferInfo transferInfo) {
        TransferInfoVO result = TransferInfoVO.builder().proc_inst_id(transferInfo.getProcInstId())
                .task_id(transferInfo.getTaskId())
                .task_def_key(transferInfo.getTaskDefKey())
                .transfer_auditor(transferInfo.getTransferAuditor())
                .transfer_auditor_name(transferInfo.getTransferAuditorName())
                .transfer_by(transferInfo.getTransferBy())
                .transfer_by_name(transferInfo.getTransferByName())
                .reason(transferInfo.getReason())
                .batch(transferInfo.getBatch())
                .create_time(transferInfo.getCreateTime()).build();
        return result;
    }
}
