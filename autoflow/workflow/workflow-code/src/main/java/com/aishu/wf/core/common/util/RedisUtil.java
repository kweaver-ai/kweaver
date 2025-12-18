package com.aishu.wf.core.common.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/12/14 14:39
 */
@Component
public class RedisUtil {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    /**
     * 设置指定 key 的值
	 * @param key
	 * @param value
	 */
    public void set(String key, String value) {
        stringRedisTemplate.opsForValue().set(key, value);
    }

    /**
     * 获取指定 key 的值
     * @param key
     * @return
     */
    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }
}
