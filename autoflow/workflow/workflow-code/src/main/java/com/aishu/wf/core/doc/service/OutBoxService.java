package com.aishu.wf.core.doc.service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.dao.OutBoxDao;
import com.aishu.wf.core.doc.model.OutBoxModel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OutBoxService extends ServiceImpl<OutBoxDao, OutBoxModel> {
    @Autowired
    private OutBoxDao outBoxDao;

    public List<OutBoxModel> selectOutBoxMessage() {
        Date currentTime = new Date();
        List<OutBoxModel> messages = outBoxDao.selectList(new LambdaQueryWrapper<OutBoxModel>()
                .le(OutBoxModel::getCreateTime, currentTime).last("limit 100"));
        return messages;
    }

    public void deleteOutBoxMessage(List<String> ids) {
        outBoxDao.deleteBatchIds(ids);
    }

    public void addOutBoxMessage(OutBoxModel outbox) {
        outBoxDao.insert(outbox);
    }

    public void batchInsertMessage(List<OutBoxModel> boxs) {
        List<String> ids = boxs.stream().map(OutBoxModel::getId).collect(Collectors.toList());
        // 先删除旧的数据
        outBoxDao.deleteBatchIds(ids);
        // 再添加新的数据
        outBoxDao.batchInsertMessage(boxs);
    }

}
