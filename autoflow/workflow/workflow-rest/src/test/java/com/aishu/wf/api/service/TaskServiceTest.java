package com.aishu.wf.api.service;

import org.activiti.engine.TaskService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.aishu.wf.api.WorkflowRestApplication;
import com.aishu.wf.core.common.util.WorkflowConstants;

@DisplayName("流程任务单元测试")
@ExtendWith(SpringExtension.class)
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowRestApplication.class)
public class TaskServiceTest {
	// 测试用户
	private final static String userId = "p_ouyangfeng";
	@Autowired
	TaskService taskService;

	/**
	 * 根据流程任务ID检查该任务是否存在
	 */
	@Test
	@DisplayName("检查当前任务是否有效")
	public void check() {

	}
}
