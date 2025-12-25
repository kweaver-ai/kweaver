package com.aishu.wf.core.doc.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.doc.dao.ClearInternalGroupDao;
import com.aishu.wf.core.doc.model.InternalGroupModel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ClearInternalGroupService extends ServiceImpl<ClearInternalGroupDao, InternalGroupModel> {
    @Autowired
    private ClearInternalGroupDao clearInternalGroupDao;
    private UserManagementOperation userManagementOperation;
    @Resource
    private AnyShareConfig anyShareConfig;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }

    public List<InternalGroupModel> selectExpiredInternalGroup(){
        long currentTime = System.currentTimeMillis();
        List<InternalGroupModel> expiredGroups = clearInternalGroupDao.selectList(new LambdaQueryWrapper<InternalGroupModel>()
                .gt(InternalGroupModel::getExpiredAt, -1).le(InternalGroupModel::getExpiredAt, currentTime));
        return expiredGroups;
    }

    public void deleteExpiredInternalGroup(List<String> ids, List<String> groups) {
        if (ids.size() > 0) {
            try {
                clearInternalGroupDao.deleteBatchIds(ids);
                userManagementOperation.deleteInternalGroup(groups);
            } catch (Exception e) {
                log.warn("timer clear groupid err, detail: {}", e.getMessage());
            }
        }
    }
}
