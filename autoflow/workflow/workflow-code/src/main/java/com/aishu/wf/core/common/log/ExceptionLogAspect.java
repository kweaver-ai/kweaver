package com.aishu.wf.core.common.log;

import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.sys.service.SysLogService;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.common.util.RequestUtils;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;

/**
 * @description 统一处理异常和日志的切面类
 * @author ouandyang
 */
@Slf4j
//@Component
//@Aspect
public class ExceptionLogAspect {

    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Resource
    private SysLogService logService;

    @Pointcut("@annotation(org.springframework.web.bind.annotation.GetMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.PostMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping) ||" +
            "@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public void logPointCut() {}

    /**
     * 记录异常信息
     * @param joinPoint
     * @param ex
     */
    @AfterThrowing(throwing = "ex", pointcut = "logPointCut()")
    public void exceptionDispose(JoinPoint joinPoint, Throwable ex){
        HttpServletRequest request = RequestUtils.getRequest();
        String exMsg = String.format("[Params]：%s，\n[Exception]：%s",
                JSONUtil.toJsonStr(joinPoint.getArgs()), ex.getLocalizedMessage());
        SysLogBean sysLogBean = SysLogBean.builder()
                .type(SysLogBean.TYPE_ERROR)
                .url(request.getRequestURI())
                .systemName(contextPath.replaceFirst(SysLogUtils.API, ""))
                .userId(RequestUtils.getUserId())
                .msg("")
                .exMsg(exMsg)
                .createTime(new Date()).build();
        try {
            logService.save(sysLogBean);
        } catch (Exception e) {
            log.error("Exception logging failed", e);
        }
    }
}
