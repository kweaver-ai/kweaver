package com.aishu.wf.core.config;

// import com.aishu.wf.core.common.exception.DbActuatorException;
// import com.aishu.wf.core.common.util.RedisLockUtil;
// import com.aishu.wf.core.engine.identity.GePropertyService;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.boot.ApplicationArguments;
// import org.springframework.boot.ApplicationRunner;
// import org.springframework.core.annotation.Order;
// import org.springframework.core.io.ClassPathResource;
// import org.springframework.core.io.Resource;
// import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
// import org.springframework.stereotype.Component;

// import javax.sql.DataSource;
// import java.sql.Connection;
// import java.sql.DatabaseMetaData;
// import java.sql.ResultSet;
// import java.util.ArrayList;
// import java.util.List;

/**
 * @description 数据库初始化执行器
 * @author hanj
 */
// @Slf4j
// @Order(value = 1)
// @Component
// public class DbSqlActuator implements ApplicationRunner {

//     public static final List<String> WORKFLOW_VERSIONS = new ArrayList();
//     private static final String OPERATION_INIT = "init";
//     private static final String OPERATION_UPGRADE = "upgrade";

//     @Autowired
//     private GePropertyService gePropertyService;

//     @Autowired
//     private DataSource dataSource;

//     @Autowired
//     private RedisLockUtil redisLock;

//     @Value("${execute_db_actuator}")
//     private boolean execute_db_actuator;

//     private static long TIMEOUT = 60;

//     static {
//         WORKFLOW_VERSIONS.add("5.22.0.0");
//         WORKFLOW_VERSIONS.add("7.0.2.1.0");
//         WORKFLOW_VERSIONS.add("7.0.2.6.0");
//         WORKFLOW_VERSIONS.add("7.0.3.1.0");
//         WORKFLOW_VERSIONS.add("7.0.3.2.0");
//         WORKFLOW_VERSIONS.add("7.0.3.3.0");
//         WORKFLOW_VERSIONS.add("7.0.3.5.0");
//         WORKFLOW_VERSIONS.add("7.0.3.6.0");
//         WORKFLOW_VERSIONS.add("7.0.3.7.0");
//         WORKFLOW_VERSIONS.add("7.0.3.8.0");
//         WORKFLOW_VERSIONS.add("7.0.4.0.0");
//         WORKFLOW_VERSIONS.add("7.0.4.3.0");
//         WORKFLOW_VERSIONS.add("7.0.4.4.0");
//         WORKFLOW_VERSIONS.add("7.0.4.5.0");
//         WORKFLOW_VERSIONS.add("7.0.4.6.0");
//         WORKFLOW_VERSIONS.add("7.0.4.7.0");
//     }

//     @Override
//     public void run(ApplicationArguments args) throws Exception {
//         // 是否开启数据库执行操作
//         if(!execute_db_actuator){
//             return;
//         }

//         //上锁
//         long time = System.currentTimeMillis();
//         boolean result = redisLock.lock("dbSqlActuator", String.valueOf(time), TIMEOUT);
//         try {
//             if(!result){
//                 System.out.println("已存在数据库升级执行操作！！！");
//                 return;
//             }

//             // 执行数据库升级
//             this.dbSchemaUpgrade();
//         } finally {
//             //释放锁
//             redisLock.unlock("dbSqlActuator", String.valueOf(time));
//         }
//     }

//     /**
//      * @description 数据库初始化
//      * @author hanj
//      * @updateTime 2021/9/7
//      */
//     public void dbSchemaInit() {
//         ClassPathResource schemaSql = new ClassPathResource("/db/init/schema.sql");
//         ClassPathResource dataSql = new ClassPathResource("/db/init/data.sql");
//         // 从7.0.4.7版本开始，初始化数据库执行新的DDL
//         String currentVersion = WORKFLOW_VERSIONS.get(WORKFLOW_VERSIONS.size()-1);
//         if (currentVersion.compareTo("7.0.4.7") >= 0) {
//             schemaSql = new ClassPathResource("/db/init/schema_7047.sql");

//             dataSql = new ClassPathResource("/db/init/data_7047.sql");
//         }
//         if(!(schemaSql.exists()||dataSql.exists())) {
//             return;
//         }
//         try {
//             this.executeSchemaResource(OPERATION_INIT, "初始化", schemaSql, dataSql);
//         } catch (Exception e) {
//             log.error("数据库初始化异常", e);
//         }
//     }

