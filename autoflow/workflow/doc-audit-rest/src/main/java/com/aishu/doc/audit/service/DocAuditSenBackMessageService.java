package com.aishu.doc.audit.service;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.dao.DocAuditSendBackMessageDao;
import com.aishu.doc.audit.model.DocAuditSendBackModel;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.ProcessMessageOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DocAuditSenBackMessageService {
    @Autowired
    DocAuditSendBackMessageDao docAuditSendBackMessageDao;

    @Autowired
    AnyShareConfig anyShareConfig;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    ProcessMessageOperation processMessageOperation;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        processMessageOperation = anyShareClient.getProcessMessageOperation();
    }

    public void handleSendBackMessage(String procInstID, String receiver, String handlerId) {
        Runnable run = ()->{
            try {
                DocAuditSendBackModel docAuditSendBackModel = docAuditSendBackMessageDao.selectOne(new LambdaQueryWrapper<DocAuditSendBackModel>().eq(DocAuditSendBackModel::getProcInstId, procInstID));
                if (docAuditSendBackModel == null) {
                    return;
                }
                List<String> receivers = new ArrayList<>();
                receivers.add(receiver);
                processMessageOperation.updateTodoMessageReceiverHandler(docAuditSendBackModel.getMessageId(), receivers, handlerId);
                docAuditSendBackMessageDao.deleteById(docAuditSendBackModel.getId());
            } catch (Exception e) {
                log.warn("handle sendback message failed, detail: ", e);
            }
        };
        executor.execute(run);
    }
}
