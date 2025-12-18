package com.aishu.wf.core.doc.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_wf_transfer_info")
public class TransferInfo implements Serializable {
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
     * 转审审核员
     */
    @TableField("transfer_auditor")
    private String transferAuditor;

    /**
     * 转审的审核员名称
     */
    @TableField("transfer_auditor_name")
    private String transferAuditorName;

    /**
     * 转审人
     */
    @TableField("transfer_by")
    private String transferBy;

    /**
     * 转审人名称
     */
    @TableField("transfer_by_name")
    private String transferByName;

    /**
     * 转审原因
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
