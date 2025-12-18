package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.ApplicationEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

@ActiveProfiles("ut")
@DisplayName("租户管理单元测试")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = WorkflowCodeApplication.class)
public class ApplicationManagerTest {

	@Autowired
	ApplicationManager applicationManager;

	@Test
	@DisplayName("保存租户")
	public void save() {
		ApplicationEntity entity = new ApplicationEntity();
		entity.setAppId("as_workflow-test");
		entity.setAppName("爱数文档流程平台1");
		entity.setAppLinkman("龙文");
		entity.setAppCreatorId("p_longw");
		entity.setAppProvider("爱数");
		entity.setAppType("inner");
		entity.setAppStatus("N");
		applicationManager.save(entity);
	}

	@Test
	@DisplayName("根据租户ID删除租户")
	public void deleteById() {
		applicationManager.removeById("as_workflow-test");
	}

	@Test
	@DisplayName("查询用户绑定租户")
	public void selectByUserId() {
		List<ApplicationEntity> apps = applicationManager.selectByUserId("p_liuc");
		System.out.println(apps);
	}

	@Test
	@DisplayName("获取白名单")
	public void getAllowIpList() {
		List<String> ipList = applicationManager.getAllowIpList();
	}
}
