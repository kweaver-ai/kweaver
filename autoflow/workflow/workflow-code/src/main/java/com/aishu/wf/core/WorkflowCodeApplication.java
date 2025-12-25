package com.aishu.wf.core;

import com.aishu.wf.core.common.util.ApplicationContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

@Slf4j
@SpringBootApplication
@ComponentScan(basePackages = {"com.**", "org.activiti.*"})
@ServletComponentScan(basePackages = "com.**")
@EnableTransactionManagement
@EnableAspectJAutoProxy
@ConditionalOnProperty(prefix = "ut", name = "application", havingValue = "true")
public class WorkflowCodeApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(WorkflowCodeApplication.class);
    }

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> filterRegistrationBean = new FilterRegistrationBean<>(
                new ShallowEtagHeaderFilter());
        filterRegistrationBean.addUrlPatterns("/*");
        filterRegistrationBean.setName("etagFilter");
        return filterRegistrationBean;
    }

    @Bean
    protected ApplicationContextHolder applicationContextHolder() {
        return new ApplicationContextHolder();
    }

    public static void main(String[] args) {
        SpringApplication.run(WorkflowCodeApplication.class, args);
    }

}
