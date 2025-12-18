package com.aishu.wf.core.anyshare.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @description Thrift远程过程服务调用配置类
 * @author hanj
 */
@Data
@Component
@ConfigurationProperties(prefix = "thrift")
public class ThriftConfig {

    private String eacphost;

    private String eacplogPort;

    private String evfshost;

    private String evfsPort;

    private String sharemgnthost;

    private String sharemgntPort;

}
