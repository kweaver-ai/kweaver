package com.aishu.wf.core.engine.identity.model;


import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_wf_ge_property")
public class GeProperty implements Serializable {
	private static final long serialVersionUID = 5454155825314635342L;

	@TableId
	private String name_;

	@TableField("value_")
	private String value;

	@TableField("rev_")
	private String rev;
	
}
