package com.aishu.wf.core.common.aspect.annotation;

import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @description 操作日志注解
 * @author hanj
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
public @interface OperationLog {
    /**
     * 日志级别
	 * @return
     */
    OperationLogConstants.LogLevel level();
    /**
     * 日志标题
     * @return
     */
    String title() default "";


}
