package com.aishu.wf.core.engine.core.model;

import org.activiti.engine.EngineServices;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.impl.persistence.entity.VariableInstance;

import java.util.Collection;
import java.util.Map;
import java.util.Set;

/**
 * 
 * 环节流转条件DelegateExecution
 * 
 * @author lw
 */
public class ActivityTranstionDelegateExecution implements DelegateExecution{
	Map<String, Object> activityTanstionMap=null;
	EngineServices engineServices;
	
	public ActivityTranstionDelegateExecution(Map<String, Object> activityTanstionMap,EngineServices engineServices){
		this.activityTanstionMap=activityTanstionMap;
				this.engineServices=engineServices;
		
	}
	@Override
	public Map<String, Object> getVariables() {
		return activityTanstionMap;
	}

	@Override
	public Map<String, Object> getVariablesLocal() {
		return activityTanstionMap;
	}

	@Override
	public Object getVariable(String variableName) {
		return activityTanstionMap.get(variableName);
	}

	
	@Override
	public Set<String> getVariableNames() {
		return activityTanstionMap.keySet();
	}

	@Override
	public Set<String> getVariableNamesLocal() {
		return activityTanstionMap.keySet();
	}

	@Override
	public void setVariable(String variableName, Object value) {
		activityTanstionMap.put(variableName, value);
	}

	@Override
	public Object setVariableLocal(String variableName, Object value) {
		activityTanstionMap.put(variableName, value);
		return null;
	}

	@Override
	public void setVariables(Map<String, ? extends Object> variables) {
		activityTanstionMap=(Map<String, Object>) variables;
	}

	@Override
	public void setVariablesLocal(Map<String, ? extends Object> variables) {
		activityTanstionMap=(Map<String, Object>) variables;
	}

	@Override
	public boolean hasVariables() {
		return activityTanstionMap!=null&&!activityTanstionMap.isEmpty();
	}

	@Override
	public boolean hasVariablesLocal() {
		return activityTanstionMap!=null&&!activityTanstionMap.isEmpty();
	}

	@Override
	public boolean hasVariable(String variableName) {
		return activityTanstionMap.containsKey(variableName);
	}

	@Override
	public boolean hasVariableLocal(String variableName) {
		return activityTanstionMap.containsKey(variableName);
	}

	@Override
	public void createVariableLocal(String variableName, Object value) {
		 activityTanstionMap.put(variableName, value);
	}

	@Override
	public void removeVariable(String variableName) {
		 activityTanstionMap.remove(variableName);
	}

	@Override
	public void removeVariableLocal(String variableName) {
		 activityTanstionMap.remove(variableName);
	}

	@Override
	public void removeVariables(Collection<String> variableNames) {
		for (String variableName : variableNames) {
			removeVariableLocal(variableName);
		}
	}

	@Override
	public void removeVariablesLocal(Collection<String> variableNames) {
		for (String variableName : variableNames) {
			removeVariableLocal(variableName);
		}
	}

	@Override
	public void removeVariables() {
		 activityTanstionMap.clear();
	}

	@Override
	public void removeVariablesLocal() {
		 activityTanstionMap.clear();
	}

	@Override
	public String getId() {
		return null;
	}

	@Override
	public String getProcessInstanceId() {
		return null;
	}

	@Override
	public String getEventName() {
		return null;
	}

	@Override
	public String getBusinessKey() {
		return null;
	}

	@Override
	public String getProcessBusinessKey() {
		return null;
	}

	@Override
	public String getProcessDefinitionId() {
		return null;
	}

	@Override
	public String getParentId() {
		return null;
	}

	@Override
	public String getCurrentActivityId() {
		return null;
	}

	@Override
	public String getCurrentActivityName() {
		return null;
	}

	@Override
	public EngineServices getEngineServices() {
		return engineServices;
	}
	@Override
	public Object getVariableLocal(String variableName) {
		return this.getVariable(variableName);
	}
	@Override
	public <T> T getVariable(String variableName, Class<T> variableClass) {
		return null;
	}
	@Override
	public <T> T getVariableLocal(String variableName, Class<T> variableClass) {
		return null;
	}
	@Override
	public String getTenantId() {
		return null;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstances() {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, Object> getVariables(Collection<String> variableNames) {
		// TODO Auto-generated method stub
		return activityTanstionMap;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstances(Collection<String> variableNames) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, Object> getVariables(Collection<String> variableNames, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return activityTanstionMap;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstances(Collection<String> variableNames,
			boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstancesLocal() {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, Object> getVariablesLocal(Collection<String> variableNames) {
		// TODO Auto-generated method stub
		return activityTanstionMap;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstancesLocal(Collection<String> variableNames) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, Object> getVariablesLocal(Collection<String> variableNames, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Map<String, VariableInstance> getVariableInstancesLocal(Collection<String> variableNames,
			boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public VariableInstance getVariableInstance(String variableName) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Object getVariable(String variableName, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return this.getVariable(variableName);
	}
	@Override
	public VariableInstance getVariableInstance(String variableName, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public VariableInstance getVariableInstanceLocal(String variableName) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public Object getVariableLocal(String variableName, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public VariableInstance getVariableInstanceLocal(String variableName, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public void setVariable(String variableName, Object value, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		
	}
	@Override
	public Object setVariableLocal(String variableName, Object value, boolean fetchAllVariables) {
		// TODO Auto-generated method stub
		return null;
	}
	@Override
	public String getSuperExecutionId() {
		// TODO Auto-generated method stub
		return null;
	}

}
