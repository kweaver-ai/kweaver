package com.aishu.wf.core.config;

import com.aishu.wf.core.engine.core.identity.CustomGroupManagerFactory;
import com.aishu.wf.core.engine.core.identity.CustomUserManagerFactory;
import com.aishu.wf.core.engine.core.listener.ExtensionUserTaskParseHandler;
import com.aishu.wf.core.engine.core.listener.TaskAssigneeListener;
import com.aishu.wf.core.engine.core.listener.TaskCreateListener;
import com.aishu.wf.core.engine.core.listener.TaskDeleleListener;
import com.aishu.wf.core.engine.util.cache.MyProcessDefinitionCache;
import org.activiti.engine.*;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.interceptor.SessionFactory;
import org.activiti.engine.impl.jobexecutor.DefaultJobExecutor;
import org.activiti.engine.impl.persistence.StrongUuidGenerator;
import org.activiti.engine.parse.BpmnParseHandler;
import org.activiti.spring.ProcessEngineFactoryBean;
import org.activiti.spring.SpringProcessEngineConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;

/**
 * @description 流程引擎配置
 * @author lw
 */
@Configuration
public class WorkFlowConfig {
    @Autowired
    private DataSource dataSource;
    // @Autowired
    // private DbSqlActuator dbSqlActuator;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private RedisTemplate redisTemplate;
    @Autowired
    private PlatformTransactionManager platformTransactionManager;
    // 引擎名称
    private String processEngineName = "bpm";
    // 开启引擎详细流程历史记录
    private String historyLevel = "audit";
    // 是否开启审计日志，默认不开启
    private boolean EnableDatabaseEventLogging = false;
    // 是否开启job线程，服务任务异步属性需要
    private boolean jobExecutorActivate = false;
    // 开启job轮训时间
    private int jobWaitTimeInMillis = 5000;
    // 流程图字体
    private String activityFontName = "微软雅黑";
    // 数据库类型
    @Value("${server.dbtype}")
    String dbType;

    /**
     * @description 初始化流程引擎配置
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public SpringProcessEngineConfiguration processEngineConfiguration() {
        // dbSqlActuator.dbSchemaInit();
        SpringProcessEngineConfiguration configuration = new SpringProcessEngineConfiguration();
        configuration.setDataSource(dataSource);
        configuration.setTransactionManager(platformTransactionManager);
        configuration.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_FALSE);
        configuration.setJobExecutorActivate(jobExecutorActivate);
        configuration.setHistory(historyLevel);
        configuration.setActivityFontName(activityFontName);
        configuration.setLabelFontName(activityFontName);
        configuration.setIdGenerator(new StrongUuidGenerator());
        configuration.setDbIdentityUsed(false);
        configuration.setEnableDatabaseEventLogging(EnableDatabaseEventLogging);
        DefaultJobExecutor defaultJobExecutor = new DefaultJobExecutor();
        defaultJobExecutor.setWaitTimeInMillis(jobWaitTimeInMillis);
        configuration.setJobExecutor(defaultJobExecutor);
        configuration.setProcessEngineName(processEngineName);
        configuration.setProcessDefinitionCache(processDefinitionCache());
        List<BpmnParseHandler> parseHandlers = new ArrayList<BpmnParseHandler>();
        parseHandlers.add(new ExtensionUserTaskParseHandler());
        configuration.setCustomDefaultBpmnParseHandlers(parseHandlers);
        setCustomSessionFactories(configuration);
        setGlobalTaskCreateListeners(configuration);
        if (dbType.toLowerCase().startsWith("dm")) {
            configuration.setDatabaseType("oracle");
        }
        return configuration;
    }

    /**
     * @description 初始化引擎工厂
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public ProcessEngineFactoryBean processEngine() {
        ProcessEngineFactoryBean processEngineFactoryBean = new ProcessEngineFactoryBean();
        processEngineFactoryBean.setProcessEngineConfiguration(processEngineConfiguration());
        return processEngineFactoryBean;
    }

    /**
     * @description 初始化储存服务组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public RepositoryService repositoryService() throws Exception {
        return processEngine().getObject().getRepositoryService();
    }

    /**
     * @description 初始化运行时服务组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public RuntimeService runtimeService() throws Exception {
        return processEngine().getObject().getRuntimeService();
    }

    /**
     * @description 初始化任务组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public TaskService taskService() throws Exception {
        return processEngine().getObject().getTaskService();
    }

    /**
     * @description 初始化流程历史组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public HistoryService historyService() throws Exception {
        return processEngine().getObject().getHistoryService();
    }

    /**
     * @description 初始化表单组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public FormService formService() throws Exception {
        return processEngine().getObject().getFormService();
    }

    /**
     * @description 初始化流程用户关系组件
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public IdentityService identityService() throws Exception {
        return processEngine().getObject().getIdentityService();
    }

    /**
     * 初始化流程管理组件
     *
     * @description Job任务管理、数据库相关通用操作、执行流程引擎命令
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public ManagementService managementService() throws Exception {
        return processEngine().getObject().getManagementService();
    }

    /**
     * @description 自定义分组管理工厂
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public SessionFactory customGroupManagerFactory() {
        return new CustomGroupManagerFactory();
    }

    /**
     * @description 自定义用户管理工厂
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public SessionFactory customUserManagerFactory() {
        return new CustomUserManagerFactory();
    }

    /**
     * @description 流程自定义缓存
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean
    public MyProcessDefinitionCache processDefinitionCache() {
        MyProcessDefinitionCache myProcessDefinitionCache = new MyProcessDefinitionCache();
        myProcessDefinitionCache.setRedisTemplate(stringRedisTemplate, redisTemplate);
        return myProcessDefinitionCache;
    }

    /**
     * @description 初始化JdbcTemplate
     * @author ouandyang
     * @updateTime 2021/5/13
     */
    @Bean(name = "jdbcTemplate")
    public JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = new JdbcTemplate();
        jdbcTemplate.setDataSource(dataSource);
        return jdbcTemplate;
    }

    /**
     * @description 自定义用户和角色管理配置
     * @author ouandyang
     * @param configuration 流程引擎自定义配置
     * @updateTime 2021/5/13
     */
    private void setCustomSessionFactories(SpringProcessEngineConfiguration configuration) {
        List<SessionFactory> customSessionFactories = new ArrayList<SessionFactory>();
        // 设置自定义用户管理
        customSessionFactories.add(customGroupManagerFactory());
        // 设置自定义角色管理
        customSessionFactories.add(customUserManagerFactory());
        configuration.setCustomSessionFactories(customSessionFactories);
    }

    /**
     * @description 全局监听器配置
     * @author ouandyang
     * @param configuration 流程引擎自定义配置
     * @updateTime 2021/5/13
     */
    private void setGlobalTaskCreateListeners(SpringProcessEngineConfiguration configuration) {
        List<TaskListener> globalTaskCreateListeners = new ArrayList<TaskListener>();
        // 全局设置任务接收人监听器
        globalTaskCreateListeners.add(new TaskAssigneeListener());
        globalTaskCreateListeners.add(new TaskCreateListener());
        configuration.setGlobalTaskCreateListeners(globalTaskCreateListeners);
        globalTaskCreateListeners = new ArrayList<TaskListener>();
        globalTaskCreateListeners.add(new TaskDeleleListener());
        configuration.setGlobalTaskCompleteListeners(globalTaskCreateListeners);
    }

}