//     /**
//      * @description 数据库版本升级
//      * @author hanj
//      * @updateTime 2021/9/7
//      */
//     public void dbSchemaUpgrade() {
//         int matchingVersionIndex = -1;
//         int index = 0;
//         String dbVersion = gePropertyService.getVersion();
//         while(matchingVersionIndex < 0 && index < WORKFLOW_VERSIONS.size()) {
//             if ((WORKFLOW_VERSIONS.get(index)).matches(dbVersion)) {
//                 matchingVersionIndex = index;
//             } else {
//                 ++index;
//             }
//         }

//         if (matchingVersionIndex < 0) {
//             return;
//         }

//         boolean isUpgradeNeeded = matchingVersionIndex != WORKFLOW_VERSIONS.size() - 1;
//         if (isUpgradeNeeded) {
//             this.startSchemaUpgrade(matchingVersionIndex);
//         }
//     }

//     /**
//      * @description 开始进行数据库版本升级
//      * @author hanj
//      * @param currentDatabaseVersionsIndex 当前数据库版本下标
//      * @updateTime 2021/9/7
//      */
//     protected void startSchemaUpgrade(int currentDatabaseVersionsIndex) {
//         String newDbVersion = WORKFLOW_VERSIONS.get(currentDatabaseVersionsIndex);
//         String indexDbVersion = WORKFLOW_VERSIONS.get(currentDatabaseVersionsIndex);
//         for(int i = currentDatabaseVersionsIndex + 1; i < WORKFLOW_VERSIONS.size(); ++i) {
//             String nextVersion = WORKFLOW_VERSIONS.get(i);
//             indexDbVersion = indexDbVersion.replace(".", "");
//             nextVersion = nextVersion.replace(".", "");
//             ClassPathResource resource = this.getResourceForUpgrade(indexDbVersion, nextVersion);
//             if(resource.exists()){
//                 try {
//                     String upgradeVersion = indexDbVersion + ".to." + nextVersion + ".sql";
//                     this.executeSchemaResource(OPERATION_UPGRADE, upgradeVersion, resource);
//                 } catch (Exception e) {
//                     log.error("数据库版本升级异常", e);
//                     break;
//                 }
//             }
//             indexDbVersion = nextVersion;
//             newDbVersion = WORKFLOW_VERSIONS.get(i);
//         }

//         //更新系统数据版本信息
//         gePropertyService.updateVersion(newDbVersion);
//         gePropertyService.updateHistoryVersion("upgrade(" + WORKFLOW_VERSIONS.get(currentDatabaseVersionsIndex) + "->" + newDbVersion + ")");
//     }

//     /**
//      * @description 获取数据库升级所需的sql更新脚本
//      * @author hanj
//      * @updateTime 2021/9/7
//      */
//     public ClassPathResource getResourceForUpgrade(String dbVersion, String nextVersion) {
//         return new ClassPathResource("/db/upgrade/workflow.mariadb.upgrade." + dbVersion + ".to." + nextVersion + ".sql");
//     }

//     /**
//      * @description 执行sql脚本更新数据库
//      * @author hanj
//      * @param operation 操作
//      * @param scripts 执行脚本
//      * @updateTime 2021/9/7
//      */
//     private void executeSchemaResource(String operation, String upgradeVersion, Resource... scripts) throws Exception{
//         Connection connection = null;
//         ResultSet rs = null;
//         boolean execute = true;
//         String separator = ";;";
//         try {
//             connection = dataSource.getConnection();
//             if(operation.equals(OPERATION_INIT)){
//                 String catalog = connection.getCatalog();
//                 String schema = connection.getCatalog();
//                 DatabaseMetaData dbMetadata = connection.getMetaData();
//                 rs = dbMetadata.getTables(catalog, schema, null, new String[] {"TABLE"});
//                 if (rs.next()) {
//                     execute = false;
//                 }
//                 separator = ";";
//             }
//             if(execute){
//                 ResourceDatabasePopulator resourceDatabasePopulator = new ResourceDatabasePopulator();
//                 resourceDatabasePopulator.setSeparator(separator);
//                 resourceDatabasePopulator.addScripts(scripts);
//                 resourceDatabasePopulator.execute(dataSource);

//                 if (log.isInfoEnabled()) {
//                     log.info("执行sql脚本更新数据库完成，操作类型：" + operation);
//                 }
//                 System.out.println("执行" + upgradeVersion + "脚本更新数据库完成，操作类型：" + operation);
//             }
//         } catch (Exception e){
//             throw e;
//         } finally {
//             try {
//                 if (connection != null) {
//                     connection.close();
//                 }
//                 if (rs != null) {
//                     rs.close();
//                 }
//             } catch (Exception ex) {
//             }
//         }
//     }
// }

