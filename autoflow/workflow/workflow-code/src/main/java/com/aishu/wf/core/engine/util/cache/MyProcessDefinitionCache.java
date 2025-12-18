package com.aishu.wf.core.engine.util.cache;

import com.alibaba.fastjson.JSON;
import com.aishu.wf.core.engine.util.RedisUtil;
import org.activiti.engine.impl.persistence.deploy.DeploymentCache;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * @author lw
 */

public class MyProcessDefinitionCache implements DeploymentCache<ProcessDefinitionEntity> {

    protected static Logger logger = LoggerFactory.getLogger(MyProcessDefinitionCache.class);

    public final static String PROCESS_DEFINITION_KEY = "processDefinitionKey";


    private RedisTemplate<String, ProcessDefinitionEntity> redisTemplate;

    public MyProcessDefinitionCache() {
    }

	public void setRedisTemplate(StringRedisTemplate stringRedisTemplate, RedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	@Override
    public ProcessDefinitionEntity get(String id) {
        try {
            ProcessDefinitionEntity processDefinitionEntity =
                    (ProcessDefinitionEntity) redisTemplate.opsForHash().get(PROCESS_DEFINITION_KEY, id);
            if (logger.isDebugEnabled()) {
                logger.debug("从缓存中获取流程定义对象内容:{}", processDefinitionEntity);
            }
            return processDefinitionEntity;
        } catch (Exception e) {
            logger.warn("从缓存中获取流程定义对象失败！id：{}", id, e);
            return null;
        }
    }

	@Override
    public void add(String id, ProcessDefinitionEntity processDefinitionEntity) {
        try {
            redisTemplate.opsForHash().put(PROCESS_DEFINITION_KEY, id, processDefinitionEntity);
            if (logger.isDebugEnabled()) {
                logger.debug("将流程定义对象添加至缓存容器中:{}", JSON.toJSONString(processDefinitionEntity));
            }
        } catch (Exception e) {
            logger.warn("将流程定义对象添加至缓存容器中失败！", e);
        }
    }

	@Override
    public void remove(String id) {
        try {
            redisTemplate.opsForHash().delete(PROCESS_DEFINITION_KEY, id);
            if (logger.isDebugEnabled()) {
                logger.debug("从缓存中删除流程定义对象:{}", id);
            }
        } catch (Exception e) {
            logger.warn("从缓存中删除流程定义对象失败！id：{}", id, e);
        }
    }

	@Override
    public void clear() {
        try {
            Boolean delete = redisTemplate.delete(PROCESS_DEFINITION_KEY);
            if (logger.isDebugEnabled()) {
                logger.debug("清空缓存中所有流程定义对象，结果：{}", delete);
            }
        } catch (Exception e) {
            logger.warn("清空缓存中所有流程定义对象失败！", e);
        }
    }

    public RedisTemplate getProcessDefinitionCache() {
        return this.redisTemplate;
    }

}