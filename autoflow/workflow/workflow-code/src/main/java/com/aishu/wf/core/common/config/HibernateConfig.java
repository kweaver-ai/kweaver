package com.aishu.wf.core.common.config;

import java.util.Properties;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
public class HibernateConfig {

    private String dmPlatform = "org.hibernate.dialect.DmDialect";

    @Autowired
    private DataSource dataSource;

    // 数据库类型
    @Value("${server.dbtype}")
    String dbType;

    @Bean
    public LocalSessionFactoryBean sessionFactory() {
        LocalSessionFactoryBean sessionFactory = new LocalSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        sessionFactory.setHibernateProperties(hibernateProperties());
        return sessionFactory;
    }

    private Properties hibernateProperties() {
        Properties properties = new Properties();
        if (!dbType.toLowerCase().startsWith("dm")) {
            return properties;
        }
        properties.put("hibernate.dialect", dmPlatform);
        return properties;
    }
}
