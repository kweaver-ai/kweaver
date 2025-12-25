package com.aishu.wf.core.doc.strategy.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class KcAdminAuditorStrategyImpl implements AuditorStrategy {

    @Autowired
    private StrategyUtils strategyUtils;

    @Autowired
    private AnyShareConfig anyShareConfig;
    
    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        return kcAdminGetAuditors(docShareStrategy);
    }
 
        /**
     * @description 知识管理审核员，获取审核员
     * @author siyu.chen
     * @param docShareStrategy docShareStrategy
     * @updateTime 2024/11/13
     */
    private List<DocShareStrategyAuditor> kcAdminGetAuditors(DocShareStrategy docShareStrategy) throws Exception{
        try {
            List<DocShareStrategyAuditor> allAuditors = new ArrayList<>();
            List<DocShareStrategyAuditor> auditors = strategyUtils.getAuditors(docShareStrategy.getId());
            if (auditors.isEmpty()) {
                return allAuditors;
            }

            String id = auditors.get(0).getUserId();

            String target = anyShareConfig.getKcMcPrivatePoint() + "/api/pri-kc-mc/v1/user-role?role_id=" + id;
            String body = strategyUtils.getUserByWebhook(target);
            try {
                JSONObject bodyObj = JSON.parseObject(body);
                JSONObject dataObj = bodyObj.getJSONObject("data");
                if (dataObj == null || !dataObj.containsKey("manages")) {
                    throw new Exception(body);
                }
                JSONArray manages = dataObj.getJSONArray("manages");
                for (Object manage : manages) {
                    JSONObject manageObj = (JSONObject) manage;
                    allAuditors.add(DocShareStrategyAuditor.builder()
                            .userId(manageObj.getString("as_id"))
                            .build());
                }
            } catch (Exception e) {
                throw new Exception("body：" + body + ",exception：" + e);
            }
            return allAuditors;
        } catch (Exception e) {
            log.warn("知识管理审核员，获取审核员处理失败！docShareStrategy：{}", JSON.toJSONString(docShareStrategy), e);
            throw e;
        }
    }
}
