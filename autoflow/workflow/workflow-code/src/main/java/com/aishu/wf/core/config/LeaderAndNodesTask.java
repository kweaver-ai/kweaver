package com.aishu.wf.core.config;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import com.aishu.wf.core.doc.service.RunOnAllService;
import com.aishu.wf.core.doc.service.RunOnMasterService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Order(value = 3)
@Component
public class LeaderAndNodesTask implements ApplicationRunner {
    @Autowired
    private RunOnMasterService runOnMasterService;

    @Autowired
    private RunOnAllService runOnAllService;

    @Value("${execute_workflow_config_init}")
    private boolean execute_workflow_config_init;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (execute_workflow_config_init) {
            Runnable run = () -> {
                while (true) {
                    runOnMasterService.setLatch(new CountDownLatch(4));
                    runOnMasterService.runOnMaster();
                    try {
                        TimeUnit.SECONDS.sleep(30);
                        log.info("restart push message thread");
                    } catch (Exception e) {
                        log.info("restart push message thread, sleep failed, detail: {}", e);
                    }
                }
            };
            executor.execute(run);

            Runnable run1 = () -> {
                runOnAllService.runOnAll();
            };
            executor.execute(run1);
        }
    }

}
