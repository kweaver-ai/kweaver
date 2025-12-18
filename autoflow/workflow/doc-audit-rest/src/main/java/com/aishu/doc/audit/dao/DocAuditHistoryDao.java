package com.aishu.doc.audit.dao;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;


/**
 * 文件审核历史
 * @ClassName: DocAuditHistoryDao
 * @author: ouandyang
 * @date: 2021年5月12日
 */
public interface DocAuditHistoryDao extends BaseMapper<DocAuditHistoryModel>{

    /**
     * @description 我的申请列表
     * @author ouandyang
     * @param  page 分页参数
     * @param  type 申请类型
     * @param  status 审核状态
     * @param  userId 用户ID
     * @updateTime 2021/5/15
     */
    IPage<DocAuditHistoryModel> selectMyApplyList(Page<DocAuditHistoryModel> page, @Param("abstracts") String[] abstracts,
        @Param("types") String[] types, @Param("status") Integer status, @Param("userId") String userId,  @Param("dbType") String dbType);

    /**
     * @description 我的已办列表
     * @author ouandyang
     * @param  page 分页参数
     * @param  type 申请类型
     * @param  status 审核状态
     * @param  userId 用户ID
     * @updateTime 2021/5/15
     */
    IPage<DocAuditHistoryModel> selectDoneApplyList(Page<DocAuditHistoryModel> page, @Param("abstracts") String[] abstracts,
                                              @Param("types") String[] types, @Param("status") Integer status, @Param("userId") String userId, @Param("applyUserNames") String[] applyUserNames,
                                              @Param("dbType") String dbType);

    /**
     * @description 获取指定环节内的所有审核员信息
     * @author siyu.chen
     * @param  applyID 审核申请id
     * @param  taskDefKey 流程环节ID
     * @updateTime 2023/8/9
     */
    List<DocAuditHistoryModel> selectAuditTaskByApplyIDAndTaskDefKey(@Param("apply_id") String applyID, @Param("task_def_key") String taskDefKey);

    /**
     * @description 获取指定环节的最高执行ID
     * @author siyu.chen
     * @param  taskID 任务ID
     * @updateTime 2023/8/28
     */
    String selectTopExecutionIDByID(@Param("task_id") String taskID);

    /**
     * @description 查询审核条目
     * @author ouandyang
     * @param  userId 用户ID
     * @updateTime 2021/11/2
     */
    int selectAuditCount(@Param("userId") String userId);

    /**
     * 流程结束/作废-更新流程所有任务的状态
     * @param status
     * @param procInstId
     */
    int updateHisTaskStatus(@Param("status")String status,@Param("procInstId")String procInstId);

    /**
     * @description 流程结束/作废-批量更新流程所有任务的状态
     * @author ouandyang
     * @param  status 状态
     * @param  idList 流程实例ID
     * @updateTime 2021/9/3
     */
    int batchUpdateHisTaskStatus(@Param("status") String status, @Param("idList") List<List<String>> idList);

    /**
     * @description 修改文档路径
     * @author ouandyang
     * @param  docId 文档ID
     * @param  docName 文档名称
     * @param  docPath 文档路径
     * @updateTime 2021/9/4
     */
    int updateHisTaskDocPath(@Param("docId") String docId, @Param("docName") String docName,
                            @Param("docPath") String docPath);

    int updateHisTaskAddition(@Param("applyDetail") String applyDetail, @Param("procInstId") String procInstId);

    int updateHisTaskMessageId(@Param("messageId") String messageId, @Param("id") String taskId);

    int batchUpdateHisTaskMessageId(@Param("messageId") String messageId, @Param("ids") List<String> taskIds);

    String selectHisTaskAddition(@Param("procInstId") String procInstId);

    /**
     * @description 手动插入历史任务记录
     * @author siyu.chen
     * @param  historicTaskInstanceEntity
     * @updateTime 2021/9/4
     */
    int insertHiTaskinst(HistoricTaskInstanceEntity historicTaskInstanceEntity);

    List<String> selectAuditorByProInsID(@Param("procInstId") String ProcInstId);

    void updateHisTaskByApplyId(@Param("audit_status") Integer auditStatus, @Param("audit_result") String auditResult, @Param("apply_id") String applyId);
}
