package com.aishu.wf.core.doc.service;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.model.InBoxModel;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Data
public class RunOnAllService {
    private final Integer MAX_ITEMS = 500;

    private ThreadPoolTaskExecutor executor;

    private Integer items;

    @Autowired
    private InBoxService inBoxService;

    public RunOnAllService() {
        this.executor = this.initThreadPollExcutor();
    }

    public ThreadPoolTaskExecutor initThreadPollExcutor() {
        ThreadPoolTaskExecutor iexecutor = new ThreadPoolTaskExecutor();
        iexecutor.setCorePoolSize(5);
        iexecutor.setMaxPoolSize(MAX_ITEMS);
        iexecutor.setThreadNamePrefix("InboxService-");
        iexecutor.initialize();
        return iexecutor;
    }

    public void runOnAll() {
        log.info("start inbox service...");
        while (true) {
            try {
                List<InBoxModel> msgs = inBoxService.selectInBoxMessage();
                if (msgs.size() == 0) {
                    TimeUnit.SECONDS.sleep(3);
                    continue;
                }
                
                for (InBoxModel msg : msgs) {
                    items = this.executor.getThreadPoolExecutor().getQueue().size();
                    while (items >= MAX_ITEMS) {
                        items = this.executor.getThreadPoolExecutor().getQueue().size();
                        TimeUnit.SECONDS.sleep(1);
                    };
                    Runnable run = () -> {
                        try {
                            MessageHandleExecutor mExecutor = ApplicationContextHolder.getBean(msg.getTopic(),MessageHandleExecutor.class);
                            if (mExecutor == null) {
                                inBoxService.deleteInBoxMessage(msg.getId());
                                return;
                            }
                            try {
                                mExecutor.handleMessage(msg.getMessage());
                                inBoxService.deleteInBoxMessage(msg.getId());
                            } catch (Exception e) {
                                try {
                                    inBoxService.updateInboxMessage(msg.getId());
                                } catch (Exception e1) {
                                }
                            }
                        } catch (Exception e) {
                            log.warn("handle message exception, detail: {}", e);
                        }
                    };
                    executor.execute(run);
                }
            } catch (Exception e) {
                log.warn("inbox service exception, detail: {}", e);
                try {
                    TimeUnit.SECONDS.sleep(30);
                } catch (InterruptedException e1) {
                }
                log.info("restart inbox service...");
            }
        }
    }
}
