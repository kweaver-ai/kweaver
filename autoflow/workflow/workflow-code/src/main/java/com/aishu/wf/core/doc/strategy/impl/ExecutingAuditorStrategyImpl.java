package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.WebhookDTO;
import com.aishu.wf.core.doc.model.dto.WorkflowDTO;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.alibaba.fastjson.JSON;

import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@Slf4j
@Service
public class ExecutingAuditorStrategyImpl implements AuditorStrategy {

    @Autowired
    private StrategyUtils strategyUtils;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        // 实现执行审核策略
        String workflow = fields.get("workflow") != null ? fields.get("workflow").toString() : null;
        return excutingAuditors(procDefId, docShareStrategy, workflow);
    }

    /**
     * 通过webhook动态获取审核员
     */
    private List<DocShareStrategyAuditor> excutingAuditors(String procDefId, DocShareStrategy docShareStrategy,String workflow) throws Exception {
        try{
            List<DocShareStrategyAuditor> auditorList = new ArrayList<DocShareStrategyAuditor>();
            WorkflowDTO workflowEntity = JSONUtil.toBean(workflow,WorkflowDTO.class);
            String strategyType = docShareStrategy.getStrategyType();
            String strategyTag =  docShareStrategy.getStrategyType().substring(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue().length() + 1);
            int index = 0;
            List<DocShareStrategy> docShareStrategyList = strategyUtils.getDocStrategy(procDefId);
            for (DocShareStrategy strategtEntity : docShareStrategyList){
                if (strategyType.equals(strategtEntity.getStrategyType())){
                    if (strategtEntity.getId().equals(docShareStrategy.getId())){
                        break;
                    }else{
                        index++;
                    }
                }
            }
            List<WebhookDTO> webhooks = workflowEntity.getWebhooks();
            String webhookUrl = "";
            for (WebhookDTO webhook : webhooks) {
                if (strategyTag.equals(webhook.getStrategy_tag())){
                    webhookUrl = webhook.getWebhook();
                    if (index <= 0){
                        break;
                    }else{
                        index--;
                    }
                }
            }
            String auditorListJson = strategyUtils.getUserByWebhook(webhookUrl);
            cn.hutool.json.JSONArray array = JSONUtil.parseArray(auditorListJson);
            DocShareStrategyAuditor[] auditors = (DocShareStrategyAuditor[])array.toArray(DocShareStrategyAuditor.class);
            auditorList = Arrays.asList(auditors);
            return auditorList;
        }catch(Exception e){
            log.warn("动态获取审核员，处理失败！docShareStrategy：{}", JSON.toJSONString(docShareStrategy), e);
            throw e;
        }
    }
}
