package com.aishu.wf.core.doc.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.dao.InBoxDao;
import com.aishu.wf.core.doc.model.InBoxModel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import cn.hutool.core.util.IdUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class InBoxService extends ServiceImpl<InBoxDao, InBoxModel>{
    @Autowired
    private InBoxDao inBoxDao;

    public List<InBoxModel> selectInBoxMessage() {
        List<InBoxModel> messages = inBoxDao.selectList(new LambdaQueryWrapper<InBoxModel>().orderByAsc(InBoxModel::getCreateTime).last("limit 500"));
        return messages;
    }

    public void addInBoxMessage(String topic, String content) {
        inBoxDao.insert(InBoxModel.builder().id(IdUtil.randomUUID()).topic(topic).message(content).createTime(new Date()).build());
    }

    public void updateInboxMessage(String id) {
        inBoxDao.updateById(InBoxModel.builder().id(id).createTime(new Date()).build());
    }

    public void deleteInBoxMessage(String id) {
        inBoxDao.deleteById(id);
    }
    
}
