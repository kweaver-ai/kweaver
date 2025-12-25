package com.aishu.doc.audit.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;

import com.aishu.doc.audit.dao.DocAuditHistoryDao;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.dto.DocAuditApplyDTO;
import com.aishu.doc.audit.model.dto.DocAuditHistoryDTO;
import com.aishu.doc.audit.model.dto.DocAuditTaskDTO;
import com.aishu.doc.audit.vo.DocAuditApplyListVO;
import com.aishu.doc.audit.vo.DocAuditListVO;
import com.aishu.doc.audit.vo.DocAuditVO;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;

import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.task.Task;
import org.apache.commons.lang3.StringUtils;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @description 文档审核申请历史服务类
 * @author ouandyang
 */
@Slf4j
@Service
public class DocAuditHistoryService extends ServiceImpl<DocAuditHistoryDao, DocAuditHistoryModel> {
    @Autowired
    DocAuditHistoryDao docAuditHistoryDao;
	@Autowired
	ProcessInstanceService processInstanceService;
    @Autowired
	AuditConfig auditConfig;
	@Autowired
    DocShareStrategyService docShareStrategyService;

    @Value("${server.dbtype}")
	String dbType;

    /**
     * @description 我的申请列表
     * @author ouandyang
     * @param  docAuditDto 查询参数
     * @param  userId 当前登录用户
     * @updateTime 2021/5/15
     */
    public IPage<DocAuditHistoryModel> selectMyApplyList(DocAuditApplyDTO docAuditDto, String userId){
        String[] types = docAuditDto.getType().equals("") ? null : docAuditDto.getType().split(",");
        return docAuditHistoryDao.selectMyApplyList(new Page<DocAuditHistoryModel>(docAuditDto.getPageNumber(),
                docAuditDto.getPageSize()), docAuditDto.getAbstracts(), types,
                AuditStatusEnum.getValueByCode(docAuditDto.getStatus()), userId, dbType);
    }


    /**
     * @description 我的已办列表
     * @author ouandyang
     * @param  docAuditDoneDto 查询参数
     * @param  userId 当前登录用户
     * @updateTime 2021/5/15
     */
    public IPage<DocAuditHistoryModel> selectDoneApplyList(DocAuditHistoryDTO docAuditDoneDto, String userId){
        String[] types = docAuditDoneDto.getType().equals("") ? null : docAuditDoneDto.getType().split(",");
        return docAuditHistoryDao.selectDoneApplyList(new Page<DocAuditHistoryModel>(docAuditDoneDto.getPageNumber(),
                docAuditDoneDto.getPageSize()),docAuditDoneDto.getAbstracts(), types,
                AuditStatusEnum.getValueByCode(docAuditDoneDto.getStatus()), userId, docAuditDoneDto.getApply_user_names(), dbType);

    }

    /**
     * @description 获取指定环节内的所有审核员信息
     * @author siyu.chen
     * @param  applyID 审核申请id
     * @param  taskDefKey 流程环节ID
     * @updateTime 2023/8/9
     */
    public List<DocAuditHistoryModel> selectAuditTaskByApplyIDAndTaskDefKey(String applyID, String taskDefKey){
        return docAuditHistoryDao.selectAuditTaskByApplyIDAndTaskDefKey(applyID, taskDefKey);
    }

    /**
     * @description 获取指定环节的最高执行ID
     * @author siyu.chen
     * @param  taskID 任务ID
     * @updateTime 2023/8/28
     */
    public String selectTopExecutionIDByID(String taskID){
        return docAuditHistoryDao.selectTopExecutionIDByID(taskID);
    }

    /**
     * @description 我的审核条目
     * @author ouandyang
     * @param  userId 用户ID
     * @updateTime 2021/5/22
     */
    public int selectAuditCount(String userId) {
        return docAuditHistoryDao.selectAuditCount(userId);
    }

    /**
     * @description 根据流程实例ID查询申请数据
     * @author ouandyang
     * @param  procInstId
     * @updateTime 2021/8/30
     */
    public DocAuditHistoryModel getByProcInstId(String procInstId) {
        return docAuditHistoryDao.selectOne(new LambdaQueryWrapper<DocAuditHistoryModel>()
            .eq(DocAuditHistoryModel::getProcInstId, procInstId));
    }

    /**
     * @description 根据业务关联ID查询申请数据
     * @author xiashenghui
     * @param  BizId
     * @updateTime 2022/4/19
     */
    public DocAuditHistoryModel getByBizId(String BizId) {
        return docAuditHistoryDao.selectOne(new LambdaQueryWrapper<DocAuditHistoryModel>()
                .eq(DocAuditHistoryModel::getBizId, BizId));
    }

    /**
     * 流程结束/作废-更新流程所有任务的状态
     * @param integer
     * @param procInstId
     */
    public void updateHisTaskStatus(Integer integer,String procInstId) {
    	if(StringUtils.isEmpty(procInstId)) {
    		return;
    	}
    	docAuditHistoryDao.updateHisTaskStatus(String.valueOf(integer),procInstId);
    }

