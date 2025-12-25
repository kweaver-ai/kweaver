package com.aishu.wf.api.config;

// import com.aishu.wf.core.common.util.ApplicationContextHolder;
// import com.aishu.wf.core.config.DbSqlActuator;
// import com.aishu.wf.core.engine.identity.GePropertyService;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.ApplicationArguments;
// import org.springframework.boot.ApplicationRunner;
// import org.springframework.context.ApplicationContext;
// import org.springframework.context.ConfigurableApplicationContext;
// import org.springframework.core.annotation.Order;
// import org.springframework.stereotype.Component;

/**
 * @description 校验版本一致性
 * @author hanj
 */
// @Slf4j
// @Order(value = 2)
// @Component
// public class CheckDbVersion implements ApplicationRunner {

//     @Autowired
//     private GePropertyService gePropertyService;

//     @Override
//     public void run(ApplicationArguments args) {
//         String workflowVersion = DbSqlActuator.WORKFLOW_VERSIONS.get(DbSqlActuator.WORKFLOW_VERSIONS.size() - 1);
//         String dbVersion = gePropertyService.getVersion();
//         if (workflowVersion.matches(dbVersion)) {
//             return;
//         }
//         log.error("当前安装的workflow版本与数据库记录版本不一致！！！");
//         closeApplication(ApplicationContextHolder.getApplicationContext());
//     }

//     private static void closeApplication(ApplicationContext context) {
//         if (context instanceof ConfigurableApplicationContext) {
//             ConfigurableApplicationContext closable = (ConfigurableApplicationContext) context;
//             closable.close();
//         }
//     }

// }
