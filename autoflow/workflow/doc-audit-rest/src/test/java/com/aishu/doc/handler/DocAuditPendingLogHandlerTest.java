package com.aishu.doc.handler;

import cn.hutool.json.JSONUtil;
import com.aishu.doc.DocAuditRestApplication;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * @description 文档审核操作日志
 * @author ouandyang
 */
@DisplayName("文档审核操作日志")
@ActiveProfiles("ut")
@SpringBootTest(classes = DocAuditRestApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class DocAuditPendingLogHandlerTest {

	// 默认测试用户
	private final static String TEST_USER_ID = "9e4e7ebc-621a-11eb-935f-080027e6c16c";

	private final static String REALNAME_APPLY_JSON = "{\"applyType\":\"perm\",\"csfLevel\":5,\"bizType\":\"realname\",\"docId\":\"gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB\",\"docType\":\"file\",\"applyDetail\":\"{\\\"accessorName\\\":\\\"李四\\\",\\\"accessorType\\\":\\\"user\\\",\\\"docLibType\\\":\\\"user_doc_lib\\\",\\\"denyValue\\\":\\\"delete,modify\\\",\\\"allowValue\\\":\\\"display,read\\\",\\\"inherit\\\":true,\\\"opType\\\":\\\"create\\\",\\\"accessorId\\\":\\\"lisi\\\",\\\"expiresAt\\\":\\\"2021-01-01 00:00\\\"}\",\"bizId\":\"d22f7ec5-231f-35f5-a495-9194b66193e4\",\"applyUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docPath\":\"Anyshare://张三/文本.txt\",\"auditIdea\":true}";
	private final static String REALNAME_APPLY_MSG_RESULT = "审核员对文档“Anyshare://张三/文本.txt”进行实名共享审核";
	private final static String REALNAME_APPLY_EX_MSG_RESULT = "文档路径：“Anyshare://张三/文本.txt”；共享者：“单元测试用户”；访问者：“李四”；权限：“显示/读取（拒绝 修改/删除）”；有效期：“2021-01-01 00:00”；审核结果：“通过”";

	private final static String ANONYMOUS_APPLY_JSON = "{\"applyType\":\"anonymous\",\"csfLevel\":5,\"bizType\":\"anonymous\",\"docId\":\"gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB\",\"docType\":\"file\",\"applyDetail\":\"{\\\"accessLimit\\\":-1,\\\"password\\\":\\\"123456\\\",\\\"docLibType\\\":\\\"user_doc_lib\\\",\\\"linkId\\\":\\\"AA990D644BF12E432DB01E8E4AAB5F981D\\\",\\\"allowValue\\\":\\\"display,read\\\",\\\"opType\\\":\\\"create\\\",\\\"title\\\":\\\"文本.docx\\\",\\\"expiresAt\\\":\\\"2021-01-01 00:00\\\"}\",\"bizId\":\"d22f7ec5-231f-35f5-a495-9194b66193e4\",\"applyUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docPath\":\"Anyshare://张三/文本.txt\",\"auditIdea\":true}";
	private final static String ANONYMOUS_APPLY_MSG_RESULT = "审核员对文档“Anyshare://张三/文本.txt”进行匿名共享审核";
	private final static String ANONYMOUS_APPLY_EX_MSG_RESULT = "文档路径：“Anyshare://张三/文本.txt”；共享者：“单元测试用户”；SharedLink地址：“https://xxx/link/AA990D644BF12E432DB01E8E4AAB5F981D”；链接标题：“文本.docx”；权限：“显示/读取”；提取码：“123456”；有效期：“2021-01-01 00:00”；打开次数限制：“无限制”；审核结果：“通过”";

	@InjectMocks
	@Autowired
	private DocAuditPendingLogHandler docAuditPendingLogHandler;

	@Mock
	private UserService userService;

	/**
	 * @description 获取用户信息接口设置返回值
	 * @author ouandyang
	 * @updateTime 2021/6/19
	 */
	@BeforeEach
	public void beforeEach() {
		// Mock测试用户
		User user = new User();
		user.setUserName("单元测试用户");
		user.setUserId(TEST_USER_ID);
		Mockito.when(userService.getUserById(TEST_USER_ID)).thenReturn(user);
	}

//	/**
//	 * @description 构建操作日志描述
//	 * @author ouandyang
//	 * @updateTime 2021/6/19
//	 */
//	@Test
//	@DisplayName("构建操作描述")
//	public void buildMsg() {
//		// 实名
//		Object[] args = new Object[1];
//		args[0] = JSONUtil.toBean(REALNAME_APPLY_JSON, DocAuditApplyModel.class);
//		String result = docAuditPendingLogHandler.buildMsg(args);
//		Assertions.assertTrue(REALNAME_APPLY_MSG_RESULT.equals(result));
//		// 匿名
//		args[0] = JSONUtil.toBean(ANONYMOUS_APPLY_JSON, DocAuditApplyModel.class);
//		String result2 = docAuditPendingLogHandler.buildMsg(args);
//		Assertions.assertTrue(ANONYMOUS_APPLY_MSG_RESULT.equals(result2));
//	}
//
//	/**
//	 * @description 构建操作日志详情
//	 * @author ouandyang
//	 * @updateTime 2021/6/19
//	 */
//	@Test
//	@DisplayName("构建操作详情")
//	public void buildExMsg() {
//		// 实名
//		Object[] args = new Object[1];
//		args[0] = JSONUtil.toBean(REALNAME_APPLY_JSON, DocAuditApplyModel.class);
//		String result = docAuditPendingLogHandler.buildExMsg(args);
//		Assertions.assertTrue(REALNAME_APPLY_EX_MSG_RESULT.equals(result));
//		// 匿名
//		args[0] = JSONUtil.toBean(ANONYMOUS_APPLY_JSON, DocAuditApplyModel.class);
//		String result2 = docAuditPendingLogHandler.buildExMsg(args);
//		Assertions.assertTrue(ANONYMOUS_APPLY_EX_MSG_RESULT.equals(result2));
//	}

}