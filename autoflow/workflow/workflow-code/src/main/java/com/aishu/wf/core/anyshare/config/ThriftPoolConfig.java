package com.aishu.wf.core.anyshare.config;

import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.anyshare.thrift.pool.ThriftPoolFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.Resource;

/**
 * @description Thrift远程过程服务调用配置类
 * @author hanj
 */
@Slf4j
@Configuration
public class ThriftPoolConfig {

    @Resource
    private ThriftConfig thriftConfig;

    @Bean(name = "documentPoolFactory")
    public ThriftPoolFactory documentPoolFactory() {
        String evfsPort = thriftConfig.getEvfsPort();
        String host = thriftConfig.getEvfshost();
        return new ThriftPoolFactory(host, Integer.valueOf(evfsPort));
    }

    @Bean(name = "eacpLogPoolFactory")
    public ThriftPoolFactory eacpLogPoolFactory() {
        String eacplogPort = thriftConfig.getEacplogPort();
        String host = thriftConfig.getEacphost();
        return new ThriftPoolFactory(host, Integer.valueOf(eacplogPort));
    }

    @Bean(name = "sharemgntPoolFactory")
    public ThriftPoolFactory sharemgntPoolFactory() {
        String eacplogPort = thriftConfig.getSharemgntPort();
        String host = thriftConfig.getSharemgnthost();
        return new ThriftPoolFactory(host, Integer.valueOf(eacplogPort));
    }

}
