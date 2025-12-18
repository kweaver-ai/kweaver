package com.aishu.wf.core.engine.core.handler;

/**
 * 引擎业务应用全局回调处理拦截器
 * @version:  1.0
 * @author lw 
 */
public class GlobalBizHandlerInterceptor {
	
	public void handleInvocation(GlobalBizHandlerInvocation invocation)
			throws Exception {
		invocation.proceed();
	}
}
