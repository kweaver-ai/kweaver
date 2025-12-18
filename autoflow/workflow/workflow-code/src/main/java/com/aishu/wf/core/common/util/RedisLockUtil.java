package com.aishu.wf.core.common.util;

import cn.hutool.core.util.StrUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * @author ouandyang
 * @description redis分布式锁工具类
 */
@Component
public class RedisLockUtil {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private static long DEFALT_TIMEOUT = 1L;

    /**
     * @description 上锁
     * @author ouandyang
     * @param  key 锁标识
     * @param  value 线程标识
     * @param  timeout 超时时间，秒
     * @updateTime 2021/9/14
     */
    public boolean lock(String key, String value, long timeout) {
        return stringRedisTemplate.opsForValue().setIfAbsent(key, value, timeout, TimeUnit.SECONDS);
    }

    /**
     * @description 上锁（排队等待）
     * @author ouandyang
     * @param  key 锁标识
     * @param  value 线程标识
     * @updateTime 2021/9/14
     */
    public boolean lock(String key, String value) {
        while (true) {
            // 执行set命令
            Boolean absent = stringRedisTemplate.opsForValue().setIfAbsent(key, value, DEFALT_TIMEOUT, TimeUnit.MINUTES);
            // 是否成功获取锁
            if (absent) {
                return true;
            }
        }
    }

    /**
     * @description 解锁
     * @author ouandyang
     * @param  key 锁标识
     * @param  value 线程标识
     * @updateTime 2021/9/14
     */
    public boolean unlock(String key, String value) {
        String currentValue = stringRedisTemplate.opsForValue().get(key);
        if(StrUtil.isNotBlank(currentValue) && currentValue.equals(value) ){
            return stringRedisTemplate.opsForValue().getOperations().delete(key);
        }
        return false;
    }

    public boolean tryLock(String key, String value, long timeout) {
        Boolean result = false;
        while (!result) {
            result = stringRedisTemplate.opsForValue().setIfAbsent(key, value, timeout, TimeUnit.SECONDS);
            if (result){
                return result;
            }
            try {
                TimeUnit.SECONDS.sleep(5);
            } catch (InterruptedException e) {
                return false;
            }
        }
        return result;
    }

    public boolean reNew(String lock_key, long lock_expired_time, TimeUnit unit ){
        Boolean lockExists = stringRedisTemplate.hasKey(lock_key);
        if (lockExists) {
            return stringRedisTemplate.expire(lock_key, lock_expired_time, unit);
        }
        return false;
    }

    public Long getExpiredTime(String lock_key){
        Long expirationTime = 0L;
        Boolean lockExists = stringRedisTemplate.hasKey(lock_key);
        if (lockExists) {
            // 获取当前锁的过期时间
            expirationTime = stringRedisTemplate.getExpire(lock_key);
        }else{
            expirationTime = -1L;
        }
        return expirationTime;
    }
}
