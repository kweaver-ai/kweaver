package com.aishu.wf.core.common.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 系统日志实体
 * @ClassName: SysLogBean
 * @author: ouandyang
 * @date: 2021年4月12日
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="系统日志实体")
@TableName("t_wf_sys_log")
public class SysLogBean{
	public final static String TYPE_INFO = "info";
	public final static String TYPE_WARN = "warn";
	public final static String TYPE_ERROR = "error";

	/**
	 * 主键ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 日志类型 info信息，warn警告，error异常
	 */
	private String type;

	/**
	 * 接口地址
	 */
	private String url;

	/**
	 * 系统名称
	 */
	private String systemName;

	/**
	 * 访问人ID
	 */
	private String userId;

	/**
	 * 信息
	 */
	private String msg;

	/**
	 * 附加信息
	 */
	private String exMsg;

	/**
	 * 创建时间
	 */
	private Date createTime;

}
