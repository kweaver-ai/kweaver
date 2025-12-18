package com.aishu.wf.core.config;

import com.aishu.wf.core.common.util.StringUtils;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

/**
 * @description 数据源配置
 * @author lw
 */
@Slf4j
@Configuration
@ConfigurationProperties(prefix = "spring.datasource")
public class DefaultDatasource {

	private String dmDriver = "dm.jdbc.driver.DmDriver";
	
	private String kdbDriver = "org.postgresql.Driver";

	private String defaultDriver = "org.mariadb.jdbc.Driver";

	private String dsn;

	@Value("${server.dbtype}")
	String dbType;

	@Value("${server.rds-host}")
	String dbHost;

	@Value("${server.rds-port}")
	String dbPort;

	@Value("${server.rds-database}")
	String dbDatabase;

	/**
	 * @description 定义数据源
	 * @author lw
	 * @param env 环境变量
	 * @updateTime 2021/5/13
	 */
	@Bean(name = "datasource")
	public DataSource datasource(Environment env) throws NumberFormatException {
		if (log.isDebugEnabled()) {
			log.debug("spring.datasource.url=" + env.getProperty("spring.datasource.url"));
		}

		if (StringUtils.isIPv6(dbHost)) {
			dbHost = "[" + dbHost + "]";
		}

		HikariConfig hikariConfig = new HikariConfig();
		hikariConfig.setConnectionTestQuery(env.getProperty("spring.datasource.hikari.connection-test-query"));
		hikariConfig.setPoolName("springHikariCP");
		hikariConfig.setUsername(env.getProperty("spring.datasource.username"));
		hikariConfig.setPassword(env.getProperty("spring.datasource.password"));
		String connectionTimeout = env.getProperty("spring.datasource.hikari.connection-timeout");
		if (dbType.toLowerCase().startsWith("dm")) {
            if (dbHost.contains(",")) {
                if (dbHost.contains("[")) {
                    String replaceStr = ":" + dbPort + "]";
                    dbHost = dbHost.replace("]", replaceStr);
                    replaceStr = replaceStr + ",[";
                    dbHost = dbHost.replace(",", replaceStr);
                } else {
                    String replaceStr = ":" + dbPort + ",";
                    dbHost = dbHost.replace(",", replaceStr) + ":" + dbPort;
                }
                dsn = "jdbc:dm://DM?DM=(" + dbHost + ")&loginMode=1&schema=" + dbDatabase
                        + "&compatibleMode=mysql&useUnicode=true&characterEncoding=utf-8&serverTimezone=GMT%2B8";
            } else {
                dsn = "jdbc:dm://" + dbHost + ":" + dbPort + "?schema=" + dbDatabase
                        + "&compatibleMode=mysql&useUnicode=true&characterEncoding=utf-8&serverTimezone=GMT%2B8";
            }
			hikariConfig.setDriverClassName(dmDriver);
		} else if (dbType.toLowerCase().startsWith("kdb")) {
			dsn = "jdbc:postgresql://" + dbHost + ":" + dbPort + "/proton"
			+ "?currentSchema=" + dbDatabase;
			hikariConfig.setDriverClassName(kdbDriver);
		} else {
			dsn = "jdbc:mariadb://" + dbHost + ":" + dbPort + "/" + dbDatabase
					+ "?useUnicode=true&characterEncoding=utf-8&serverTimezone=GMT%2B8";
			hikariConfig.setDriverClassName(defaultDriver);
		}
		hikariConfig.setJdbcUrl(dsn);
		if (connectionTimeout != null) {
			hikariConfig.setConnectionTimeout(Long.parseLong(connectionTimeout));
		}
		String idleTimeout = env.getProperty("spring.datasource.hikari.idle-timeout");
		if (idleTimeout != null) {
			hikariConfig.setIdleTimeout(Long.parseLong(idleTimeout));
		}
		String validationTimeout = env.getProperty("spring.datasource.hikari.validation-timeout");
		if (validationTimeout != null) {
			hikariConfig.setValidationTimeout(Long.parseLong(validationTimeout));
		}
		String maxLifetime = env.getProperty("spring.datasource.hikari.max-lifetime");
		if (maxLifetime != null) {
			hikariConfig.setMaxLifetime(Long.parseLong(maxLifetime));
		}
		String maximumPoolSize = env.getProperty("spring.datasource.hikari.maximum-pool-size");
		if (maximumPoolSize != null) {
			hikariConfig.setMaximumPoolSize(Integer.parseInt(maximumPoolSize));
		}

		return new HikariDataSource(hikariConfig);
	}
}
