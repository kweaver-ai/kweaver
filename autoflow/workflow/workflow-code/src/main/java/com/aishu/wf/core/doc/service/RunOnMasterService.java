package com.aishu.wf.core.doc.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.aishu.wf.core.doc.model.InternalGroupModel;
import com.aishu.wf.core.doc.model.OutBoxModel;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;
import java.util.Calendar;

@Slf4j
@Service
@Data
@EnableScheduling
public class RunOnMasterService {
    @Autowired
    private NsqSenderService nsqSenderService;
    @Autowired
    private RedisLockUtil redisLock;
    @Autowired
    private ThreadPoolTaskExecutor executor;
    @Autowired
    private OutBoxService outBoxService;
    @Autowired
    private ClearInternalGroupService clearInternalGroupService;

    private final String LOCK_KEY = "workflow_pushmessage";

    private final Long EXPIRED_TIME = 30L;

    private final Long expiredTimeThreshold = EXPIRED_TIME / 3;

    private boolean shouldStop = false;

    private CountDownLatch latch;

    public void runOnMaster() {
        try {
            Boolean isLock = redisLock.tryLock(LOCK_KEY, "", EXPIRED_TIME);
            if (isLock) {
                shouldStop = false;
                executor.execute(() -> {
                    this.renew();
                });
                executor.execute(()->{
                    this.pushMessage();
                });
                executor.execute(()->{
                    this.clearInternalGroup();
                });
                executor.execute(()->{
                    this.expiredReminder();
                });
                latch.await();
            }
        } catch (Exception e) {
            log.error("start run on master exception, detail: {}", e);
            shouldStop = true;
        }
    }

    public void renew() {
        try {
            while (!shouldStop) {
                Long expiredTime = redisLock.getExpiredTime(LOCK_KEY);
                if (expiredTime <= 0) {
                    shouldStop = true;
                    return;
                }
                if (expiredTime > expiredTimeThreshold) {
                    Long toBeSleepTime = expiredTime - expiredTimeThreshold;
                    TimeUnit.SECONDS.sleep(toBeSleepTime);
                }

                // 保证线程进行锁续租时当前主线程还在运行
                if (shouldStop) {
                    return;
                }

                Boolean isRenew = redisLock.reNew(LOCK_KEY, EXPIRED_TIME, TimeUnit.SECONDS);
                if (!isRenew) {
                    shouldStop = true;
                    return;
                }
            }
        } catch (Exception e) {
            log.error("renew lock thread exception, detail: {}", e);
            shouldStop = true;
        } finally {
            latch.countDown();
        }
    }

    public void pushMessage() {
        log.info("get lock, start push master thread...");
        try{
            Map<String, Integer> retryMap = new HashMap<>();
            while (!shouldStop) {
                List<OutBoxModel> messages = outBoxService.selectOutBoxMessage();
                if (messages.size() <= 0) {
                    try {
                        TimeUnit.SECONDS.sleep(30);
                    } catch (InterruptedException e) {
                    }
                    continue;
                }
                List<String> ids = new ArrayList<>();
                List<OutBoxModel> retryList = new ArrayList<>();
                for (OutBoxModel message : messages) {
                    // 如果锁续租线程结束应该结束当前push操作
                    if (shouldStop) {
                        outBoxService.deleteOutBoxMessage(ids);
                        return;
                    }
                    try {
                        JSONObject messageObj = JSONUtil.parseObj(message.getMessage());
                        nsqSenderService.sendMessageRetry(message.getTopic(), messageObj);
                    } catch (Exception e) {
                        Integer retryTime = retryMap.containsKey(message.getId()) ? retryMap.get(message.getId()) : 0;
                        if (retryTime >= 5) {
                            retryMap.remove(message.getId());
                            ids.add(message.getId());
                            continue;
                        }
                        Calendar calendar = Calendar.getInstance();
                        calendar.setTime(message.getCreateTime());
                        calendar.add(Calendar.MINUTE, (int) Math.pow(2, retryTime));
                        message.setCreateTime(calendar.getTime());
                        retryMap.put(message.getId(), ++retryTime);
                        retryList.add(message);
                        continue;
                    }
                    ids.add(message.getId());
                }
                try {
                    if (ids.size() > 0) {
                        outBoxService.deleteOutBoxMessage(ids);
                    }
                    if (retryList.size() > 0) {
                        outBoxService.batchInsertMessage(retryList);
                    }
                } catch (Exception e) {
                    log.info("pushMessage clear box message error, detail:{}", e);
                }
                // 每批处理休眠3s，防止速度过快
                try {
                    TimeUnit.SECONDS.sleep(3);
                } catch (InterruptedException e) {
                }
            }
        } finally {
            latch.countDown();
            log.info("shutdown push message thread...");
        }
    }

    public void clearInternalGroup() {
        log.info("get lock, start clear internal group thread...");
        try{
            while (!shouldStop) {
                List<InternalGroupModel> expiredGroups = clearInternalGroupService.selectExpiredInternalGroup();
                if (expiredGroups.size() <= 0) {
                    try {
                        TimeUnit.SECONDS.sleep(30);
                    } catch (InterruptedException e) {
                    }
                    continue;
                }
                List<String> ids = new ArrayList<>();
                List<String> groups = new ArrayList<>();
                for (InternalGroupModel expiredGroup : expiredGroups) {
                    ids.add(expiredGroup.getId());
                    groups.add(expiredGroup.getGroupID());
                }
                clearInternalGroupService.deleteExpiredInternalGroup(ids, groups);
            }
        } finally {
            latch.countDown();
            log.info("shutdown clear internal group thread...");
        }
    }

    public void expiredReminder() {
        log.info("get lock, start expire reminder schedule thread...");
        try {
            // 创建调度器
            Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();
            scheduler.clear();

            // 定义任务
            JobDetail job = JobBuilder.newJob(DelayJobService.class)
                    .withIdentity("dailyJob", "group1")
                    .build();

            // 定义触发器，使用Cron表达式，每天上午10点执行一次
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("dailyTrigger", "group1")
                    .withSchedule(CronScheduleBuilder.cronSchedule("0 0 10 * * ?"))
                    .build();

            // 将任务和触发器添加到调度器中
            scheduler.scheduleJob(job, trigger);

            // 启动调度器
            scheduler.start();

            try {
                while(!shouldStop){
                    TimeUnit.SECONDS.sleep(30L);
                    continue;
                }
                if (!scheduler.isShutdown()) {
                    scheduler.shutdown();
                }
            } catch (Exception e) {
                log.error("shutdown expire reminder schedule task failed, detail: {}", e);
            }
        } catch (SchedulerException e) {
            log.error("expire reminder schedule task occured exception, detail: {}", e);
        } finally {
            latch.countDown();
            log.info("shutdown expire reminder thread...");
        }
    }
}