    /**
     * 流程结束/作废-更新流程所有任务的状态
     * @param integer
     * @param ids
     */
    public void batchUpdateHisTaskStatus(Integer integer, List<String> ids) {
        if(CollUtil.isEmpty(ids)) {
            return;
        }
        docAuditHistoryDao.batchUpdateHisTaskStatus(String.valueOf(integer), CommonUtils.splitList(ids, 1000));
    }

    /**
     * @description 修改文档路径
     * @author ouandyang
     * @param  docId 文档ID
     * @param  docName 文档名称
     * @param  docPath 文档路径
     * @updateTime 2021/9/4
     */
    public void updateHisTaskDocPath(String docId, String docName, String docPath) {
        docAuditHistoryDao.updateHisTaskDocPath(docId, docName, docPath);
    }

    public void updateHisTaskMessageId(String messageId, String taskId) {
        docAuditHistoryDao.updateHisTaskMessageId(messageId, taskId);
    }

    public void batchUpdateHisTaskMessageId(String messageId, List<String> taskIds) {
        docAuditHistoryDao.batchUpdateHisTaskMessageId(messageId, taskIds);
    }

    // by siyu.chen 2023/7/25
    public void insertHiTaskinst(HistoricTaskInstanceEntity historicTaskInstanceEntity){
        docAuditHistoryDao.insertHiTaskinst(historicTaskInstanceEntity);
    }

    public List<String> selectAuditorByProInsID(String ProcInstId) {
        List<String> auditors = docAuditHistoryDao.selectAuditorByProInsID(ProcInstId);
        auditors = auditors.stream().filter(Objects::nonNull).collect(Collectors.toList());
        return auditors;
    }

    public DocAuditVO getDocAuditDetail(String id, String userId) {
        DocAuditHistoryModel docAuditHistoryModel = this.getById(id);
		if (docAuditHistoryModel == null) {
			throw new IllegalArgumentException("该审核详情不存在，本次操作无法生效。");
		}
		String customDescriptionJsonStr = null;
		if (StrUtil.isNotBlank(docAuditHistoryModel.getProcInstId())) {
			try {
				Task task = processInstanceService.getProcessTask(docAuditHistoryModel.getProcInstId(), userId);
				docAuditHistoryModel.setTaskId(task.getId());
				customDescriptionJsonStr = task.getDescription();
			} catch (WorkFlowException e) {
			}
		}
		if (!StringUtils.isEmpty(docAuditHistoryModel.getAuditor())
				&& docAuditHistoryModel.getAuditor().contains(userId)) {
			docAuditHistoryModel.setApplicationAuditor(true);
		}

		DocShareStrategy docShareStrategy = docShareStrategyService.getDocShareStrategy(docAuditHistoryModel.getProcDefId());
		// 获取对于申请类型前端详情插件信息
		String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType());
		return DocAuditVO.builder(docAuditHistoryModel, frontPluginJsonStr, customDescriptionJsonStr, docShareStrategy);
    }

    public List<DocAuditVO> listDocAuditDetail(List<String> ids , String userId) {
        List<DocAuditVO> docAuditVOs = new ArrayList<>();
        List<DocAuditHistoryModel> docAuditHistoryModels = this.listByIds(ids);
        if (CollUtil.isEmpty(docAuditHistoryModels)) {
            return docAuditVOs;
        }
        
		List<String> procdefIds = docAuditHistoryModels.stream().map(DocAuditHistoryModel::getProcDefId).distinct().collect(Collectors.toList());
		Map<String, DocShareStrategy> docShareStrategies = docShareStrategyService.listDocShareStrategy(procdefIds, true).stream().collect(Collectors.toMap(
			DocShareStrategy::getProcDefId, docShareStrategy -> docShareStrategy ));

		for (DocAuditHistoryModel docAuditHistoryModel : docAuditHistoryModels) {
			String customDescriptionJsonStr = null;
			if (StrUtil.isNotBlank(docAuditHistoryModel.getProcInstId())) {
				try {
					Task task = processInstanceService.getProcessTask(docAuditHistoryModel.getProcInstId(),	userId);
					docAuditHistoryModel.setTaskId(task.getId());
					customDescriptionJsonStr = task.getDescription();
				} catch (WorkFlowException e) {
				}
			}

			// 获取对于申请类型前端详情插件信息
			String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType());
			docAuditVOs.add(DocAuditVO.builder(docAuditHistoryModel, frontPluginJsonStr, customDescriptionJsonStr, docShareStrategies.get(docAuditHistoryModel.getProcDefId())));
		}

        return docAuditVOs;
    }

    public void updateHisTaskByApplyId(Integer auditStatus, String auditResult, String applyId) {
        docAuditHistoryDao.updateHisTaskByApplyId(auditStatus, auditResult, applyId);
    }
}
