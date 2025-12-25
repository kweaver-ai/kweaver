package com.aishu.doc.audit.service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aishu.doc.audit.dao.DocAuditHistoryDao;
import com.aishu.doc.audit.dao.DocAuditMessageDao;
import com.aishu.doc.audit.dao.DocAuditMessageReceiverDao;
import com.aishu.doc.audit.model.DocAuditMessageModel;
import com.aishu.doc.audit.model.DocAuditMessageReceiverModel;
import com.aishu.doc.audit.model.dto.DocAuditMessageWithReceiversDTO;
import com.aishu.doc.msg.model.MsgContent;
import com.aishu.doc.msg.model.MsgObject;
import com.aishu.wf.core.anyshare.model.User;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DocAuditMessageService {

    @Autowired
    private DocAuditMessageDao docAuditMessageDao;

    @Autowired
    DocAuditMessageReceiverDao docAuditMessageReceiverDao;

    @Autowired
    DocAuditHistoryDao docAuditHistoryDao;

    @Transactional
    public String insertMessage(String procInstId, MsgObject msgObject) {
        String messageId = IdUtil.randomUUID();
        MsgContent content = msgObject.getContent();
        DocAuditMessageModel messageModel = DocAuditMessageModel.builder()
                .id(messageId)
                .procInstId(procInstId)
                .chan(msgObject.getChannel())
                .payload(JSON.toJSONString(content))
                .extMessageId("")
                .build();
        docAuditMessageDao.insert(messageModel);
        List<String> receiverIds = msgObject.getReceivers().stream().map(User::getId).collect(Collectors.toList());

        for (String receiverId : receiverIds) {
            DocAuditMessageReceiverModel receiverModel = DocAuditMessageReceiverModel.builder()
                    .id(IdUtil.randomUUID())
                    .messageId(messageModel.getId())
                    .receiverId(receiverId)
                    .handlerId("")
                    .build();
            docAuditMessageReceiverDao.insert(receiverModel);
        }
        List<String> curAuditorTaskIds = content.getCur_auditors().stream().filter(
                item -> receiverIds.contains(item.get("id")))
                .map(item -> (String) item.get("task_inst_id"))
                .collect(Collectors.toList());
        if (CollUtil.isNotEmpty(curAuditorTaskIds)) {
            docAuditHistoryDao.batchUpdateHisTaskMessageId(messageModel.getId(), curAuditorTaskIds);
        }
        return messageModel.getId();
    }

    public void updateExtMessageId(String messageId, String extMessageId) {
        docAuditMessageDao.updateById(DocAuditMessageModel.builder()
                .id(messageId)
                .extMessageId(extMessageId).build());
    }

    public void deleteMessagesByProcInstId(String procInstId) {
        LambdaQueryWrapper<DocAuditMessageModel> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(DocAuditMessageModel::getProcInstId, procInstId)
                .select(DocAuditMessageModel::getId);
        List<DocAuditMessageModel> messages = docAuditMessageDao.selectList(queryWrapper);
        if (CollUtil.isNotEmpty(messages)) {
            LambdaQueryWrapper<DocAuditMessageReceiverModel> receiverQueryWrapper = new LambdaQueryWrapper<>();
            receiverQueryWrapper.in(DocAuditMessageReceiverModel::getMessageId,
                    messages.stream().map(DocAuditMessageModel::getId).collect(Collectors.toList()));
            docAuditMessageReceiverDao.delete(receiverQueryWrapper);
        }
        docAuditMessageDao.delete(queryWrapper);
    }

    public void updateMessageHandler(String handlerId, String auditStatus, String messageId, List<String> receiverIds) {
        LambdaUpdateWrapper<DocAuditMessageReceiverModel> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(DocAuditMessageReceiverModel::getMessageId, messageId)
                .in(DocAuditMessageReceiverModel::getReceiverId, receiverIds)
                .eq(DocAuditMessageReceiverModel::getHandlerId, "")
                .set(DocAuditMessageReceiverModel::getAuditStatus, auditStatus);
        if (StrUtil.isNotEmpty(handlerId)) {
            updateWrapper.set(DocAuditMessageReceiverModel::getHandlerId, handlerId);
        }
        docAuditMessageReceiverDao.update(null, updateWrapper);
    }

    public void updateMessageHandlerByProcInstId(String handlerId, String auditStatus, String procInstId) {
        LambdaQueryWrapper<DocAuditMessageModel> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(DocAuditMessageModel::getProcInstId, procInstId)
                .select(DocAuditMessageModel::getId);
        List<DocAuditMessageModel> messages = docAuditMessageDao.selectList(queryWrapper);
        if (CollUtil.isNotEmpty(messages)) {
            LambdaUpdateWrapper<DocAuditMessageReceiverModel> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper
                    .in(DocAuditMessageReceiverModel::getMessageId,
                            messages.stream().map(DocAuditMessageModel::getId).collect(Collectors.toList()))
                    .eq(DocAuditMessageReceiverModel::getHandlerId, "")
                    .set(DocAuditMessageReceiverModel::getAuditStatus, auditStatus);
            if (StrUtil.isNotEmpty(handlerId)) {
                updateWrapper.set(DocAuditMessageReceiverModel::getHandlerId, handlerId);
            }
            docAuditMessageReceiverDao.update(null, updateWrapper);
        }
    }

    public List<DocAuditMessageReceiverModel> selectUnhandledReceiversByProcInstId(String procInstId) {
        return docAuditMessageReceiverDao.selectUnhandledReceiversByProcInstId(procInstId);
    }

    public DocAuditMessageModel selectMessageById(String id) {
        return docAuditMessageDao.selectById(id);
    }

    public List<DocAuditMessageReceiverModel> selectHandledReceiversByMessageId(String messageId) {
        LambdaQueryWrapper<DocAuditMessageReceiverModel> queryWrapper = new LambdaQueryWrapper<>();

        queryWrapper.eq(DocAuditMessageReceiverModel::getMessageId, messageId)
                .notIn(DocAuditMessageReceiverModel::getAuditStatus, Arrays.asList("", "pending"));

        return docAuditMessageReceiverDao.selectList(queryWrapper);
    }

    public List<DocAuditMessageWithReceiversDTO> selectRemindAuditorMessages(String procInstId,
            List<String> auditorIds) {
        return docAuditMessageDao.selectRemindAuditorMessages(procInstId, auditorIds);
    }
}
