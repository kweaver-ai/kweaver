package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

@ActiveProfiles("ut")
@DisplayName("流程规则单元测试")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = WorkflowCodeApplication.class)
public class ActivityRuleManagerTest {
		@Autowired
		ActivityRuleManager activityRuleManager;
		
		@Test
		public void save() {
			ActivityRule entity=new ActivityRule();
			entity.setProcDefId("test1:xx1");
			entity.setRuleName("测试脚本");
			entity.setRuleScript("{text}");
			entity.setRuleType("R");
			entity.setSourceActId("a1");
			entity.setTargetActId("b1");
			activityRuleManager.save(entity);
		}

		@Test
		public void findActivityRules() {
			List<ActivityRule> rules=activityRuleManager.findActivityRules("test1:xx1", "R");
			System.out.println("findActivityRules:"+rules);
		}
		
		@Test
		public void getActivityRule(){
			ActivityRule rule=activityRuleManager.getActivityRule("test1:xx1","a1","b1","R");
			System.out.println("getActivityRule:"+rule);
		}
		
		@Test
		public void deleteAllActivityRule(){
			activityRuleManager.deleteAllActivityRule("test1:xx1");
		}
}
