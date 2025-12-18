package com.aishu.doc.audit.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.dao.DocAuditApplyDao;
import com.aishu.doc.audit.dao.DocAuditHistoryDao;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.dto.DocAuditTaskDTO;
import com.aishu.doc.audit.vo.ArbitrailyApply;
import com.aishu.doc.audit.vo.ArbitrailyProcess;
import com.aishu.doc.audit.vo.DocAuditListVO;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.model.ProcessAuditor;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;

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
 * @description 文档审核申请服务类
 * @author ouandyang
 */
@Slf4j
@Service
public class DocAuditApplyService extends ServiceImpl<DocAuditApplyDao, DocAuditApplyModel> {

    @Autowired
    DocAuditApplyDao docAuditApplyDao;
    @Autowired
    DocAuditHistoryDao docAuditHistoryDao;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    CountersignInfoService countersignInfoService;
	@Autowired
	AuditConfig auditConfig;
	@Autowired
    DocShareStrategyService docShareStrategyService;
    @Value("${server.dbtype}")
	String dbType;

    /**
     * @description 我的待办列表
     * @author ouandyang
     * @param  docAuditDto 查询参数
     * @param  userId 当前登录用户
     * @updateTime 2021/5/15
     */
    public IPage<DocAuditApplyModel> selectTodoApplyList(DocAuditTaskDTO docAuditDto, String userId){
        String[] types = docAuditDto.getType().equals("") ? null : docAuditDto.getType().split(",");
        return docAuditApplyDao.selectTodoApplyList(new Page<DocAuditApplyModel>(docAuditDto.getPageNumber(),
                docAuditDto.getPageSize()), docAuditDto.getAbstracts(), types,
                userId, docAuditDto.getApply_user_names(),dbType);
    }

    /**
     * @description 我的待办条目
     * @author ouandyang
     * @param  userId 用户ID
     * @updateTime 2021/5/22
     */
    public int selectTodoApplyCount(String userId) {
        return docAuditApplyDao.selectTodoApplyCount(userId);
    }

    /**
     * @description 当前环节名称
     * @author siyu.chen
     * @param  applyId 申请ID
     * @updateTime 2023/8/9
     */
    public String selectTaskDefKeyByApplyID(String applyId){
        return docAuditApplyDao.selectTaskDefKeyByApplyID(applyId);
    }

    /**
     * @description 文件重命名更新申请数据
     * @author hanj
     * @param docId 文件ID
     * @updateTime 2021/6/3
     */
    public void fileRenameManage(String docId, String newPath){
        //文件重命名更新申请数据
        List<DocAuditApplyModel> applyList = docAuditApplyDao.selectList(
                new LambdaQueryWrapper<DocAuditApplyModel>().apply("doc_id like {0}" , docId));

        for(DocAuditApplyModel auditApply : applyList){
            // 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
            if(JSONUtil.parseObj(auditApply.getApplyDetail()).get("workflow") == null){
                auditApply.setDocPath(newPath);
                docAuditApplyDao.updateById(auditApply);
            }
        }
        //文件重命名更新历史申请数据
        List<DocAuditHistoryModel> historyList = docAuditHistoryService.list(
                new LambdaQueryWrapper<DocAuditHistoryModel>().apply("doc_id like {0}" , docId));
        for(DocAuditHistoryModel historyApply : historyList){
            // 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
            if(JSONUtil.parseObj(historyApply.getApplyDetail()).get("workflow") == null){
                historyApply.setDocPath(newPath);
                docAuditHistoryService.updateById(historyApply);
            }
        }

        // 更新任务表文件名称
        String docName = DocUtils.getDocNameByPath(newPath);
        docAuditApplyDao.updateRuTaskDocPath(docId, docName, newPath);
        docAuditHistoryService.updateHisTaskDocPath(docId, docName, newPath);
    }

