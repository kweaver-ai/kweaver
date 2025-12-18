package com.aishu.wf.core.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author ouandyang
 * @date 2022/3/18
 */
@Data
@Component
@ConfigurationProperties(prefix = "redis")
public class RedisProperty {

    public final static String CONNECT_TYPE_STANDALONE = "standalone";
    public final static String CONNECT_TYPE_CLUSTER = "cluster";
    public final static String CONNECT_TYPE_SENTINEL = "sentinel";
    public final static String CONNECT_TYPE_MASTER_SLAVE = "master-slave";

    /**
     * 连接方式
     */
    private String connectType;

    /**
     * 集群模式属性
     */
    private RedisProperty.Standalone cluster;
    /**
     * 单机模式属性
     */
    private RedisProperty.Standalone standalone;

    /**
     * 主从模式属性
     */
    private RedisProperty.MasterSlave masterSlave;

    /**
     * 哨兵模式属性
     */
    private RedisProperty.Sentinel sentinel;

    /**
     * redis是否开启SSL（暂不支持）
     */
    private boolean enableSSL;

    /**
     * Redis开启ssl之后,访问Redis建立ssl连接时验证的证书信息存储在kubernetes的secret中
     */
    private String secretName;

    /**
     * 存储证书的secret中, ca证书对应的参数名
     */
    private String caName;

    /**
     * 存储证书的secret中, cert 证书对应的参数名
     */
    private String certName;

    /**
     * 存储证书的secret中, 密钥对应的参数名
     */
    private String keyName;


    @Data
    public static class MasterSlave {
        private String masterHost;
        private Integer masterPort;
        private String slaveHost;
        private Integer slavePort;
        private String username;
        private String password;
    }

    @Data
    public static class Sentinel {
        private String sentinelHost;
        private Integer sentinelPort;
        private String masterGroupName;
        private String username;
        private String password;
        private String sentinelUsername;
        private String sentinelPassword;
    }

    @Data
    public static class Standalone {
        private String host;
        private Integer port;
        private String username;
        private String password;
    }

    @Data
    public static class cluster {
        private String host;
        private Integer port;
        private String username;
        private String password;
    }

}
