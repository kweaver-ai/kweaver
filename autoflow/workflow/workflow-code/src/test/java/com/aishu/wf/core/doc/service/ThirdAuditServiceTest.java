package com.aishu.wf.core.doc.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.doc.model.ThirdAuditModel;
import com.aishu.wf.core.engine.core.model.dto.ThirdAuditConfigDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@DisplayName("第三方审核单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@ExtendWith(value = {})
@Transactional
class ThirdAuditServiceTest {

    @Autowired
    private ThirdAuditService thirdAuditService;

    /*@BeforeEach
    void setUp() {
        // 初始化数据库里第三方审核配置为未开启
        ThirdAuditConfigDTO config = ThirdAuditConfigDTO.builder().is_open(false).webhook_url("").build();
        thirdAuditService.saveThirdAuditConfig(config);
    }

    @AfterEach
    void tearDown() {
    }

    @DisplayName(value = "测试webhook回调地址连通性")
    @Test
    void testWebhookConfig() {
        String url = "https://www.baidu.com";
        Boolean aBoolean = thirdAuditService.testWebhookConfig(url);
        Assertions.assertTrue(aBoolean);
        String url1 = "https://www.baidu.comfdasjkl;agd";
        Boolean aBoolean1 = thirdAuditService.testWebhookConfig(url1);
        Assertions.assertFalse(aBoolean1);
        String url2 = "";
        Boolean aBoolean2 = thirdAuditService.testWebhookConfig(url2);
        Assertions.assertFalse(aBoolean2);
    }

    @DisplayName(value = "获取第三方审核配置")
    @Test
    void getThirdAuditConfig() {
        ThirdAuditConfigDTO config = thirdAuditService.getThirdAuditConfig();
        Assertions.assertNotNull(config);
        Assertions.assertFalse(config.getIs_open());
        ThirdAuditConfigDTO config1 = ThirdAuditConfigDTO.builder().is_open(true).webhook_url("https://www.baidu.com").build();
        thirdAuditService.saveThirdAuditConfig(config1);
        ThirdAuditConfigDTO config2 = thirdAuditService.getThirdAuditConfig();
        Assertions.assertTrue(config2.getIs_open());
        Assertions.assertEquals("https://www.baidu.com", config2.getWebhook_url());
    }

    @DisplayName(value = "保存第三方审核配置")
    @Test
    void saveThirdAuditConfig() {
        ThirdAuditConfigDTO config = ThirdAuditConfigDTO.builder().is_open(true).webhook_url("https://www.baidu.com").build();
        thirdAuditService.saveThirdAuditConfig(config);
        boolean thirdAuditEnabled = thirdAuditService.isThirdAuditEnabled();
        Assertions.assertTrue(thirdAuditEnabled);
    }

    @DisplayName(value = "判断第三方审核是否启用")
    @Test
    void isThirdAuditEnabled() {
        boolean enabled = thirdAuditService.isThirdAuditEnabled();
        Assertions.assertFalse(enabled);
    }

    @DisplayName(value = "获取第三方审核地址")
    @Test
    void getThirdAuditWebhookUrl() {
        String webhookUrl = thirdAuditService.getThirdAuditWebhookUrl();
        Assertions.assertEquals("", webhookUrl);
        ThirdAuditConfigDTO config = ThirdAuditConfigDTO.builder().is_open(true).webhook_url("https://www.baidu.com").build();
        thirdAuditService.saveThirdAuditConfig(config);
        String webhookUrl1 = thirdAuditService.getThirdAuditWebhookUrl();
        Assertions.assertEquals("https://www.baidu.com", webhookUrl1);
    }

    @DisplayName(value = "提交第三方审核")
    @Test
    void commitThirdAudit() throws Exception {
        ThirdAuditModel thirdAuditModel = ThirdAuditModel.builder().eventtype("").createdate("").creatorName("")
                .csflevel("").applyid("").docid("").docname("").docname("").isdir("").optype("").accessortype("")
                .accessorname("").denyvalue("").allowvalue("").endtime("").inherit("").build();
        Assertions.assertThrows(Exception.class, () -> thirdAuditService.commitThirdAudit(thirdAuditModel));
        ThirdAuditConfigDTO config = ThirdAuditConfigDTO.builder().is_open(true).webhook_url("https://www.baidu.com").build();
        thirdAuditService.saveThirdAuditConfig(config);
        String s = thirdAuditService.commitThirdAudit(thirdAuditModel);
        Assertions.assertNotNull(s);
    }*/
}