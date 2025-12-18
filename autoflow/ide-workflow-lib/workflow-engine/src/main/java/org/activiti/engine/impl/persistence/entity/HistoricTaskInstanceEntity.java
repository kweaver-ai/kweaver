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

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.engine.ProcessEngineConfiguration;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.db.BulkDeleteable;
import org.activiti.engine.impl.db.PersistentObject;
import org.activiti.engine.task.Comment;

import com.aishu.wf.core.engine.util.WfEngineUtils;


/**
 * @author Tom Baeyens
 * @author Joram Barrez
 */
public class HistoricTaskInstanceEntity extends HistoricScopeInstanceEntity implements HistoricTaskInstance, BulkDeleteable, PersistentObject {

  private static final long serialVersionUID = 1L;

  protected String executionId;
  protected String name;
  protected String localizedName;
  protected String parentTaskId;
  protected String description;
  protected String localizedDescription;
  protected String owner;
  protected String assignee;
  protected String taskDefinitionKey;
  protected String formKey;
  protected int priority;
  protected Date dueDate;
  protected Date claimTime;
  protected String category;
  protected String tenantId = ProcessEngineConfiguration.NO_TENANT_ID;
  protected List<HistoricVariableInstanceEntity> queryVariables;
//by lw
	protected String preTaskId;
	protected String preTaskDefKey;
	protected String preTaskDefName;
	protected String actionType;
	protected String assigneeUserName;
	protected String assigneeOrgId;
	protected String assigneeOrgName;
	protected String topExecutionId;
	protected String bizId,docId,docName,docPath,addition,status;
  //by zjl
  protected String messageId;
  public HistoricTaskInstanceEntity() {
  }

  public HistoricTaskInstanceEntity(TaskEntity task, ExecutionEntity execution) {
    this.id = task.getId();
    if (execution != null) {
      this.processDefinitionId = execution.getProcessDefinitionId();
      this.processInstanceId = execution.getProcessInstanceId();
      this.executionId = execution.getId();
      //by lw
   		WfEngineUtils.buildExtHistoricTaskInstanceEntity(this, task, execution);
       //by hj
       if(null != execution.getVariable("multiLevelDescription")) {
          this.description = (String) execution.getVariable("multiLevelDescription");
       } else {
          this.description = task.getDescription();
       }
    }
    this.name = task.getName();
    this.parentTaskId = task.getParentTaskId();
    this.owner = task.getOwner();
    this.assignee = task.getAssignee();
    this.startTime = Context.getProcessEngineConfiguration().getClock().getCurrentTime();
    this.taskDefinitionKey = task.getTaskDefinitionKey();

    this.setPriority(task.getPriority());
    this.setDueDate(task.getDueDate());
    this.setCategory(task.getCategory());

    // Inherit tenant id (if applicable)
    if (task.getTenantId() != null) {
    	tenantId = task.getTenantId();
    }
  }

  // persistence //////////////////////////////////////////////////////////////

  public Object getPersistentState() {
    Map<String, Object> persistentState = new HashMap<String, Object>();
    persistentState.put("name", name);
    persistentState.put("owner", owner);
    persistentState.put("assignee", assignee);
    persistentState.put("endTime", endTime);
    persistentState.put("durationInMillis", durationInMillis);
    persistentState.put("description", description);
    persistentState.put("deleteReason", deleteReason);
    persistentState.put("taskDefinitionKey", taskDefinitionKey);
    persistentState.put("formKey", formKey);
    persistentState.put("priority", priority);
    persistentState.put("category", category);
    persistentState.put("processDefinitionId", processDefinitionId);
    if(parentTaskId != null) {
      persistentState.put("parentTaskId", parentTaskId);
    }
    if(dueDate != null) {
      persistentState.put("dueDate", dueDate);
    }
    if (claimTime != null) {
      persistentState.put("claimTime", claimTime);
    }
    return persistentState;
  }

