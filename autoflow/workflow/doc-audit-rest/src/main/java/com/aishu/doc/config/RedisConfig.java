package com.aishu.doc.config;

import com.aishu.wf.core.common.config.RedisProperty;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisNode;
import org.springframework.data.redis.connection.RedisSentinelConfiguration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.RedisStaticMasterReplicaConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * @author ouandyang
 * @date 2022/3/18
 */
@Slf4j
@Configuration
public class RedisConfig {
    @Autowired
    RedisProperty redisProperty;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        LettuceConnectionFactory redisConnectionFactory = null;
        if (RedisProperty.CONNECT_TYPE_SENTINEL.equals(redisProperty.getConnectType())) {
            RedisSentinelConfiguration sentinelConfiguration = new RedisSentinelConfiguration();
            sentinelConfiguration.setMaster(redisProperty.getSentinel().getMasterGroupName());
            List<RedisNode> sentinelNode = new ArrayList<RedisNode>();
            sentinelNode.add(new RedisNode(redisProperty.getSentinel().getSentinelHost(),
                    redisProperty.getSentinel().getSentinelPort()));
            sentinelConfiguration.setSentinels(sentinelNode);
            sentinelConfiguration.setUsername(redisProperty.getSentinel().getUsername());
            sentinelConfiguration.setPassword(redisProperty.getSentinel().getPassword());
            sentinelConfiguration.setSentinelPassword(redisProperty.getSentinel().getSentinelPassword());
            redisConnectionFactory = new LettuceConnectionFactory(sentinelConfiguration);
        } else if (RedisProperty.CONNECT_TYPE_MASTER_SLAVE.equals(redisProperty.getConnectType())) {
            RedisStaticMasterReplicaConfiguration redisConfiguration = new RedisStaticMasterReplicaConfiguration(
                    redisProperty.getMasterSlave().getMasterHost(),
                    redisProperty.getMasterSlave().getMasterPort());
            if (StrUtil.isNotBlank(redisProperty.getMasterSlave().getSlaveHost())) {
                redisConfiguration.addNode(redisProperty.getMasterSlave().getSlaveHost(),
                        redisProperty.getMasterSlave().getSlavePort());
            }
            redisConfiguration.setUsername(redisProperty.getMasterSlave().getUsername());
            redisConfiguration.setPassword(redisProperty.getMasterSlave().getPassword());
            redisConnectionFactory = new LettuceConnectionFactory(redisConfiguration);
        } else if (RedisProperty.CONNECT_TYPE_STANDALONE.equals(redisProperty.getConnectType())) {
            RedisStandaloneConfiguration redisConfiguration = new RedisStandaloneConfiguration(
                    redisProperty.getStandalone().getHost(), redisProperty.getStandalone().getPort());
            redisConfiguration.setUsername(redisProperty.getStandalone().getUsername());
            redisConfiguration.setPassword(redisProperty.getStandalone().getPassword());
            redisConnectionFactory = new LettuceConnectionFactory(redisConfiguration);
        } else {
            // Map<String, Object> source = new HashMap<>();
            // source.put("spring.redis.cluster.nodes",
            // redisProperty.getCluster().getHost());
            // MapPropertySource propertySource = new
            // MapPropertySource("redisClusterConfig", source);
            // RedisClusterConfiguration redisClusterConfig = new
            // RedisClusterConfiguration(propertySource);

            String clusterNodesStr = redisProperty.getCluster().getHost();
            String[] hostArray = clusterNodesStr.split(",");
            List<String> clusterNodes = new ArrayList<>();

            // 验证并处理每个节点的端口
            for (String host : hostArray) {
                // 去除可能的空白字符
                host = host.trim();
                // 检查是否已包含端口
                if (!host.contains(":")) {
                    // 如果没有端口，使用默认端口
                    host = host + ":" + redisProperty.getCluster().getPort();
                }
                clusterNodes.add(host);
            }

            // 创建 RedisClusterConfiguration 使用处理后的节点列表
            RedisClusterConfiguration redisClusterConfig = new RedisClusterConfiguration(clusterNodes);
            redisClusterConfig.setUsername(redisProperty.getCluster().getUsername());
            redisClusterConfig.setPassword(redisProperty.getCluster().getPassword());
            redisConnectionFactory = new LettuceConnectionFactory(redisClusterConfig);
        }
        return redisConnectionFactory;

    }

}
