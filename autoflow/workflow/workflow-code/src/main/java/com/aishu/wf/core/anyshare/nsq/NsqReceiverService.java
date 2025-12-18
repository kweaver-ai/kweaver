package com.aishu.wf.core.anyshare.nsq;

import com.aishu.wf.core.anyshare.config.NsqConfig;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import aishu.cn.msq.MessageHandler;
import aishu.cn.msq.ProtonMQClient;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.Map;
import java.util.Properties;

/**
 * @description nsq消息监听主类,负责启动所有主题类型的nsq监听
 * @author ouandyang
 */
@Slf4j
@Component
public class NsqReceiverService implements ApplicationRunner {

    @Resource
    private NsqConfig nsqConfig;

    @Autowired
    private ThreadPoolTaskExecutor executor;

    // private final NSQLookup lookup = new DefaultNSQLookup();
    private MsqClient instance;
    private ProtonMQClient mqClient;

    /**
     * @description nsq-lookup初始化
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @PostConstruct
    public void init() {
        instance = MsqClient.getMsqClient(nsqConfig);
        mqClient = instance.getProtonMQClient();
    }

    /**
     * @description Callback used to run the bean.
     * @author ouandyang
     * @param  args incoming application arguments
     * @updateTime 2021/5/13
     */
    @Override
    public void run(ApplicationArguments args) {
        Map<String, Object> callbackMap2 = ApplicationContextHolder.getBeans(MessageHandler.class);
        callbackMap2.forEach((k, v) -> {
            new Thread(() -> {
                System.out.println("topic: "+ k);
                if (log.isDebugEnabled()) {
                    log.debug("主题Topic为 {} 的NSQ监听类正在启动...", k);
                }
                Properties props = new Properties();
                props.setProperty("pollIntervalMilliseconds", "1000");
                props.setProperty("maxInFlight", "200");
                props.setProperty("retryTimes", "100");
                props.setProperty("msgTimeoutSeconds", "3000");
                if (nsqConfig.getMqType().equals("kafka")) {
                    mqClient.sub(k, NsqConstants.DEFAULT_CHANNEL, (MessageHandler) v, 1000, 200, 100, 3000);
                } else {
                    mqClient.sub(k, NsqConstants.DEFAULT_CHANNEL, (MessageHandler) v, props);
                }
                if (log.isDebugEnabled()) {
                    log.debug("主题Topic为 {} 的NSQ监听类启动成功！", k);
                }
            }).start();
        });
    }

}
