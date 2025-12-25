package com.aishu.wf.core.engine.core.service.impl;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@ExtendWith(value = {})
@DisplayName("流程实例服务单元测试类")
@Transactional
class ProcessInstanceServiceImplTest {

    @Autowired
    private ProcessInstanceService processInstanceService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }

    /*@DisplayName("给流程实例增加用户待办任务")
    @Test
    void addTaskForInstance() {
        *//*String userId = "ca1e6aa4-8ecd-11eb-a77c-080027383fc3";
        String procInstId = "0507bb8b-a3db-11eb-a72c-e2d464bea7a3";
        Boolean aBoolean = processInstanceService.addTaskForInstance(userId, procInstId);
        Assertions.assertTrue(aBoolean);*//*
    }

    @DisplayName("删除用户的所有待办任务")
    @Test
    void deleteAllTaskByUserId() {
        String userId = "";
        processInstanceService.deleteAllTaskByUserId(userId);
    }

    @DisplayName("删除流程实例中的用户待办任务")
    @Test
    void deleteTaskForInstance() {
        String userId = "";
        String procInstId = "";
        processInstanceService.deleteTaskForInstance(userId, procInstId);
    }*/

}