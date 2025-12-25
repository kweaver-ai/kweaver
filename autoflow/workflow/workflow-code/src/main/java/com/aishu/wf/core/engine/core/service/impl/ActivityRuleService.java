package com.aishu.wf.core.engine.core.service.impl;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.core.script.GroovyScriptEngine;

@Service
public class ActivityRuleService {

	@Autowired
	GroovyScriptEngine groovyScriptEngine;

	@Autowired
	ActivityRuleManager activityRuleManager;

	public boolean isFilterActivityByRule(String procDefId,String sourceActId,String targetActId,Map vars,String ruleType){
		ActivityRule activityRule=activityRuleManager.getActivityRule(procDefId,sourceActId,targetActId,ruleType);
		if(activityRule==null){
			return false;
		}
		String ruleScript=activityRule.getRuleScript();
		return groovyScriptEngine.executeBoolean(ruleScript, vars);
	}

	public Object validateActivityRule(String procDefId,String sourceActId,String targetActId,Map vars,String ruleType){
		ActivityRule activityRule=activityRuleManager.getActivityRule(procDefId,sourceActId,targetActId,ruleType);
		String ruleScript=activityRule.getRuleScript();
		return groovyScriptEngine.executeObject(ruleScript, vars);
	}
	
	public Object validateActivityRule(String ruleScript){
		if(StringUtils.isEmpty(ruleScript)){
			return null;
		}
		return groovyScriptEngine.executeObject(ruleScript, null);
	}
}
