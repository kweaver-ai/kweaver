/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.activiti.engine.impl.persistence.entity;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.engine.ActivitiException;
import org.activiti.engine.history.HistoricActivityInstance;
import org.activiti.engine.history.HistoricDetail;
import org.activiti.engine.history.HistoricFormProperty;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.history.HistoricVariableInstance;
import org.activiti.engine.history.HistoricVariableUpdate;
import org.activiti.engine.identity.Group;
import org.activiti.engine.identity.User;
import org.activiti.engine.impl.TablePageQueryImpl;
import org.activiti.engine.impl.db.PersistentObject;
import org.activiti.engine.impl.persistence.AbstractManager;
import org.activiti.engine.management.TableMetaData;
import org.activiti.engine.management.TablePage;
import org.activiti.engine.repository.Deployment;
import org.activiti.engine.repository.Model;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.Execution;
import org.activiti.engine.runtime.Job;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.apache.ibatis.session.RowBounds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * @author Tom Baeyens
 */
public class TableDataManager extends AbstractManager {
  
  private static Logger log = LoggerFactory.getLogger(TableDataManager.class);
  
  public static Map<Class<?>, String> apiTypeToTableNameMap = new HashMap<Class<?>, String>();
  public static Map<Class<? extends PersistentObject>, String> persistentObjectToTableNameMap = new HashMap<Class<? extends PersistentObject>, String>();
  
  static {
    // runtime
    persistentObjectToTableNameMap.put(TaskEntity.class, "t_wf_ru_task");
    persistentObjectToTableNameMap.put(ExecutionEntity.class, "t_wf_ru_execution");
    persistentObjectToTableNameMap.put(IdentityLinkEntity.class, "t_wf_ru_identitylink");
    persistentObjectToTableNameMap.put(VariableInstanceEntity.class, "t_wf_ru_variable");
    
    persistentObjectToTableNameMap.put(JobEntity.class, "t_wf_ru_job");
    persistentObjectToTableNameMap.put(MessageEntity.class, "t_wf_ru_job");
    persistentObjectToTableNameMap.put(TimerEntity.class, "t_wf_ru_job");
    
    persistentObjectToTableNameMap.put(EventSubscriptionEntity.class, "t_wf_ru_event_subscr");
    persistentObjectToTableNameMap.put(CompensateEventSubscriptionEntity.class, "t_wf_ru_event_subscr");    
    persistentObjectToTableNameMap.put(MessageEventSubscriptionEntity.class, "t_wf_ru_event_subscr");    
    persistentObjectToTableNameMap.put(SignalEventSubscriptionEntity.class, "t_wf_ru_event_subscr");
        
    // repository
    persistentObjectToTableNameMap.put(DeploymentEntity.class, "t_wf_re_deployment");
    persistentObjectToTableNameMap.put(ProcessDefinitionEntity.class, "t_wf_re_procdef");
    persistentObjectToTableNameMap.put(ModelEntity.class, "t_wf_re_model");
    
    // history
    persistentObjectToTableNameMap.put(CommentEntity.class, "t_wf_hi_comment");
    
    persistentObjectToTableNameMap.put(HistoricActivityInstanceEntity.class, "t_wf_hi_actinst");
    persistentObjectToTableNameMap.put(AttachmentEntity.class, "t_wf_hi_attachmen");
    persistentObjectToTableNameMap.put(HistoricProcessInstanceEntity.class, "t_wf_hi_procinst");
    persistentObjectToTableNameMap.put(HistoricVariableInstanceEntity.class, "t_wf_hi_varinst");
    persistentObjectToTableNameMap.put(HistoricTaskInstanceEntity.class, "t_wf_hi_taskinst");
    persistentObjectToTableNameMap.put(HistoricIdentityLinkEntity.class, "t_wf_hi_identitylink");
    
    // a couple of stuff goes to the same table
    persistentObjectToTableNameMap.put(HistoricDetailAssignmentEntity.class, "t_wf_hi_detail");
    persistentObjectToTableNameMap.put(HistoricDetailTransitionInstanceEntity.class, "t_wf_hi_detail");
    persistentObjectToTableNameMap.put(HistoricFormPropertyEntity.class, "t_wf_hi_detail");
    persistentObjectToTableNameMap.put(HistoricDetailVariableInstanceUpdateEntity.class, "t_wf_hi_detail");
    persistentObjectToTableNameMap.put(HistoricDetailEntity.class, "t_wf_hi_detail");
    
    
    // Identity module
    persistentObjectToTableNameMap.put(GroupEntity.class, "t_wf_id_group");
    persistentObjectToTableNameMap.put(MembershipEntity.class, "t_wf_id_membership");
    persistentObjectToTableNameMap.put(UserEntity.class, "t_wf_id_user");
    persistentObjectToTableNameMap.put(IdentityInfoEntity.class, "t_wf_id_info");
    
    // general
    persistentObjectToTableNameMap.put(PropertyEntity.class, "t_wf_ge_property");
    persistentObjectToTableNameMap.put(ByteArrayEntity.class, "t_wf_ge_bytearray");
    persistentObjectToTableNameMap.put(ResourceEntity.class, "t_wf_ge_bytearray");
    
    // and now the map for the API types (does not cover all cases)
    apiTypeToTableNameMap.put(Task.class, "t_wf_ru_task");
    apiTypeToTableNameMap.put(Execution.class, "t_wf_ru_execution");
    apiTypeToTableNameMap.put(ProcessInstance.class, "t_wf_ru_execution");
    apiTypeToTableNameMap.put(ProcessDefinition.class, "t_wf_re_procdef");
    apiTypeToTableNameMap.put(Deployment.class, "t_wf_re_deployment");    
    apiTypeToTableNameMap.put(Job.class, "t_wf_ru_job");
    apiTypeToTableNameMap.put(Model.class, "t_wf_re_model");
    
    // history
    apiTypeToTableNameMap.put(HistoricProcessInstance.class, "t_wf_hi_procinst");
    apiTypeToTableNameMap.put(HistoricActivityInstance.class, "t_wf_hi_actinst");
    apiTypeToTableNameMap.put(HistoricDetail.class, "t_wf_hi_detail");
    apiTypeToTableNameMap.put(HistoricVariableUpdate.class, "t_wf_hi_detail");
    apiTypeToTableNameMap.put(HistoricFormProperty.class, "t_wf_hi_detail");
    apiTypeToTableNameMap.put(HistoricTaskInstance.class, "t_wf_hi_taskinst");        
    apiTypeToTableNameMap.put(HistoricVariableInstance.class, "t_wf_hi_varinst");

    // identity
    apiTypeToTableNameMap.put(Group.class, "t_wf_id_group");
    apiTypeToTableNameMap.put(User.class, "t_wf_id_user");

    // TODO: Identity skipped for the moment as no SQL injection is provided here
  }