    /**
     * @description 模块后端更新审核内容（模块后端将审核内容变更的消息发送至NSQ , workflow从NSQ接收消息）
     * @author hanj
     * @param applyId applyId
     * @param arbitrailyApply arbitrailyApply
     * @updateTime 2022/12/5
     */
    public void updateApplyData(String applyId, ArbitrailyApply arbitrailyApply){
        DocAuditApplyModel docAuditApplyModel = docAuditApplyDao.selectOne(new LambdaQueryWrapper<DocAuditApplyModel>()
                .eq(DocAuditApplyModel::getBizId, applyId));

        if (docAuditApplyModel == null) {
            return;
        }

        JSONObject processJsonObj = JSONUtil.parseObj(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("process"));
        ArbitrailyProcess arbitrailyProcess = JSONUtil.toBean(processJsonObj, ArbitrailyProcess.class);
        arbitrailyApply.setProcess(arbitrailyProcess);

        DocAuditApplyModel buildDocAuditApplyModel = arbitrailyApply.builderDocAuditApplyModel();
        if(null != docAuditApplyModel){
            docAuditApplyModel.setApplyDetail(buildDocAuditApplyModel.getApplyDetail());
            docAuditApplyModel.setDocNames(buildDocAuditApplyModel.getDocNames());
            docAuditApplyModel.setDocPath(buildDocAuditApplyModel.getDocPath());
            docAuditApplyDao.updateById(docAuditApplyModel);
        }

        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByBizId(applyId);
        if(null != docAuditHistoryModel){
            docAuditHistoryModel.setApplyDetail(buildDocAuditApplyModel.getApplyDetail());
            docAuditHistoryModel.setDocNames(buildDocAuditApplyModel.getDocNames());
            docAuditHistoryModel.setDocPath(buildDocAuditApplyModel.getDocPath());
            docAuditHistoryService.updateById(docAuditHistoryModel);
        }

        // 更新任务表申请详情
        String applyDetail = "";
        String originalApplyDetail = docAuditHistoryDao.selectHisTaskAddition(docAuditApplyModel.getProcInstId());
        if (StrUtil.isNotBlank(originalApplyDetail)){
            JSONObject originalApplyDetailObj = JSONUtil.parseObj(originalApplyDetail);
            originalApplyDetailObj.set("applyDetail", buildDocAuditApplyModel.getApplyDetail());
            applyDetail = originalApplyDetailObj.toString();
        }else{
            JSONObject detail = JSONUtil.createObj();
            detail.set("applyDetail", buildDocAuditApplyModel.getApplyDetail());
            applyDetail = detail.toString();
        }

        docAuditApplyDao.updateRuTaskAddition(applyDetail, docAuditApplyModel.getProcInstId());
        docAuditHistoryDao.updateHisTaskAddition(applyDetail, docAuditApplyModel.getProcInstId());
    }

