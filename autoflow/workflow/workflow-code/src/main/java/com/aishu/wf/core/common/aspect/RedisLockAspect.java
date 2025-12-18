package com.aishu.wf.core.common.aspect;

import cn.hutool.core.util.IdUtil;
import com.aishu.wf.core.common.aspect.annotation.RedisLock;
import com.aishu.wf.core.common.util.RedisLockUtil;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * @author ouandyang
 * @description 基于redis实现分布式锁
 */
@Slf4j
@Aspect
@Component
@Order(7)
public class RedisLockAspect {

    @Autowired
    private RedisLockUtil redisLockUtil;

    @Pointcut("@annotation(com.aishu.wf.core.common.aspect.annotation.RedisLock)")
    private void lockMethod() {
    }

    @Around("lockMethod() && @annotation(redisLock)")
    public Object doAround(ProceedingJoinPoint point, RedisLock redisLock) throws Throwable {
        String class_name = point.getTarget().getClass().getName();
        String method_name = point.getSignature().getName();
        String threadUUID = IdUtil.randomUUID();
        String redisKey = class_name + "." + method_name;
        Object result = null;
        try {
            redisLockUtil.lock(redisKey, threadUUID);
            log.info("lock aop rediskey ：" + redisKey);
            result = point.proceed();// result的值就是被拦截方法的返回值
        } finally {
            redisLockUtil.unlock(redisKey, threadUUID);
            log.info("unlock aop rediskey ：" + redisKey);
        }
        return result;
    }
}
