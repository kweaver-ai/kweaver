package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NamedAuditorStrategyImpl implements AuditorStrategy {

    @Autowired
    private StrategyUtils strategyUtils;

    @Autowired
    private UserService userService;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) {
        // 实现命名审核员策略
        return namedAuditorGetAuditors(docShareStrategy);
    }

    private List<DocShareStrategyAuditor> namedAuditorGetAuditors(DocShareStrategy docShareStrategy){
        List<DocShareStrategyAuditor> allAuditors = new ArrayList<>();
        List<String> addedAuditors = new ArrayList<>();
        List<String> groupIDList = new ArrayList<>();
        List<DocShareStrategyAuditor> auditors = strategyUtils.getAuditors(docShareStrategy.getId());
        for (DocShareStrategyAuditor auditor : auditors) {
            if (StrUtil.isEmpty(auditor.getOrgType()) || auditor.getOrgType().equals("user")) {
                allAuditors.add(auditor);
                addedAuditors.add(auditor.getUserId());
                continue;
            }
            if (auditor.getOrgType().equals("group")){
                groupIDList.add(auditor.getUserId());
            }
        }

        // 如果用户组未设置直接返回
        if (groupIDList.size() == 0) {
            return allAuditors;
        }

        String auditStrategyId = auditors.get(0).getAuditStrategyId();
        List<User> allUsers = userService.listUserByGroupId(groupIDList);
        for (User user : allUsers) {
            if (addedAuditors.contains(user.getUserId())) {
                continue;
            }
            allAuditors.add(DocShareStrategyAuditor.builder()
                    .userId(user.getUserId())
                    .userCode(user.getUserCode())
                    .userName(user.getUserName())
                    .auditStrategyId(auditStrategyId)
                    .build());
            addedAuditors.add(user.getUserId());
        }
        return allAuditors;
    }
}
