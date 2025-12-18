package com.aishu.wf.core.doc.strategy.impl;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.google.common.collect.Lists;

import lombok.extern.slf4j.Slf4j;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;

@Slf4j
@Service
public class ManagerAuditorStrategyImpl implements AuditorStrategy {

    @Autowired
    private UserService userService;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        return managerGetAuditors(docUserId);
    }

    /**
     * @description 上级审核，获取审核员
     * @author siyu.chen
     * @param userId userId
     * @updateTime 2024/11/13
     */
    private List<DocShareStrategyAuditor> managerGetAuditors(String userId) {
        if (userId == null) {
            return Collections.emptyList();
        }

        List<User> users = userService.batchGetUserInfo(Lists.newArrayList(userId));
        if (users == null || users.isEmpty()) {
            return Collections.emptyList();
        }

        User user = users.get(0);
        return Lists.newArrayList(DocShareStrategyAuditor.builder()
                .userId(user.getManager().getId())
                .build());
    }
}
