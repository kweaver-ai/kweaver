package com.aishu.wf.api.model;

import com.aishu.wf.core.engine.core.model.ProcessLogModel;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.activiti.engine.task.Comment;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Data
@ApiModel(value = "图形监控日志信息传输对象")
public class ProcessImageTraceLogVO {

    @ApiModelProperty(value = "环节列表")
    List<ProcessDetail> process_detail;

    @ApiModelProperty(value = "节点列表")
    List<Element> elements;

    /**
     * @description 流程明细
     * @author hanj
     */
    @Data
    public class ProcessDetail {

        @ApiModelProperty(value = "环节KEY", example = "UserTask_0zz6lcw")
        String act_def_key;

        @ApiModelProperty(value = "环节名称", example = "审核")
        String act_def_name;

        @ApiModelProperty(value = "审核人名称", example = "张三")
        String receive_user_name;

        @ApiModelProperty(value = "审核人部门", example = "事业部")
        String receive_org_name;

        @ApiModelProperty(value = "审核意见", example = "同意")
        String display_area;

        @ApiModelProperty(value = "补充说明", example = "我同意")
        String full_message;

        @ApiModelProperty(value = "接受时间", example = "2021-03-04 10:39:08")
        Date start_time;

        @ApiModelProperty(value = "审核时间", example = "2021-03-04 10:39:08")
        Date end_time;

        @ApiModelProperty(value = "环节状态", example = "cancel_process")
        String action_type;

        @ApiModelProperty(value = "删除原因", example = "审核不合格")
        String delete_reason;

        public ProcessDetail(ProcessLogModel processLogModel) {
            this.act_def_key = processLogModel.getActDefKey();
            this.act_def_name = processLogModel.getActDefName();
            this.receive_user_name = processLogModel.getReceiveUserName();
            this.receive_org_name = processLogModel.getReceiveOrgName();
            this.full_message = Optional.ofNullable(processLogModel.getComment()).map(Comment::getFullMessage).orElse("");
            this.display_area = Optional.ofNullable(processLogModel.getComment()).map(Comment::getDisplayArea).orElse("");
            this.start_time = processLogModel.getStartTime();
            this.end_time = processLogModel.getEndTime();
            this.action_type = processLogModel.getActionType();
            this.delete_reason = processLogModel.getDeleteReason();
        }
    }

    /**
     * @description 环节元素
     * @author hanj
     */
    @Data
    public class Element {

        @ApiModelProperty(value = "环节KEY", example = "UserTask_0zz6lcw")
        String activity_id;

        @ApiModelProperty(value = "环节类型", example = "startEvent")
        String type;

        @ApiModelProperty(value = "环节状态", example = "2")
        String status;

        public Element(Map<String, Object> map) {
            this.activity_id = map.getOrDefault("activityId", "").toString();
            this.type = map.getOrDefault("type", "").toString();
            this.status = map.getOrDefault("status", "").toString();
        }
    }
}