  public Map<String, Long> getTableCount() {
    Map<String, Long> tableCount = new HashMap<String, Long>();
    try {
      for (String tableName: getTablesPresentInDatabase()) {
        tableCount.put(tableName, getTableCount(tableName));
      }
      log.debug("Number of rows per activiti table: {}", tableCount);
    } catch (Exception e) {
      throw new ActivitiException("couldn't get table counts", e);
    }
    return tableCount;
  }

  public List<String> getTablesPresentInDatabase() {
    List<String> tableNames = new ArrayList<String>();
    Connection connection = null;
    try {
      connection = getDbSqlSession().getSqlSession().getConnection();
      DatabaseMetaData databaseMetaData = connection.getMetaData();
      ResultSet tables = null;
      try {
        log.debug("retrieving activiti tables from jdbc metadata");
        String databaseTablePrefix = getDbSqlSession().getDbSqlSessionFactory().getDatabaseTablePrefix();
        String tableNameFilter = databaseTablePrefix+"T_WF_%";
        if ("postgres".equals(getDbSqlSession().getDbSqlSessionFactory().getDatabaseType())) {
          tableNameFilter = databaseTablePrefix+"t_wf_%";
        }
        if ("oracle".equals(getDbSqlSession().getDbSqlSessionFactory().getDatabaseType())) {
          tableNameFilter = databaseTablePrefix+"T_WF_" + databaseMetaData.getSearchStringEscape() + "_%";
        }
        
        String catalog = null;
        if (getProcessEngineConfiguration().getDatabaseCatalog() != null && getProcessEngineConfiguration().getDatabaseCatalog().length() > 0) {
          catalog = getProcessEngineConfiguration().getDatabaseCatalog();
        }
        
        String schema = null;
        if (getProcessEngineConfiguration().getDatabaseSchema() != null && getProcessEngineConfiguration().getDatabaseSchema().length() > 0) {
          if ("oracle".equals(getDbSqlSession().getDbSqlSessionFactory().getDatabaseType())) {
            schema = getProcessEngineConfiguration().getDatabaseSchema().toUpperCase();
          } else {
            schema = getProcessEngineConfiguration().getDatabaseSchema();
          }
        }
        
        tables = databaseMetaData.getTables(catalog, schema, tableNameFilter, getDbSqlSession().JDBC_METADATA_TABLE_TYPES);
        while (tables.next()) {
          String tableName = tables.getString("TABLE_NAME");
          tableName = tableName.toUpperCase();
          tableNames.add(tableName);
          log.debug("  retrieved activiti table name {}", tableName);
        }
      } finally {
        tables.close();
      }
    } catch (Exception e) {
      throw new ActivitiException("couldn't get activiti table names using metadata: "+e.getMessage(), e); 
    }
    return tableNames;
  }