    /**
     * @description 删除业务数据审核员
     * @author ouandyang
     * @param  userId 用户ID
     * @updateTime 2021/8/11
     */
    public void deleteUserForAuditor(String userId) {
        // 删除业务数据审核员
        List<DocAuditApplyModel> list = this.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                .like(DocAuditApplyModel::getAuditor, userId));
        if (list.isEmpty()) {
            return ;
        }
        List<DocAuditApplyModel> updateList = new ArrayList<>();
        for(DocAuditApplyModel model : list) {
            List<ProcessAuditor> auditorList = JSONUtil.toList(JSONUtil.parseArray(model.getAuditor()), ProcessAuditor.class);
            List<ProcessAuditor> auditorListNew = auditorList.stream()
                    .filter(item -> !userId.equals(item.getId()) || !WorkflowConstants.AUDIT_STATUS_DSH.equals(item.getStatus()))
                    .collect(Collectors.toList());
            if (auditorList.size() != auditorListNew.size()) {
                updateList.add(DocAuditApplyModel.builder().id(model.getId()).auditor(JSONUtil.toJsonStr(auditorListNew)).build());
            }
        }
        this.updateBatchById(updateList);
        List<DocAuditHistoryModel> historyList = updateList.stream().map(t ->
                DocAuditHistoryModel.builder().id(t.getId()).auditor(t.getAuditor()).build())
                .collect(Collectors.toList());
        docAuditHistoryService.updateBatchById(historyList);
    }

    /**
     * @description 根据业务ID查询文档审核申请对象
     * @author ouandyang
     * @param  bizId 业务ID
     * @updateTime 2021/11/8
     */
    public DocAuditApplyModel selectByBizId(String bizId) {
        return this.getOne(new LambdaQueryWrapper<DocAuditApplyModel>()
                .eq(DocAuditApplyModel::getBizId, bizId));
    }

    /**
     * @description 根据业务ID、申请人ID查询文档审核申请对象
     * @author ouandyang
     * @param  bizId 业务ID
     * @param  userId 申请人ID
     * @updateTime 2021/11/8
     */
    public DocAuditApplyModel selectByBizIdAndUserId(String bizId, String userId) {
        return this.getOne(new LambdaQueryWrapper<DocAuditApplyModel>()
                .eq(DocAuditApplyModel::getBizId, bizId)
                .eq(DocAuditApplyModel::getApplyUserId, userId));
    }

    /**
     * @description 根据流程定义KEY查找文档审核申请
     * @author ouandyang
     * @param  procDefKey 流程定义KEY
     * @updateTime 2021/11/8
     */
    public List<DocAuditApplyModel> selectByProcDefKey(String procDefKey) {
        return this.list(new LambdaQueryWrapper<DocAuditApplyModel>()
            .likeRight(DocAuditApplyModel::getProcDefId, procDefKey));

    }

    public List<CountersignInfo> countersignInfoList(String bizId, String taskId){
        DocAuditApplyModel docAuditApplyModel = this.getOne(new LambdaQueryWrapper<DocAuditApplyModel>()
                .eq(DocAuditApplyModel::getBizId, bizId));
        List<CountersignInfo> countersignInfoList = new ArrayList<>();
        if(null == docAuditApplyModel){
            return countersignInfoList;
        }
        countersignInfoList = countersignInfoService.list(new LambdaQueryWrapper<CountersignInfo>()
                .eq(CountersignInfo::getProcInstId, docAuditApplyModel.getProcInstId())
                .eq(CountersignInfo::getTaskId, taskId).orderByDesc(CountersignInfo::getBatch));
        return countersignInfoList;
    }

    public List<CountersignInfo> countersignInfoLogs(String procInstId){
        List<CountersignInfo> countersignInfoList = countersignInfoService.list(new LambdaQueryWrapper<CountersignInfo>()
                .eq(CountersignInfo::getProcInstId, procInstId).orderByDesc(CountersignInfo::getBatch));
        return countersignInfoList;
    }

    /**
     * @description 用户显示名变更，同步变更审核申请与审核申请历史表的用户名
     * @author hanj
     * @param userId userId
     * @param newUserName newUserName
     * @updateTime 2022/6/2
     */
    public void updateApplyUserByUserNameModify(String userId, String newUserName){
        DocAuditApplyModel updateDocAuditApply = new DocAuditApplyModel();
        updateDocAuditApply.setApplyUserName(newUserName);
        this.update(updateDocAuditApply, new LambdaQueryWrapper<DocAuditApplyModel>().eq(DocAuditApplyModel::getApplyUserId, userId));

        DocAuditHistoryModel updateDocAuditHistory = new DocAuditHistoryModel();
        updateDocAuditHistory.setApplyUserName(newUserName);
        docAuditHistoryService.update(updateDocAuditHistory, new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getApplyUserId, userId));
    }

    /**
     * @description 根据流程id获取流程实例化id
     * @author siyu.chen
     * @param procDefID procDefID
     * @updateTime 2024/4/30
     */
    public List<String> selectProcInstIDListByProcDefID(String procDefID) {
        return docAuditApplyDao.selectProcInstIDListByProcDefID(procDefID);
    }

    /**
     * @description 获取我的待办
     * @author siyu.chen
     * @param userId userId
     * @param docAuditTaskDto docAuditTaskDto
     * @updateTime 2024/4/26
     */
    public PageWrapper<DocAuditListVO> listTasks(DocAuditTaskDTO docAuditTaskDto, String userID) {
        List<DocAuditListVO> list = new ArrayList<>();
        IPage<DocAuditApplyModel> page = this.selectTodoApplyList(docAuditTaskDto, userID);
        if (page.getRecords().size() == 0) {
            return new PageWrapper<DocAuditListVO>(list, (int) page.getTotal());
        }
        List<String> procdefIds = page.getRecords().stream().map(DocAuditApplyModel::getProcDefId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
        Map<String, DocShareStrategy> docShareStrategies = docShareStrategyService.listDocShareStrategy(procdefIds, true)
                .stream()
                .collect(Collectors.toMap(DocShareStrategy::getProcDefId, docShareStrategy -> docShareStrategy));
        list = page.getRecords().stream()
                .map(item -> DocAuditListVO.builder(item, auditConfig, docShareStrategies.get(item.getProcDefId())))
                .collect(Collectors.toList());

        return new PageWrapper<DocAuditListVO>(list, (int) page.getTotal());
    }

    public List<DocAuditApplyModel> selectToReminderList(String procDefId) {
       return docAuditApplyDao.selectToReminderList(procDefId);
    }
    
    public List<DocAuditApplyModel> selectTaskIDByProcInstID(String procInstId) {
        return docAuditApplyDao.selectTaskIDByProcInstID(procInstId);
    }
}
