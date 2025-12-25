package com.aishu.wf.core.config;

import cn.hutool.core.codec.Base64;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.aishu.wf.core.common.util.RedisUtil;
import com.aishu.wf.core.config.AuditConfig;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/12/14 14:03
 */
@Slf4j
@Order(value = 3)
@Component
public class InitWorkflowConfig implements ApplicationRunner  {

    @Autowired
    private RedisLockUtil redisLock;

    @Autowired
    private RedisUtil redisUtil;

    @Value("${execute_workflow_config_init}")
    private boolean execute_workflow_config_init;

    private static long TIMEOUT = 60;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 是否开启workflow审核配置信息初始化
        if(!execute_workflow_config_init){
            return;
        }
        if (log.isInfoEnabled()) {
            log.info("workflow审核配置信息初始化正在执行...");
        }

        //上锁
        long time = System.currentTimeMillis();
        try {
            boolean result = redisLock.lock("initWorkflowConfig", String.valueOf(time), TIMEOUT);
            if (log.isInfoEnabled()) {
                log.info("获得锁的结果：" + result + "；获得锁的时间戳：" + String.valueOf(time));
            }
            if(!result){
                if (log.isInfoEnabled()) {
                    log.info("已存在workflow审核配置信息初始化！！！");
                }
                return;
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.error("redis 连接异常");
            System.exit(1);
        }
        try {
            String path = System.getProperty("user.dir");
            File projectFile = new File(new File(path).getParent());
            File headJsonFile = new File(projectFile.getParent() + File.separator + "conf" + File.separator + "workflowconfig" + File.separator + "mail" + File.separator + "head.json");
            File headPngFile = new File(projectFile.getParent() + File.separator + "conf" + File.separator + "workflowconfig"  + File.separator + "mail" + File.separator + "mail.png");
            File auditPluginFile = new File(projectFile.getParent() + File.separator + "conf" + File.separator + "workflowconfig" + File.separator + "plugin" + File.separator + "auditPlugin.json");
            if(!headJsonFile.exists()){
                log.error("workflow审核配置信息初始化，" + headJsonFile.getPath() + " not exists");
                return;
            }
            if(!headPngFile.exists()){
                log.error("workflow审核配置信息初始化，" + headPngFile.getPath() + " not exists");
                return;
            }
            if(!auditPluginFile.exists()){
                log.error("workflow审核配置信息初始化，" + auditPluginFile.getPath() + " not exists");
                return;
            }
            String content = FileUtils.readFileToString(headJsonFile,"UTF-8");
            redisUtil.set(AuditConfig.HEAD_JSON, JSONUtil.toJsonStr(JSONUtil.parseObj(content)));

            String encodePng = Base64.encode(headPngFile);
            redisUtil.set(AuditConfig.HEAD_PNG, encodePng);

            String auditPluginContent = FileUtils.readFileToString(auditPluginFile,"UTF-8");
            redisUtil.set(AuditConfig.AUDIT_PLUGIN_JSON, JSONUtil.toJsonStr(JSONUtil.parseObj(auditPluginContent)));

        } catch (IOException e) {
            log.error("workflow审核配置信息初始化失败！", e);
        } finally {
            //释放锁
            redisLock.unlock("initWorkflowConfig", String.valueOf(time));
            if (log.isInfoEnabled()) {
                log.info("释放锁的时间戳" + String.valueOf(time));
            }
        }
    }
}
