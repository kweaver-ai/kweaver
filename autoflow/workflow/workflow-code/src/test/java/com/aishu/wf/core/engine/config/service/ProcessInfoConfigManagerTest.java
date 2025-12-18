package com.aishu.wf.core.engine.config.service;

import cn.hutool.core.date.DateUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.dao.ProcessInfoConfigDao;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.baomidou.mybatisplus.core.metadata.IPage;
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
 * @date 2021/5/7 9:45
 */
@DisplayName("流程定义配置信息单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class ProcessInfoConfigManagerTest {

    @Autowired
    ProcessInfoConfigManager processInfoConfigManager;

    @Autowired
    private ProcessInfoConfigDao processInfoConfigDao;

    private static String PROCESS_DEFINITION_ID = "Process_FJ6EP8NI:1:defef6fb-a575-11eb-9e1b-ba08cfd26d9c";

    @Test
    @DisplayName("分页查询2")
    public void findConfigPage(){
        ProcessInfoConfig query = new ProcessInfoConfig();
        ProcessDefinitionDTO queryDTO = new ProcessDefinitionDTO();
        queryDTO.setPageSize(10);
        queryDTO.setPageNumber(1);
        IPage<ProcessInfoConfig> page = processInfoConfigManager.findConfigPage(queryDTO, query);
        Assertions.assertTrue(page.getRecords().size() == 10);
    }

    @Test
    @DisplayName("获取流程定义配置条目")
    public void findConfigCount(){
        ProcessInfoConfig query = new ProcessInfoConfig();
        query.setProcessDefId(PROCESS_DEFINITION_ID);
        long count = processInfoConfigManager.findConfigCount(query);
        Assertions.assertEquals(1,count);
    }

    @Test
    @DisplayName("获取实体dao")
    public void getAllProcessIdForExport(){
        ProcessInfoConfig query = new ProcessInfoConfig();
        List<String> list = processInfoConfigManager.getAllProcessIdForExport(query);
        Assertions.assertTrue(list.size() > 0);
    }

    @Test
    @DisplayName("根据ID获取流程定义配置信息")
    public void getById(){
        ProcessInfoConfig processInfoConfig = processInfoConfigManager.getById(PROCESS_DEFINITION_ID);
        Assertions.assertNotNull(processInfoConfig);
    }

    @Test
    @DisplayName("根据流程局部定义ID可模糊查询配置信息")
    public void getLinkId(){
        ProcessInfoConfig processInfoConfig = processInfoConfigManager.getLinkId(PROCESS_DEFINITION_ID);
        Assertions.assertNotNull(processInfoConfig);
    }

    @Test
    @DisplayName("版本变更恢复还原流程基本配置信息")
    public void recoverProcessInfoConfig(){
        processInfoConfigManager.recoverProcessInfoConfig(PROCESS_DEFINITION_ID);
    }

    @Test
    @DisplayName("获取上级版本的基本配置信息")
    public void getPrevVersionProcessConfig(){
        ProcessInfoConfig processInfoConfig = processInfoConfigManager.getPrevVersionProcessConfig(PROCESS_DEFINITION_ID);
        Assertions.assertNull(processInfoConfig);
    }

    @Test
    @DisplayName("更新流程定义配置信息")
    public void update(){
        ProcessInfoConfig paramsConfig = new ProcessInfoConfig();
        paramsConfig.setRemark(DateUtil.now());
        processInfoConfigManager.updateById(paramsConfig);
    }

    @Test
    @DisplayName("获取流程定义配置和模型分页数据")
    public void findConfigAndModelPage(){
        ProcessInfoConfig query = new ProcessInfoConfig();
        ProcessDefinitionDTO queryDTO = new ProcessDefinitionDTO();
        queryDTO.setPageSize(10);
        queryDTO.setPageNumber(1);
        IPage<List<ProcessInfoConfig>> page = processInfoConfigManager.findConfigAndModelPage(queryDTO, query);
        Assertions.assertTrue(page.getRecords().size() == 10);
    }
}
