package com.aishu.doc.audit.model;

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
@TableName("t_wf_doc_audit_sendback_message")
public class DocAuditSendBackModel {
    /**
	 * ID
	 */
	@TableId(value = "f_id", type = IdType.ASSIGN_UUID)
	private String id;

    /**
     * 流程实例 ID
     */
    @TableField("f_proc_inst_id")
    private String procInstId;

    /**
     * 消息中心消息ID
     */
    @TableField("f_message_id")
    private String messageId;

    /**
	 * 创建时间
	 */
    @TableField("f_created_at")
	private Date createTime;
    
    /**
     * 更新时间
	 */
    @TableField("f_updated_at")
	private Date updateTime;
}
