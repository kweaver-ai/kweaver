package com.aishu.wf.core.config;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.PersonalConfigApi;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * @author siyu.chen
 * @version 1.0
 * @description: TODO
 * @date 2023/11/17 14:21
 */
@Slf4j
@Order(value = 3)
@Component
public class registerModuleService implements ApplicationRunner {

    @Autowired
    private RedisLockUtil redisLock;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    @Value("${execute_workflow_config_init}")
    private boolean execute_workflow_config_init;

    @Value("${module.version}")
    private String moduleVersion;

    private static long TIMEOUT = 60;

    private static final String MODULE_SERVICE_NAME = "WorkflowService";

    // retryIntervalSeconds 重试间隔时间
    private static final int retryIntervalSeconds = 30;
    
    // 最大重试次数
    private static final int maxRetryCount = 5;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 是否开启workflow审核配置信息初始化
        if (!execute_workflow_config_init) {
            return;
        }
        if (log.isInfoEnabled()) {
            log.info("workflow审核注册模块化服务正在执行...");
        }

        // 上锁
        long time = System.currentTimeMillis();
        try {
            boolean result = redisLock.lock("registerModuleService", String.valueOf(time), TIMEOUT);
            if (log.isInfoEnabled()) {
                log.info("获得锁的结果：" + result + "；获得锁的时间戳：" + String.valueOf(time));
            }
            if (!result) {
                if (log.isInfoEnabled()) {
                    log.info("已存在workflow审核注册模块化服务！！！");
                }
                return;
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.error("redis 连接异常");
            System.exit(1);
        }
        Runnable run = () -> {
            int retryCount = 0;
            while (true) {
                try {
                    JSONObject service = new JSONObject();
                    service.put("name", MODULE_SERVICE_NAME);
                    service.put("version", moduleVersion);
                    JSONObject module = new JSONObject();
                    module.put("name", MODULE_SERVICE_NAME);
                    module.put("version", moduleVersion);
                    service.put("module", module);
                    String postData = JSON.toJSONString(service);
                    AnyShareConfig anyshareConfig = (AnyShareConfig) ApplicationContextHolder.getBean("anyShareConfig");
                    PersonalConfigApi client = new AnyShareClient(anyshareConfig).getPersonalConfigApi();
                    String result = client.registModuleService(postData);
                    if (StrUtil.isNotBlank(result)) {
                        log.info("workflow审核注册模块化服务执行结果: {}", result);
                        throw new Exception(result);
                    }
                    return;
                } catch (Exception e) {
                    retryCount++;
                    log.error("workflow审核注册模块化服务执行失败，当前重试次数: {}/{}", retryCount, maxRetryCount, e);
                    
                    if (retryCount >= maxRetryCount) {
                        log.error("workflow审核注册模块化服务重试次数已达上限，停止重试");
                        redisLock.unlock("registerModuleService", String.valueOf(time));
                        if (log.isInfoEnabled()) {
                            log.info("释放锁的时间戳" + String.valueOf(time));
                        }
                        return;
                    }
                    
                    try {
                        TimeUnit.SECONDS.sleep(retryIntervalSeconds);
                    } catch (InterruptedException ex) {
                        log.error("workflow审核注册模块化服务执行重试失败", ex);
                        redisLock.unlock("registerModuleService", String.valueOf(time));
                        if (log.isInfoEnabled()) {
                            log.info("释放锁的时间戳" + String.valueOf(time));
                        }
                        System.exit(1);
                    }
                } finally {
                    // 释放锁
                    redisLock.unlock("registerModuleService", String.valueOf(time));
                    if (log.isInfoEnabled()) {
                        log.info("释放锁的时间戳" + String.valueOf(time));
                    }
                }
            }
        };
        executor.execute(run);
    }
}
