package com.aishu.wf.core.engine.core.identity;

import org.activiti.engine.impl.interceptor.Session;
import org.activiti.engine.impl.interceptor.SessionFactory;
import org.activiti.engine.impl.persistence.entity.GroupIdentityManager;
import org.springframework.beans.factory.annotation.Autowired;
/**
 * 扩展activiti资源组的管理类工厂
 * @version:  1.0
 * @author lw 
 */
public class CustomGroupManagerFactory implements SessionFactory {
	@Autowired
	private CustomGroupManager customGroupManager;

	
	public Class<?> getSessionType() {
		// 返回原始的GroupIdentityManager类型
		return GroupIdentityManager.class;
	}

	public Session openSession() {
		// 返回自定义的GroupEntityManager实例
		return customGroupManager;
	}

}
