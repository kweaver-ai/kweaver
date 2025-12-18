package com.aishu.wf.core.common.aspect;

import com.aishu.wf.core.common.model.BasePage;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * @description 分页查询参数offset参数转换切面
 * @author hanj
 */
@Slf4j
@Aspect
@Component
public class PageQueryParameterConverterAspect {

    @Pointcut("@annotation(com.aishu.wf.core.common.aspect.annotation.PageQuery)")
    public void pointCut() {
    }

    @Before("pointCut()")
    public void before(JoinPoint point) {
        long beginTime = System.currentTimeMillis();
        Object[] args = point.getArgs();
        for (Object arg : args) {
            // 转换offset为pageNumber
            if (arg instanceof BasePage) {
                BasePage pageQuery = (BasePage) arg;
                Integer offset = pageQuery.getOffset();
                Integer limit = pageQuery.getLimit();
                if (log.isDebugEnabled()) {
                    log.debug("offset:{}", offset);
                    log.debug("limit:{}", limit);
                }
                if (offset == null) {
                    offset = 0;
                }
                if (limit == null) {
                    limit = 20;
                }
                if (offset < 0) {
                    throw new IllegalArgumentException("offset不能小于0");
                }
                if (limit < 1 || limit > 1000) {
                    throw new IllegalArgumentException("limit取值范围为[1, 1000]");
                }
                pageQuery.setPageSize(limit);
                if (offset == 0 || offset < limit) {
                    pageQuery.setPageNumber(1);
                } else {
                    pageQuery.setPageNumber((offset / limit) + 1);
                }
                if (log.isDebugEnabled()) {
                    log.debug("pageNumber:{}", pageQuery.getPageNumber());
                    log.debug("pageSize:{}", pageQuery.getPageSize());
                }
            }
        }
        if (log.isInfoEnabled()) {
            long time = System.currentTimeMillis() - beginTime;
            log.info("分页查询参数offset参数转换耗时：{} ms", time);
        }
    }

}
