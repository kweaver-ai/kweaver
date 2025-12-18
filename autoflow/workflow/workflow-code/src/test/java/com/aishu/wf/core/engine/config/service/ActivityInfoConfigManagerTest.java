package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/5/7 19:44
 */
@DisplayName("环节定义配置信息单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class ActivityInfoConfigManagerTest {

    @Autowired
    ActivityInfoConfigManager activityInfoConfigManager;

    private static String PROC_DEF_ID = "Process_20YPUS2H:1:5553c3a0-a331-11eb-8f85-e2d464bea7a3";

    private static String ACTIVITY_DEF_ID = "UserTask_0zz6lcw";

    @Test
    @DisplayName("获取环节配置信息")
    public void getActivityInfoConfig(){
        ActivityInfoConfig activityInfoConfig = activityInfoConfigManager.getActivityInfoConfig(PROC_DEF_ID, ACTIVITY_DEF_ID);
        Assertions.assertNotNull(activityInfoConfig);
    }

    @Test
    @DisplayName("根据流程定义ID删除环节配置信息")
    public void deleteActivityInfoConfigs(){
        boolean result = activityInfoConfigManager.deleteActivityInfoConfigs(PROC_DEF_ID);
        Assertions.assertTrue(result);
    }

    @Test
    @DisplayName("据流程定义ID查询环节配置信息")
    public void findActivityInfoConfigs(){
        List<ActivityInfoConfig> list = activityInfoConfigManager.findActivityInfoConfigs(PROC_DEF_ID);
        Assertions.assertTrue(list.size() > 0);
    }

    @Test
    @DisplayName("根据流程定义ID更新流程定义名称")
    public void updateByProcessDefName(){
        String procDefName = "新的流程定义名称";
       activityInfoConfigManager.updateByProcessDefName(PROC_DEF_ID, procDefName);
    }

    @Test
    @DisplayName("根据流程定义ID和环节定义ID删除环节配置信息")
    public void remove(){
        activityInfoConfigManager.remove(PROC_DEF_ID, ACTIVITY_DEF_ID);
    }
}
