package com.aishu.doc.audit.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.dao.InternalGroupDao;
import com.aishu.doc.audit.model.InternalGroupModel;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class InternalGroupService extends ServiceImpl<InternalGroupDao, InternalGroupModel>{
    @Autowired
    InternalGroupDao internalGroupDao;

    public void insertInternalGroup(InternalGroupModel internalGroupModel) {
        internalGroupDao.insertInternalGroup(internalGroupModel);
    }

    public void updateInternalGroup(String apply_id, long expired_at) {
        internalGroupDao.updateInternalGroup(apply_id, expired_at);
    }

    public InternalGroupModel selectInternalGroupByApplyID(String apply_id) {
        return internalGroupDao.selectInternalGroupByApplyID(apply_id);
    }

    public void deleteInternalGroupByapplyID(String apply_id) {
        internalGroupDao.deleteInternalGroupByapplyID(apply_id);
    }
}