  // getters and setters //////////////////////////////////////////////////////
  public String getExecutionId() {
    return executionId;
  }
  public void setExecutionId(String executionId) {
    this.executionId = executionId;
  }
  public String getName() {
    if (localizedName != null && localizedName.length() > 0) {
      return localizedName;
    } else {
      return name;
    }
  }
  public void setName(String name) {
    this.name = name;
  }
  public void setLocalizedName(String name) {
    this.localizedName = name;
  }
  public String getDescription() {
    if (localizedDescription != null && localizedDescription.length() > 0) {
      return localizedDescription;
    } else {
      return description;
    }
  }
  public void setDescription(String description) {
    this.description = description;
  }
  public void setLocalizedDescription(String description) {
    this.localizedDescription = description;
  }
  public String getAssignee() {
    return assignee;
  }
  public void setAssignee(String assignee) {
    this.assignee = assignee;
  }
  public String getTaskDefinitionKey() {
    return taskDefinitionKey;
  }
  public void setTaskDefinitionKey(String taskDefinitionKey) {
    this.taskDefinitionKey = taskDefinitionKey;
  }
  @Override
  public Date getCreateTime() {
  	return getStartTime(); // For backwards compatible reason implemented with createTime and startTime
  }
  public String getFormKey() {
    return formKey;
  }
  public void setFormKey(String formKey) {
    this.formKey = formKey;
  }
  public int getPriority() {
    return priority;
  }
  public void setPriority(int priority) {
    this.priority = priority;
  }
  public Date getDueDate() {
    return dueDate;
  }
  public void setDueDate(Date dueDate) {
    this.dueDate = dueDate;
  }
  public String getCategory() {
		return category;
	}
	public void setCategory(String category) {
		this.category = category;
	}
	public String getOwner() {
    return owner;
  }
  public void setOwner(String owner) {
    this.owner = owner;
  }
  public String getParentTaskId() {
    return parentTaskId;
  }
  public void setParentTaskId(String parentTaskId) {
    this.parentTaskId = parentTaskId;
  }
  public Date getClaimTime() {
    return claimTime;
  }
  public void setClaimTime(Date claimTime) {
    this.claimTime = claimTime;
  }
  public String getTenantId() {
		return tenantId;
	}
	public void setTenantId(String tenantId) {
		this.tenantId = tenantId;
	}
	public Date getTime() {
		return getStartTime();
	}
	public Long getWorkTimeInMillis() {
    if (endTime == null || claimTime == null) {
      return null;
    }
    return endTime.getTime() - claimTime.getTime();
  }
  public Map<String, Object> getTaskLocalVariables() {
    Map<String, Object> variables = new HashMap<String, Object>();
    if (queryVariables != null) {
      for (HistoricVariableInstanceEntity variableInstance: queryVariables) {
        if (variableInstance.getId() != null && variableInstance.getTaskId() != null) {
          variables.put(variableInstance.getName(), variableInstance.getValue());
        }
      }
    }
    return variables;
  }
  public Map<String, Object> getProcessVariables() {
    Map<String, Object> variables = new HashMap<String, Object>();
    if (queryVariables != null) {
      for (HistoricVariableInstanceEntity variableInstance: queryVariables) {
        if (variableInstance.getId() != null && variableInstance.getTaskId() == null) {
          variables.put(variableInstance.getName(), variableInstance.getValue());
        }
      }
    }
    return variables;
  }

  public List<HistoricVariableInstanceEntity> getQueryVariables() {
    if(queryVariables == null && Context.getCommandContext() != null) {
      queryVariables = new HistoricVariableInitializingList();
    }
    return queryVariables;
  }

  public void setQueryVariables(List<HistoricVariableInstanceEntity> queryVariables) {
    this.queryVariables = queryVariables;
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("HistoricTaskInstanceEntity[");
    sb.append("id=").append(id);
    sb.append(", name=").append(name);
    sb.append("]");
    return sb.toString();
  }


	@Override
	public String getProcessDefinitionName() {
		// TODO Auto-generated method stub
		return this.processDefinitionName;
	}

	@Override
	public String getSendUserName() {
		// TODO Auto-generated method stub
		return this.sendUserName;
	}

	public String getAssigneeUserName() {
		return assigneeUserName;
	}

	public void setAssigneeUserName(String assigneeUserName) {
		this.assigneeUserName = assigneeUserName;
	}

	public String getAssigneeOrgId() {
		return assigneeOrgId;
	}

	public void setAssigneeOrgId(String assigneeOrgId) {
		this.assigneeOrgId = assigneeOrgId;
	}

	public String getAssigneeOrgName() {
		return assigneeOrgName;
	}

	public void setAssigneeOrgName(String assigneeOrgName) {
		this.assigneeOrgName = assigneeOrgName;
	}


	public String getTopExecutionId() {
		return topExecutionId;
	}

	public void setTopExecutionId(String topExecutionId) {
		this.topExecutionId = topExecutionId;
	}

	@Override
	public Comment getTaskComment() {
		// TODO Auto-generated method stub
		return null;
	}

	public String getPreTaskId() {
		return preTaskId;
	}

	public void setPreTaskId(String preTaskId) {
		this.preTaskId = preTaskId;
	}

	public String getPreTaskDefKey() {
		return preTaskDefKey;
	}

	public void setPreTaskDefKey(String preTaskDefKey) {
		this.preTaskDefKey = preTaskDefKey;
	}

	public String getPreTaskDefName() {
		return preTaskDefName;
	}

	public void setPreTaskDefName(String preTaskDefName) {
		this.preTaskDefName = preTaskDefName;
	}

	public String getActionType() {
		return actionType;
	}

	public void setActionType(String actionType) {
		this.actionType = actionType;
	}

	public String getBizId() {
		return bizId;
	}

	public void setBizId(String bizId) {
		this.bizId = bizId;
	}



	public String getDocId() {
		return docId;
	}

	public void setDocId(String docId) {
		this.docId = docId;
	}

	public String getDocPath() {
		return docPath;
	}

	public void setDocPath(String docPath) {
		this.docPath = docPath;
	}

  public String getMessageId() {
    return messageId;
  }

  public void setMessageId(String messageId){
    this.messageId = messageId;
  }
  
	public String getAddition() {
		return addition;
	}

	public void setAddition(String addition) {
		this.addition = addition;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getDocName() {
		return docName;
	}

	public void setDocName(String docName) {
		this.docName = docName;
	}

}
