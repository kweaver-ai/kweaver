package com.aishu.wf.core.common.log;

import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.util.RequestUtils;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;

/**
 * @description 接口调用日志切面
 * @author hanj
 */
@Slf4j
@Component
@Aspect
public class InterfaceCallLogAspect {

    @Pointcut("@annotation(org.springframework.web.bind.annotation.GetMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.PostMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public void pointCut() {
    }

    @Around("pointCut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        long start = System.currentTimeMillis();
        Object[] args = point.getArgs();
        Object result = point.proceed();
        if (log.isDebugEnabled()) {
            String callMethod;
            HttpServletRequest request = RequestUtils.getRequest();
            if (request != null) {
                callMethod = request.getRequestURI();
            } else {
                MethodSignature methodSignature = (MethodSignature) point.getSignature();
                callMethod = methodSignature.getMethod().getName();
            }
            log.debug("调用接口：{}\n参数：{}\n返回值：{}\n耗时：{} ms", callMethod, JSONUtil.toJsonStr(args),
                    JSONUtil.toJsonStr(result), (System.currentTimeMillis() - start));
        }
        return result;
    }

}
