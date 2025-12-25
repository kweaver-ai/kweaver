package com.aishu.wf.core.doc.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2023/1/3 13:50
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_wf_countersign_info")
public class CountersignInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 流程实例ID
     */
    @TableField("proc_inst_id")
    private String procInstId;

    /**
     * 任务ID
     */
    @TableField("task_id")
    private String taskId;

    /**
     * 任务定义KEY
     */
    @TableField("task_def_key")
    private String taskDefKey;

    /**
     * 加签的审核员
     */
    @TableField("countersign_auditor")
    private String countersignAuditor;

    /**
     * 加签的审核员名称
     */
    @TableField("countersign_auditor_name")
    private String countersignAuditorName;

    /**
     * 加签人
     */
    @TableField("countersign_by")
    private String countersignBy;

    /**
     * 加签人名称
     */
    @TableField("countersign_by_name")
    private String countersignByName;

    /**
     * 加签原因
     */
    @TableField("reason")
    private String reason;

    /**
     * 批次
     */
    @TableField("batch")
    private Integer batch;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;
}
