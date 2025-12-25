package com.aishu.wf.api.model;

import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.core.model.ProcessLogModel;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.activiti.engine.task.Comment;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "审核员日志对象")
public class AuditorLogVO {


    @ApiModelProperty(value = "审核人ID", example = "4f644d1e-c4b6-11eb-ba83-080027383fc3")
    private String auditor;

    @ApiModelProperty(value = "审核人名称", example = "张三")
    private String auditor_name;

    @ApiModelProperty(value = "审核人账号", example = "zhangsan")
    private String account;

    @ApiModelProperty(value = "审核状态，pass表示通过 reject表示拒绝", example = "pass")
    private String audit_status;

    @ApiModelProperty(value = "审核意见", example = "同意")
    private String audit_idea;

    @ApiModelProperty(value = "接收时间", example = "2021-03-04 10:39:08")
    private Date start_time;

    @ApiModelProperty(value = "审核时间", example = "2021-03-04 10:39:18")
    private Date end_time;

    @ApiModelProperty(value = "环节实例ID", example = "")
    private String act_inst_id;

    @ApiModelProperty(value = "是否加签审核员，y表示是 n表示否", example = "")
    private String countersign;

    @ApiModelProperty(value = "当前环节审核状态，1-审核中 2-已拒绝 3-已通过 4-自动审核通过 5-作废 6-发起失败 70-已撤销", example = "1")
    private String proc_status;
    
    @ApiModelProperty(value = "当前环节审核员上传的附件文件gns", example = "gns://xxxxx")
    private List<String> attachments;

    public static AuditorLogVO buildAuditorLogVO(ProcessLogModel processLogModel) {
        AuditorLogVO result = AuditorLogVO.builder().auditor(processLogModel.getReceiveUserId())
                .auditor_name(processLogModel.getReceiveUserName())
                .account(processLogModel.getReceiveUserAccount())
                .start_time(processLogModel.getStartTime())
                .end_time(processLogModel.getEndTime())
                .countersign("n")
                .act_inst_id(processLogModel.getActInstId())
                .proc_status(processLogModel.getProcStatus())
                .attachments(processLogModel.getAttachments()).build();
        if (processLogModel.getComment() != null) {
            String comment = processLogModel.getComment().getDisplayArea();
            if ("同意".equals(comment)) {
                result.setAudit_status(WorkflowConstants.AUDIT_RESULT_PASS);
            } else if ("退回".equals(comment)) {
                result.setAudit_status(WorkflowConstants.AUDIT_RESULT_SENDBACK);
            } else {
                result.setAudit_status(WorkflowConstants.AUDIT_RESULT_REJECT);
            }
            result.setAudit_idea(processLogModel.getComment().getFullMessage());
        }
        return result;
    }
}
