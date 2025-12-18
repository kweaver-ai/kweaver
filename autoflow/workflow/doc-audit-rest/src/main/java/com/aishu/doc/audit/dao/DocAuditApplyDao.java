package com.aishu.doc.audit.dao;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

import org.apache.ibatis.annotations.Param;


/**
 * @description 文件审核申请
 * @author ouandyang
 */
public interface DocAuditApplyDao extends BaseMapper<DocAuditApplyModel>{

    /**
     * @description 我的待办列表
     * @author ouandyang
     * @param  page 分页参数
     * @param  type 申请类型
     * @param  userId 用户ID
     * @updateTime 2021/5/15
     */
    IPage<DocAuditApplyModel> selectTodoApplyList(Page<DocAuditApplyModel> page,
                                               @Param("abstracts") String[] abstracts, @Param("types") String[] types, @Param("userId") String userId,@Param("applyUserNames") String[] applyUserNames,
                                               @Param("dbType") String dbType);

    /**
     * @description 我的待办条目
     * @author ouandyang
     * @param  userId 用户ID
     * @updateTime 2021/5/22
     */
    int selectTodoApplyCount(@Param("userId") String userId);

    /**
     * @description 修改文档路径
     * @author ouandyang
     * @param  docId 文档ID
     * @param  docName 文档名称
     * @param  docPath 文档路径
     * @updateTime 2021/9/4
     */
    int updateRuTaskDocPath(@Param("docId") String docId, @Param("docName") String docName,
                            @Param("docPath") String docPath);

    int updateRuTaskAddition(@Param("applyDetail") String applyDetail, @Param("procInstId") String procInstId);

    String selectTaskDefKeyByApplyID(@Param("applyId") String applyId);

    List<String> selectProcInstIDListByProcDefID(@Param("procDefId") String procDefId);

    List<DocAuditApplyModel> selectToReminderList(@Param("procDefId") String procDefId);
    
    List<DocAuditApplyModel> selectTaskIDByProcInstID(@Param("procInstId") String procInstId);
}
