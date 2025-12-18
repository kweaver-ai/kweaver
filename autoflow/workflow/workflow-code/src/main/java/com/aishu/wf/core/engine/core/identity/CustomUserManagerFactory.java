package com.aishu.wf.core.engine.core.identity;

import org.activiti.engine.impl.interceptor.Session;
import org.activiti.engine.impl.interceptor.SessionFactory;
import org.activiti.engine.impl.persistence.entity.UserIdentityManager;
import org.springframework.beans.factory.annotation.Autowired;
/**
 * 扩展activiti人员的管理类工厂
 * @version:  1.0
 * @author lw 
 */
public class CustomUserManagerFactory implements SessionFactory {
	@Autowired
	private CustomUserManager customUserManager;


	public Class<?> getSessionType() {
		// 返回原始的UserIdentityManager类型
		return UserIdentityManager.class;
	}

	public Session openSession() {
		// 返回自定义的UserManager实例
		return customUserManager;
	}

}
