package com.aishu.doc.audit.service;

import com.aishu.doc.DocAuditRestApplication;
import org.junit.jupiter.api.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@DisplayName("文档共享测试用例")
@ActiveProfiles("ut")
@SpringBootTest(classes = DocAuditRestApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class DocShareServiceTest {
//	// 默认测试用户
//	private final static String TEST_USER_ID = "9e4e7ebc-621a-11eb-935f-080027e6c16c";
//
//	@Autowired
//	private DocShareService docShareService;
//
//	@Autowired
//	private DocShareDao docShareDao;
//
//	@InjectMocks
//	@Autowired
//	private DocAuditShareService docAuditShareService;
//
//
//	@Mock
//	private UserService userService;
//
//
//	private static RedisServer server = null;
//
//	@BeforeAll
//	static void startRedis() {
//		server = RedisServer.builder().port(6379)
//				.setting("maxmemory 64m").build();
//		server.start();
//	}
//
//	@AfterAll
//	static void stopRedis() {
//		if(null != server){
//			server.stop();
//		}
//	}
//
//	@BeforeEach
//	public void beforeEach() {
//
//		// Mock测试用户
//		User user = new User();
//		user.setUserName("单元测试用户");
//		user.setUserId(TEST_USER_ID);
//		user.setCsfLevel(6);
//		Mockito.when(userService.getUserById(TEST_USER_ID)).thenReturn(user);
//	}
//
//	@Test
//	@DisplayName("查询共享流程列表")
//	public void shareListTest() {
//		// 增加测试数据
//		DocShareModel docShareModel = DocShareModel.builder().applyId(IdUtil.randomUUID())
//				.docId("gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB")
//				.docName("欧阳丰/文本04.txt").docType("file").docLibType("user_doc_lib").csfLevel(5)
//				.content("申请内容申请内容申请内容申请内容申请内容申请内容").createUserId(TEST_USER_ID)
//				.type("perm").build();
//		JSONObject detail = JSONUtil.createObj();
//		detail.put("allowValue", "read,display");
//		detail.put("expiresAt", "2022-01-01 00:00");
//		detail.put("opType", "create");
//		detail.put("linkUrl", "http://xxxxxxxxx");
//		detail.put("title", "链接标题");
//		detail.put("password", "123456");
//		detail.put("accessLimit", "-1");
//		docShareModel.setDetail(detail.toString());
//		//docAuditShareService.saveDocAudit(docShareModel, null, TEST_USER_ID);
//		DocShareModel Share = docShareDao.selectById(docShareModel.getId());
//		Assertions.assertNotNull(Share);
//
//		/** 正确入参 **/
//		// 查询共享申请列表
//		DocAuditDto docAuditDto = new DocAuditDto();
//		docAuditDto.setPageNumber(1);
//		docAuditDto.setPageSize(10);
//		docAuditDto.setType(WorkflowConstants.TYPE_APPLY);
//		IPage<DocShareModel> applyPage = docShareService.selectShareList(docAuditDto, TEST_USER_ID);
//		int row = docShareService.selectShareCount(WorkflowConstants.TYPE_APPLY, null, TEST_USER_ID);
//		Assertions.assertTrue (applyPage.getTotal() == row);
//		// 查询共享审核列表
//		docAuditDto.setType(WorkflowConstants.TYPE_AUDIT);
//		IPage<DocShareModel> auditPage = docShareService.selectShareList(docAuditDto, TEST_USER_ID);
//		int auditRow = docShareService.selectShareCount(WorkflowConstants.TYPE_AUDIT, null, TEST_USER_ID);
//		Assertions.assertTrue (auditPage.getTotal() == auditRow);
//
//		/** 异常入参 **/
//		docAuditDto.setType(WorkflowConstants.TYPE_APPLY);
//		IPage<DocShareModel> errorPage = docShareService.selectShareList(docAuditDto, IdUtil.randomUUID());
//		Assertions.assertNotNull(errorPage);
//		Assertions.assertTrue (errorPage.getTotal() == 0);
//		docAuditDto.setType(WorkflowConstants.TYPE_AUDIT);
//		IPage<DocShareModel> errorPage2 = docShareService.selectShareList(docAuditDto, IdUtil.randomUUID());
//		Assertions.assertNotNull(errorPage2);
//		Assertions.assertTrue (errorPage2.getTotal() == 0);
//	}


//	@Test
//	@DisplayName("查询共享流程条目")
//	public void shareApplyCountTest() {
//		/** 正确入参 **/
//		docShareService.selectShareCount(WorkflowConstants.TYPE_APPLY, null, userId);
//		docShareService.selectShareCount(WorkflowConstants.TYPE_AUDIT, null, userId);
//
//		/** 异常入参 **/
//		int applyErrorRow = docShareService.selectShareCount(WorkflowConstants.TYPE_APPLY, null, IdUtil.randomUUID());
//		Assertions.assertTrue (applyErrorRow == 0);
//		int auditErrorRow = docShareService.selectShareCount(WorkflowConstants.TYPE_AUDIT, null, IdUtil.randomUUID());
//		Assertions.assertTrue (auditErrorRow == 0);
//	}
//
//	@Test
//	@DisplayName("发起共享同步申请")
//	public void saveTest() throws Exception {
//		/** 正确入参 **/
//		DocShareModel docShareModel = DocShareModel.builder().applyId(IdUtil.randomUUID())
//				.docId("gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB")
//				.docName("欧阳丰\\文本04.txt").docType("file").docLibType("user_doc_lib").csfLevel(5)
//				.content("申请内容申请内容申请内容申请内容申请内容申请内容").createUserId(userId)
//				.type("perm").build();
//		JSONObject detail = JSONUtil.createObj();
//		detail.put("allowValue", "read,display");
//		detail.put("expiresAt", "2022-01-01 00:00");
//		detail.put("opType", "create");
//		docShareModel.setDetail(detail.toString());
//		try {
//			docAuditShareService.saveDocAudit(docShareModel, null, userId);
//			DocShareModel Share = docShareDao.selectById(docShareModel.getId());
//			Assertions.assertNotNull(Share);
//		} catch (Exception e) {
//			// 无审核流程无审核人员
//			System.out.println(e.getMessage());
//		}
//
//		/** 异常入参 **/
//		// 错误的用户ID
//		docShareModel.setId(null);
//		docShareModel.setApplyId(IdUtil.randomUUID());
//		try {
//			docAuditShareService.saveDocAudit(docShareModel, null, IdUtil.randomUUID());
//			Assertions.fail("错误的参数ID保存成功");
//		} catch (Exception e) {
//			// 异常入参报错
//		}
//	}
//
//	@Test
//	@DisplayName("文件同步流程审核")
//	public void auditSaveTest() throws Exception {
//		/** 正确入参 **/
//		DocPageQuery docPageQuery = new DocPageQuery();
//		docPageQuery.setPageNumber(1);
//		docPageQuery.setPageSize(1);
//		docPageQuery.setType(WorkflowConstants.TYPE_AUDIT);
//		docPageQuery.setStatus(WorkflowConstants.AUDIT_STATUS_DSH);
//		IPage<DocShareModel> auditPage = docShareService.selectShareList(docPageQuery, userId);
//		if (auditPage.getTotal() > 0) {
//			DocShareModel docShareModel = auditPage.getRecords().get(0);
//			DocAudit docAudit = DocAudit.builder()
//					.applyId(docShareModel.getApplyId())
//					.taskId(docShareModel.getTaskId())
//					.auditIdea(true)
//					.auditMsg("同意").build();
//			try {
//				docShareService.audit(docAudit, userId);
//			} catch (IllegalArgumentException e) {
//				// 密级不足
//			}
//		}
//
//		/** 异常入参 **/
//		DocAudit docAudit = DocAudit.builder()
//				.applyId("123").taskId("123")
//				.auditIdea(true).auditMsg("同意").build();
//		try {
//			docShareService.audit(docAudit, userId);
//			Assertions.fail("没有抛出异常，测试失败");
//		} catch (IllegalArgumentException e) {}
//	}
//
//	@Test
//	@DisplayName("获取申请流程信息")
//	public void applyinfoTest() throws Exception {
//		/** 正确入参 **/
//		DocPageQuery docPageQuery = new DocPageQuery();
//		docPageQuery.setPageNumber(1);
//		docPageQuery.setPageSize(1);
//		docPageQuery.setType(WorkflowConstants.TYPE_APPLY);
//		IPage<DocShareModel> applyPage = docShareService.selectShareList(docPageQuery, userId);
//		if (applyPage.getTotal() > 0) {
//			DocShareModel docShareModel = applyPage.getRecords().get(0);
//			// 正确参数查询待办信息，返回值不为空
//			DocShareModel applyinfo = docShareService.applyinfo(docShareModel.getApplyId(), userId);
//			Assertions.assertNotNull(applyinfo);
//		}
//
//		/** 异常入参 **/
//		DocShareModel applyinfo2 = null;
//		try {
//			applyinfo2 = docShareService.applyinfo("8acabbe8-b62d-4e04-89c7-852e36fa9b3f", "123");
//			Assertions.fail("没有抛出异常，测试失败");
//		} catch (IllegalArgumentException e) {}
//		Assertions.assertNull(applyinfo2);
//	}
//
//	@Test
//	@DisplayName("获取待审核流程信息")
//	public void pendinginfoTest() throws Exception {
//		/** 正确入参 **/
//		DocPageQuery docPageQuery = new DocPageQuery();
//		docPageQuery.setPageNumber(1);
//		docPageQuery.setPageSize(1);
//		docPageQuery.setType(WorkflowConstants.TYPE_AUDIT);
//		docPageQuery.setStatus(WorkflowConstants.AUDIT_STATUS_DSH);
//		IPage<DocShareModel> auditPage = docShareService.selectShareList(docPageQuery, userId);
//		if (auditPage.getTotal() > 0) {
//			DocShareModel docShareModel = auditPage.getRecords().get(0);
//			// 正确参数查询待办信息，返回值不为空
//			DocShareModel pendinginfo = docShareService.pendinginfo(docShareModel.getTaskId(), userId);
//			Assertions.assertNotNull(pendinginfo);
//		}
//
//		/** 异常入参 **/
//		DocShareModel pendinginfo2 = null;
//		try {
//			pendinginfo2 = docShareService.applyinfo("36e89647-7730-11eb-93c5-00ff64d746a7", "123");
//			Assertions.fail("没有抛出异常，测试失败");
//		} catch (IllegalArgumentException e) {}
//		Assertions.assertNull(pendinginfo2);
//	}
}
