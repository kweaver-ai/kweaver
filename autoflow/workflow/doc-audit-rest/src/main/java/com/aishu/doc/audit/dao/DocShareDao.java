package com.aishu.doc.audit.dao;

import com.aishu.doc.audit.model.DocShareModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import org.apache.ibatis.annotations.Param;

import java.util.List;


/**
 * 文件共享
 * @ClassName: DocShareDao   
 * @author: ouandyang
 * @date: 2021年1月8日 下午2:25:24
 */
public interface DocShareDao extends BaseMapper<DocShareModel>{
	
	public IPage<DocShareModel> selectShareApplyList(Page<DocShareModel> page,
													 @Param("status") String status, @Param("createUserId") String createUserId);
	
	public int selectShareApplyCount(@Param("status") String status, 
			@Param("createUserId") String createUserId);
	public IPage<DocShareModel> selectShareAuditList(Page<DocShareModel> page,
													 @Param("status") String status, @Param("assignee") String createUserId);
	
	public int selectShareAuditCount(@Param("status") String status, 
			@Param("assignee") String createUserId);

	public List<DocShareModel> selectShareListByTask(@Param("procDefId") String procDefId,
													 @Param("taskDeyKey") String taskDeyKey, @Param("assignee") String assignee);
}
