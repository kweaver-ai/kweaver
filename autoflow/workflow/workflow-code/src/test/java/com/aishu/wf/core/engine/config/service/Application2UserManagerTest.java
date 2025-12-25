package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ActiveProfiles("ut")
@DisplayName("租户管理员单元测试")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = WorkflowCodeApplication.class)
public class Application2UserManagerTest {

	@Autowired
	Application2UserManager application2UserManager;

	@Test
	public void deleteApplicationUser() {
		application2UserManager.deleteApplicationUser("as_workflow");
	}

	@Test
	// 新增应用与用户关联
	public void addApplicationUser() {
		application2UserManager.addApplicationUser("as_workflow", "p_longw", "p_liuc", "p_ouyangfeng");
	}
}
