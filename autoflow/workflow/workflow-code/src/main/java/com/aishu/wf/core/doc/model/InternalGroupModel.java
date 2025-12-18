package com.aishu.wf.core.doc.model;

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
@TableName("t_wf_internal_group")
public class InternalGroupModel {
	@TableId(value = "f_id", type = IdType.ASSIGN_UUID)
	private String id;
	
    @TableField(value = "f_group_id")
	private String groupID;
    
    @TableField(value = "f_expired_at")
	private long expiredAt;

    @TableField(value = "f_created_at")
	private long createdAt;
}
