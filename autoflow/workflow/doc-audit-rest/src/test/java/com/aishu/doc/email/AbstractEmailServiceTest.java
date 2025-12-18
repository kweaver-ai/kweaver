package com.aishu.doc.email;

import com.aishu.doc.DocAuditRestApplication;
import com.aishu.doc.email.common.EmailSubjectEnum;
import com.aishu.doc.monitor.AuditMsgReceiver;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.google.common.collect.Maps;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import java.io.IOException;
import java.util.Map;

@DisplayName("邮件测试用例")
@ActiveProfiles("ut")
@SpringBootTest(classes = DocAuditRestApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class AbstractEmailServiceTest {
    @Autowired
    private AnyShareConfig anyShareConfig;
    @Autowired
    private AnonymousEmailService anonymousEmailService;

    @Test
    @DisplayName("获取邮件标题")
    public void getEmailSubjectTest() {
        // 发送给审核员邮件标题-中文
        anyShareConfig.setLanguage("zh_CN.UTF-8");
        String content1 = anonymousEmailService.getAuditorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_AUDITOR.getZhCN().equals(content1));
        // 发送给审核员邮件标题-繁体
        anyShareConfig.setLanguage("zh_TW.UTF-8");
        String content2 = anonymousEmailService.getAuditorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_AUDITOR.getZhTW().equals(content2));
        // 发送给审核员邮件标题-英文
        anyShareConfig.setLanguage("en_US.UTF-8");
        String content3 = anonymousEmailService.getAuditorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_AUDITOR.getEnUS().equals(content3));

        // 发送给共享者邮件标题-中文
        anyShareConfig.setLanguage("zh_CN.UTF-8");
        String content4 = anonymousEmailService.getCreatorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_CREATOR.getZhCN().equals(content4));
        // 发送给共享者邮件标题-繁体
        anyShareConfig.setLanguage("zh_TW.UTF-8");
        String content5 = anonymousEmailService.getCreatorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_CREATOR.getZhTW().equals(content5));
        // 发送给共享者邮件标题-英文
        anyShareConfig.setLanguage("en_US.UTF-8");
        String content6 = anonymousEmailService.getCreatorEmailSubject(null);
        Assertions.assertTrue(EmailSubjectEnum.SHARE_CREATOR.getEnUS().equals(content6));
    }

//    @Test
//    @DisplayName("获取邮件标题")
//    public void getEmailContentTest() throws IOException, TemplateException {
//        ProcessInstanceModel processInstance = new ProcessInstanceModel();
//        Map<String, Object> fields = Maps.newHashMap();
//        fields.put("type", "anonymous");
//        fields.put("docName", "AnyShare://欧阳丰/文本文档.txt");
//        fields.put("applyUserName", "欧阳丰");
//        fields.put("password", "1234567");
//        fields.put("deadline", "-1");
//        ProcessInputModel model = new ProcessInputModel();
//        model.setFields(fields);
//        processInstance.setProcessInputModel(model);
//        Configuration cfg = new Configuration(Configuration.getVersion());
//        cfg.setClassForTemplateLoading(AuditMsgReceiver.class, "/email-templates/zh_CN");
//        Template template = cfg.getTemplate("share/single-audit.ftl");
//        String content1 = FreeMarkerTemplateUtils.processTemplateIntoString(template, anonymousEmailService.bulidAuditorEmailFields(processInstance));
//        System.out.println(content1);
//    }

}
