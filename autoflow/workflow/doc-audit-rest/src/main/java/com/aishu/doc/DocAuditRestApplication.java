package com.aishu.doc;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.context.annotation.FilterType;

import com.aishu.wf.core.common.util.ApplicationContextHolder;

/**
 * @description 启动类
 * @author ouandyang
 */
@Slf4j
@SpringBootApplication
@ComponentScan(basePackages = { "com.**", "org.activiti.*" }, 
               excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.tongtech\\.fastjson\\..*"))
@ServletComponentScan(basePackages = "com.**")
@EnableTransactionManagement
@EnableAspectJAutoProxy
	public class DocAuditRestApplication {

	/**
	 * @description 初始化ApplicationContextHolder
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	@Bean
	protected ApplicationContextHolder applicationContextHolder() {
		return new ApplicationContextHolder();
	}

	/**
	 * @description 初始化并启动Spring容器
	 * @author ouandyang
	 * @param  args
	 * @updateTime 2021/5/13
	 */
	public static void main(String[] args) {
		SpringApplication.run(DocAuditRestApplication.class, args);
	}

}
