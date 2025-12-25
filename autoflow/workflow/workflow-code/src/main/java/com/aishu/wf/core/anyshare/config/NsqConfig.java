package com.aishu.wf.core.anyshare.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @description NSQ配置类
 * @author hanj
 */
@Data
@Component
public class NsqConfig {

    @Value("${nsq.lookup-host}")
    private String lookupHost;

    @Value("${nsq.lookup-port}")
    private Integer lookupPort;

    @Value("${nsq.produce-host}")
    private String produceHost;

    @Value("${nsq.produce-port}")
    private Integer producePort;

    @Value("${nsq.type}")
    private String mqType;
    
    @Value("${nsq.auth.username}")
    private String UserName;

    @Value("${nsq.auth.password}")
    private String PassWord;

    @Value("${nsq.auth.mechanism}")
    private String Mechanism;

}