  protected long getTableCount(String tableName) {
    log.debug("selecting table count for {}", tableName);
    Long count = (Long) getDbSqlSession().selectOne("selectTableCount",
            Collections.singletonMap("tableName", tableName));
    return count;
  }

  @SuppressWarnings("unchecked")
  public TablePage getTablePage(TablePageQueryImpl tablePageQuery, int firstResult, int maxResults) {

    TablePage tablePage = new TablePage();

    @SuppressWarnings("rawtypes")
    List tableData = getDbSqlSession().getSqlSession()
      .selectList("selectTableData", tablePageQuery, new RowBounds(firstResult, maxResults));

    tablePage.setTableName(tablePageQuery.getTableName());
    tablePage.setTotal(getTableCount(tablePageQuery.getTableName()));
    tablePage.setRows((List<Map<String,Object>>)tableData);
    tablePage.setFirstResult(firstResult);
    
    return tablePage;
  }
  
  public String getTableName(Class<?> entityClass, boolean withPrefix) {
    String databaseTablePrefix = getDbSqlSession().getDbSqlSessionFactory().getDatabaseTablePrefix();
    String tableName = null;
    
    if (PersistentObject.class.isAssignableFrom(entityClass)) {
      tableName = persistentObjectToTableNameMap.get(entityClass);
    }
    else {
      tableName = apiTypeToTableNameMap.get(entityClass);
    }
    if (withPrefix) {
      return databaseTablePrefix + tableName;
    }
    else {
      return tableName;
    }
  }

  public TableMetaData getTableMetaData(String tableName) {
    TableMetaData result = new TableMetaData();
    try {
      result.setTableName(tableName);
      DatabaseMetaData metaData = getDbSqlSession()
        .getSqlSession()
        .getConnection()
        .getMetaData();

      if ("postgres".equals(getDbSqlSession().getDbSqlSessionFactory().getDatabaseType())) {
        tableName = tableName.toLowerCase();
      }
      
      String catalog = null;
      if (getProcessEngineConfiguration().getDatabaseCatalog() != null && getProcessEngineConfiguration().getDatabaseCatalog().length() > 0) {
        catalog = getProcessEngineConfiguration().getDatabaseCatalog();
      }
      
      String schema = null;
      if (getProcessEngineConfiguration().getDatabaseSchema() != null && getProcessEngineConfiguration().getDatabaseSchema().length() > 0) {
        if ("oracle".equals(getDbSqlSession().getDbSqlSessionFactory().getDatabaseType())) {
          schema = getProcessEngineConfiguration().getDatabaseSchema().toUpperCase();
        } else {
          schema = getProcessEngineConfiguration().getDatabaseSchema();
        }
      }

      ResultSet resultSet = metaData.getColumns(catalog, schema, tableName, null);
      while(resultSet.next()) {
        boolean wrongSchema = false;
        if (schema != null && schema.length() > 0) {
          for (int i = 0; i < resultSet.getMetaData().getColumnCount(); i++) {
            String columnName = resultSet.getMetaData().getColumnName(i+1);
            if ("TABLE_SCHEM".equalsIgnoreCase(columnName) || "TABLE_SCHEMA".equalsIgnoreCase(columnName)) {
              if (schema.equalsIgnoreCase(resultSet.getString(resultSet.getMetaData().getColumnName(i+1))) == false) {
                wrongSchema = true;
              }
              break;
            }
          }
        }
        
        if (wrongSchema == false) {
          String name = resultSet.getString("COLUMN_NAME").toUpperCase();
          String type = resultSet.getString("TYPE_NAME").toUpperCase();
          result.addColumnMetaData(name, type);
        }
      }
      
    } catch (SQLException e) {
      throw new ActivitiException("Could not retrieve database metadata: " + e.getMessage());
    }

    if(result.getColumnNames().isEmpty()) {
      // According to API, when a table doesn't exist, null should be returned
      result = null;
    }
    return result;
  }

}
