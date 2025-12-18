package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.common.util.WorkflowConstants.LEVEL_TYPE;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.DocumentDTO;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PermApplyAuditorStrategyImpl implements AuditorStrategy {

    @Autowired
    private StrategyUtils strategyUtils;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        // 实现权限申请审核策略
        String data = fields.get("data") != null ? fields.get("data").toString() : null;
        return permApplyGetAuditors(docShareStrategy, data);
    }

    /**
     * @description 动态获取文档所有者设置审核员
     * @author siyu.chen
     * @param docShareStrategy docShareStrategy
     * @updateTime 2023/11/20
     */
    private List<DocShareStrategyAuditor> permApplyGetAuditors(DocShareStrategy docShareStrategy, String data) throws Exception{
        try{
            String strategyTag =  docShareStrategy.getStrategyType().substring(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue().length() + 1);
            JSONObject dataObj = JSONObject.parseObject(data);
            JSONObject sourceObj = JSONObject.parseObject(dataObj.getString("source"));
            String docID = "";
            if (sourceObj.getString("type").equals("folder") || sourceObj.getString("type").equals("file")){
                docID = sourceObj.getString("id");
            }
            if (StrUtil.isBlank(docID)) {
                throw new Exception("docID为空，获取审核员信息失败");
            }
            Map<String, List<String>> documentMap = new HashMap<>();
            if (WorkflowConstants.DOC_CONFPERM_AUDIT.equals(strategyTag) || WorkflowConstants.DOC_INHCONFPERM_AUDIT.equals(strategyTag)) {
                documentMap = this.getOwners(docID);
            } else if (WorkflowConstants.BELONGDIR_INHCONFPERM_AUDIT.equals(strategyTag)) {
                docID = getDocID(docID);
                // 获取父级文件夹的配置所有者和继承所有者
                documentMap = this.getOwners(docID);
            } else {
                throw new Exception("不支持的审核策略类型："+ strategyTag);
            }

            // 被申请文档的所有者(配置权限)
            DocShareStrategyAuditor[] auditors = new DocShareStrategyAuditor[]{};
            if (WorkflowConstants.DOC_CONFPERM_AUDIT.equals(strategyTag)) {
                // 当前文件配置权限的所有者
                if (documentMap.containsKey(docID)) {
                    auditors = documentMap.get(docID).stream().map(owner -> new DocShareStrategyAuditor().setUserId(owner)).toArray(DocShareStrategyAuditor[]::new);;
                } else {
                    // 所在层级的上N级，应该排除当前文件objectid
                    docID = getDocID(docID);
                    LEVEL_TYPE levelType  = LEVEL_TYPE.getLevelType(docShareStrategy.getLevelType());
                    if (levelType.isDirectlyLevel()) {
                        auditors = documentMap.containsKey(docID)? documentMap.get(docID).stream().map(owner -> new DocShareStrategyAuditor().setUserId(owner)).toArray(DocShareStrategyAuditor[]::new):auditors;
                    }else {
                        // docID.split("/").length - 2 去除docid前缀gns://
                        int level = levelType.isHighestLevel()? docID.split("/").length - 2 : levelType.getLevel() + 1;
                        for (int i=0; i<level; i++) {
                            if (documentMap.containsKey(docID)) {
                                auditors = documentMap.get(docID).stream().map(owner -> new DocShareStrategyAuditor().setUserId(owner)).toArray(DocShareStrategyAuditor[]::new);;
                                break;
                            }
                            docID = getDocID(docID);
                        }
                    }
                }
            } else {
                List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
                documentMap.forEach((key, value) -> {
                    auditorList.addAll(value.stream().map(owner -> new DocShareStrategyAuditor().setUserId(owner)).collect(Collectors.toList()));
                });
                auditors = auditorList.toArray(new DocShareStrategyAuditor[0]);
            }
            return Arrays.asList(auditors);
        } catch (Exception e){
            log.warn("权限申请动态获取审核员，处理失败！docShareStrategy：{}", JSON.toJSONString(docShareStrategy), e);
            throw e;
        }
    }

    private String getDocID(String str){
        String newStr = str.substring(0,str.lastIndexOf("/"));
        if (newStr.length() <=6){
            return str;
        }
        return newStr;
    }

    /**
     * @description 获取文档所有者
     * @author siyu.chen
     * @param docShareStrategy docShareStrategy
     * @updateTime 2023/11/21
     */
    private Map<String, List<String>> getOwners(String docID) throws Exception {
        JSONArray owners = strategyUtils.getOwnerList(docID);
        Map<String, List<String>> documentMap = new HashMap<>();
        for (Object object : owners) {
            DocumentDTO DocumentEntity = JSONUtil.toBean(object.toString(),DocumentDTO.class);
            // 接口返回类型user、app，app为应用账号需过滤掉
            if (!DocumentEntity.getOwner().getType().equals("user")) {
                continue;
            }
            if (!documentMap.containsKey(DocumentEntity.getDoc_id())){
                documentMap.put(DocumentEntity.getDoc_id(), new ArrayList<>());
            }
            if (!documentMap.get(DocumentEntity.getDoc_id()).contains(DocumentEntity.getOwner().getId())){
                documentMap.get(DocumentEntity.getDoc_id()).add(DocumentEntity.getOwner().getId());
            }
        }
        return documentMap;
    }
}
