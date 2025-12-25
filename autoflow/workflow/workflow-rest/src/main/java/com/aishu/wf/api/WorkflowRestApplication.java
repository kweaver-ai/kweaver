package com.aishu.wf.api;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import com.aishu.wf.core.common.util.ApplicationContextHolder;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
/**
 * @description 启动类
 * @author hanj
 */
@Slf4j
@SpringBootApplication
@ComponentScan(basePackages = { "com.**", "org.activiti.*" })
@ServletComponentScan(basePackages = "com.**")
@EnableTransactionManagement
@EnableAspectJAutoProxy
public class WorkflowRestApplication {

	/**
	 * @description 容器状态监听
	 * @author hanj
	 * @updateTime 2021/5/13
	 */
	@Bean
	protected ServletContextListener listener() {
		return new ServletContextListener() {
			@Override
			public void contextInitialized(ServletContextEvent sce) {
				log.info("ServletContext initialized");
			}

			@Override
			public void contextDestroyed(ServletContextEvent sce) {
				log.info("ServletContext destroyed");
			}
		};
	}

	/**
	 * @description 初始化ApplicationContextHolder
	 * @author hanj
	 * @updateTime 2021/5/13
	 */
	@Bean
	protected ApplicationContextHolder applicationContextHolder() {
		return new ApplicationContextHolder();
	}

	/**
	 * @description 初始化并启动Spring容器
	 * @author hanj
	 * @param  args
	 * @updateTime 2021/5/13
	 */
	public static void main(String[] args) {
		SpringApplication.run(WorkflowRestApplication.class, args);
	}

}
