package com.aishu.wf.core.doc.model;

import java.util.Date;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_inbox")
public class InBoxModel {
    @TableId(value = "f_id", type = IdType.ASSIGN_UUID)
    private String id;

    @TableField(value = "f_topic")
    private String topic;

    @TableField(value = "f_message")
    private String message;

    @TableField(value = "f_create_time")
    private Date createTime;
}
