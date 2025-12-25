package com.aishu.doc.handler.biz;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;

/**
 * @description 文档审核记录操作日志
 * @author ouandyang
 */
public interface DocAuditLogService {

    /**
     * @description 构建申请日志操作描述
     * @author ouandyang
     * @param docAuditApplyModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildApplyLogMsg(DocAuditApplyModel docAuditApplyModel);

    /**
     * @description 构建申请日志操作详情
     * @author ouandyang
     * @param docAuditApplyModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildApplyLogExMsg(DocAuditApplyModel docAuditApplyModel);

    /**
     * @description 构建审核日志操作描述
     * @author ouandyang
     * @param docAuditApplyModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildAuditLogMsg(DocAuditApplyModel docAuditApplyModel, String userId);

    /**
     * @description 构建审核日志操作详情
     * @author ouandyang
     * @param docAuditApplyModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildAuditLogExMsg(DocAuditApplyModel docAuditApplyModel);

    /**
     * @description 构建审核完成日志操作描述
     * @author ouandyang
     * @param docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildAuditedLogMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建审核完成日志操作详情
     * @author ouandyang
     * @param docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildAuditedLogExMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建撤销申请日志操作描述
     * @author ouandyang
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildUndoneLogMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建撤销申请日志操作详情
     * @author ouandyang
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildUndoneLogExMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建加签日志操作描述
     * @author ouandyang
     * @param  auditorName 加签审核员名称
     * @param  userName 操作人名称
     * @updateTime 2021/8/26
     */
    String buildCountersignLogMsg(String auditorName, String userName);

    /**
     * @description 构建加签日志操作详情
     * @author ouandyang
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildCountersignLogExMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建转审日志操作描述
     * @author siyu.chen
     * @param  auditorName 转审审核员名称
     * @param  taskName 转审任务名
     * @param  assigneeTo 被转审人名称
     * @updateTime 2021/8/26
     */
    String buildTransferLogMsg(String auditorName, String applyType, String assigneeTo);

    /**
     * @description 构建转审日志操作详情
     * @author siyu.chen
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildTransferLogExMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建审核退回日志操作描述
     * @author siyu.chen
     * @param  auditorName 转审审核员名称
     * @param  taskName 转审任务名
     * @param  assigneeTo 被转审人名称
     * @updateTime 2021/8/26
     */
    String buildSendBackLogMsg(DocAuditHistoryModel docAuditHistoryModel, String userId);

    /**
     * @description 构建审核退回日志操作详情
     * @author siyu.chen
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildSendBackExMsg(DocAuditHistoryModel docAuditHistoryModel);

    /**
     * @description 构建重新提交日志操作描述
     * @author siyu.chen
     * @param  auditorName 转审审核员名称
     * @param  taskName 转审任务名
     * @param  assigneeTo 被转审人名称
     * @updateTime 2021/8/26
     */
    String buildResubmitLogMsg(DocAuditApplyModel docAuditApplyModel);

    /**
     * @description 构建重新提交操作详情
     * @author siyu.chen
     * @param  docAuditHistoryModel 文档审核申请数据
     * @updateTime 2021/8/26
     */
    String buildResubmitExMsg(DocAuditApplyModel docAuditApplyModel);

}
