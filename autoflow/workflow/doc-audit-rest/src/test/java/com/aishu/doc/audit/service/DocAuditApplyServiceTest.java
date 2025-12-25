package com.aishu.doc.audit.service;

import cn.hutool.json.JSONUtil;
import com.aishu.doc.DocAuditRestApplication;
import com.aishu.doc.audit.common.DocAuditMainService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.dto.DocAuditTaskDTO;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.impl.ProcessDefinitionServiceImpl;
import com.aishu.wf.core.engine.core.service.impl.ProcessModelServiceImpl;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.junit.jupiter.api.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import redis.embedded.RedisServer;

import java.util.List;

/**
 * @description 文档审核申请服务类测试用例
 * @author ouandyang
 */
@Disabled
@DisplayName("文档审核申请服务类测试用例")
@ActiveProfiles("ut")
@SpringBootTest(classes = DocAuditRestApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class DocAuditApplyServiceTest {
    // 默认测试用户
    private final static String TEST_USER_ID = "9e4e7ebc-621a-11eb-935f-080027e6c16c";
    // 实名共享流程定义JSON
    private final static String REALNAME_DEFINITION_JSON = "{\"procDefId\":\"Process_SHARE001:5:1972be24-beda-11eb-b314-ba08cfd26d9c\",\"key\":\"Process_SHARE001\",\"name\":\"实名共享审核工作流\",\"tenantId\":\"as_workflow\",\"flowXml\":\"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPGRlZmluaXRpb25zIHhtbG5zPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9CUE1OLzIwMTAwNTI0L01PREVMIiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczpicG1uZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0JQTU4vMjAxMDA1MjQvREkiIHhtbG5zOm9tZ2RjPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9ERC8yMDEwMDUyNC9EQyIgeG1sbnM6ZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0RELzIwMTAwNTI0L0RJIiB4bWxuczphY3Rpdml0aT0iaHR0cDovL2FjdGl2aXRpLm9yZy9icG1uIiB4bWxuczp4c2Q9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB0YXJnZXROYW1lc3BhY2U9Imh0dHA6Ly93d3cuYWN0aXZpdGkub3JnL3Rlc3QiPgogIDxwcm9jZXNzIGlkPSJQcm9jZXNzX1NIQVJFMDAxIiBuYW1lPSLlrp7lkI3lhbHkuqvlrqHmoLjlt6XkvZzmtYEiIGlzRXhlY3V0YWJsZT0idHJ1ZSI+CiAgICA8c3RhcnRFdmVudCBpZD0ic2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSIgbmFtZT0i5Y+R6LW3Ij4KICAgICAgPG91dGdvaW5nPlNlcXVlbmNlRmxvd18wamZlbmR3PC9vdXRnb2luZz4KICAgIDwvc3RhcnRFdmVudD4KICAgIDx1c2VyVGFzayBpZD0iVXNlclRhc2tfMHp6NmxjdyIgbmFtZT0i5a6h5qC4IiBhY3Rpdml0aTphc3NpZ25lZT0iJHthc3NpZ25lZX0iIGFjdGl2aXRpOmNhbmRpZGF0ZVVzZXJzPSIiPgogICAgICA8ZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgICAgPGFjdGl2aXRpOmV4cGFuZFByb3BlcnR5IGlkPSJkZWFsVHlwZSIgdmFsdWU9InRqc2giIC8+CiAgICAgIDwvZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgIDxpbmNvbWluZz5TZXF1ZW5jZUZsb3dfMGpmZW5kdzwvaW5jb21pbmc+CiAgICAgIDxvdXRnb2luZz5TZXF1ZW5jZUZsb3dfMDhxY3lieTwvb3V0Z29pbmc+CiAgICAgIDxtdWx0aUluc3RhbmNlTG9vcENoYXJhY3RlcmlzdGljcyBpc1NlcXVlbnRpYWw9ImZhbHNlIiBhY3Rpdml0aTpjb2xsZWN0aW9uPSIke2Fzc2lnbmVlTGlzdH0iIGFjdGl2aXRpOmVsZW1lbnRWYXJpYWJsZT0iYXNzaWduZWUiIC8+CiAgICA8L3VzZXJUYXNrPgogICAgPGVuZEV2ZW50IGlkPSJFbmRFdmVudF8xd3FnaXBwIiBuYW1lPSLmtYHnqIvnu5PmnZ8iPgogICAgICA8aW5jb21pbmc+U2VxdWVuY2VGbG93XzA4cWN5Ynk8L2luY29taW5nPgogICAgPC9lbmRFdmVudD4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wamZlbmR3IiBzb3VyY2VSZWY9InNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIHRhcmdldFJlZj0iVXNlclRhc2tfMHp6NmxjdyIgLz4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5IiBzb3VyY2VSZWY9IlVzZXJUYXNrXzB6ejZsY3ciIHRhcmdldFJlZj0iRW5kRXZlbnRfMXdxZ2lwcCIgLz4KICA8L3Byb2Nlc3M+CiAgPGJwbW5kaTpCUE1ORGlhZ3JhbSBpZD0iQlBNTkRpYWdyYW1fZGVtb196ZGh0YTY5NjY2MzMzNjYiPgogICAgPGJwbW5kaTpCUE1OUGxhbmUgaWQ9IkJQTU5QbGFuZV9kZW1vX3pkaHRhNjk2NjYzMzM2NiIgYnBtbkVsZW1lbnQ9IlByb2Nlc3NfU0hBUkUwMDEiPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iQlBNTlNoYXBlX3NpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIGJwbW5FbGVtZW50PSJzaWQtNDY1ODhFQUEtMzhCNy00RkJDLTgwREQtNDZBNUVGRTI2Q0ZBIj4KICAgICAgICA8b21nZGM6Qm91bmRzIHg9Ijk0NSIgeT0iMTE1IiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIC8+CiAgICAgICAgPGJwbW5kaTpCUE1OTGFiZWw+CiAgICAgICAgICA8b21nZGM6Qm91bmRzIHg9Ijk1OSIgeT0iMTMzIiB3aWR0aD0iMjIiIGhlaWdodD0iMTQiIC8+CiAgICAgICAgPC9icG1uZGk6QlBNTkxhYmVsPgogICAgICA8L2JwbW5kaTpCUE1OU2hhcGU+CiAgICAgIDxicG1uZGk6QlBNTlNoYXBlIGlkPSJVc2VyVGFza18weno2bGN3X2RpIiBicG1uRWxlbWVudD0iVXNlclRhc2tfMHp6NmxjdyI+CiAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSI5MjAiIHk9IjI5MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgLz4KICAgICAgPC9icG1uZGk6QlBNTlNoYXBlPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iRW5kRXZlbnRfMXdxZ2lwcF9kaSIgYnBtbkVsZW1lbnQ9IkVuZEV2ZW50XzF3cWdpcHAiPgogICAgICAgIDxvbWdkYzpCb3VuZHMgeD0iOTQ1IiB5PSI0OTIiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgLz4KICAgICAgICA8YnBtbmRpOkJQTU5MYWJlbD4KICAgICAgICAgIDxvbWdkYzpCb3VuZHMgeD0iOTQ4IiB5PSI1MTAiIHdpZHRoPSI0NCIgaGVpZ2h0PSIxNCIgLz4KICAgICAgICA8L2JwbW5kaTpCUE1OTGFiZWw+CiAgICAgIDwvYnBtbmRpOkJQTU5TaGFwZT4KICAgICAgPGJwbW5kaTpCUE1ORWRnZSBpZD0iU2VxdWVuY2VGbG93XzBqZmVuZHdfZGkiIGJwbW5FbGVtZW50PSJTZXF1ZW5jZUZsb3dfMGpmZW5kdyI+CiAgICAgICAgPGRpOndheXBvaW50IHg9Ijk3MCIgeT0iMTY1IiAvPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSI5NzAiIHk9IjI5MCIgLz4KICAgICAgPC9icG1uZGk6QlBNTkVkZ2U+CiAgICAgIDxicG1uZGk6QlBNTkVkZ2UgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5X2RpIiBicG1uRWxlbWVudD0iU2VxdWVuY2VGbG93XzA4cWN5YnkiPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSI5NzAiIHk9IjM3MCIgLz4KICAgICAgICA8ZGk6d2F5cG9pbnQgeD0iOTcwIiB5PSI0OTIiIC8+CiAgICAgIDwvYnBtbmRpOkJQTU5FZGdlPgogICAgPC9icG1uZGk6QlBNTlBsYW5lPgogIDwvYnBtbmRpOkJQTU5EaWFncmFtPgo8L2RlZmluaXRpb25zPgo=\",\"docShareStrategyList\":[],\"autoAuditSwitch\":{\"rename_switch\":\"n\",\"anonymity_switch\":\"n\"},\"type\":\"doc_share\",\"typeName\":\"文档共享审核\",\"description\":null,\"version\":1,\"createUser\":null,\"createUserName\":\"管理员\",\"createTime\":\"2021-03-09T11:48:47.000+00:00\"}";
    // 发起实名共享数据
    private final static String REALNAME_APPLY_JSON = "{\"applyType\":\"perm\",\"csfLevel\":5,\"bizType\":\"realname\",\"docId\":\"gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB\",\"docType\":\"file\",\"applyDetail\":\"{\\\"accessorName\\\":\\\"李四\\\",\\\"accessorType\\\":\\\"user\\\",\\\"docLibType\\\":\\\"user_doc_lib\\\",\\\"denyValue\\\":\\\"delete,modify\\\",\\\"allowValue\\\":\\\"display,read\\\",\\\"inherit\\\":true,\\\"opType\\\":\\\"create\\\",\\\"accessorId\\\":\\\"lisi\\\",\\\"expiresAt\\\":\\\"2021-01-01 00:00\\\"}\",\"bizId\":\"d22f7ec5-231f-35f5-a495-9194b66193e4\",\"applyUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docPath\":\"Anyshare://张三/文本.txt\"}";
    // 审核策略数据
    private final static String SHARE_STRATEGY = "[{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docType\":\"user_doc_lib\",\"actDefName\":\"审核\",\"createUserName\":\"单元测试用户\",\"auditorList\":[{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"auditSort\":1,\"createTime\":1625540019661,\"auditStrategyId\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"userName\":\"审核员1\",\"userId\":\"32de7ebc-621a-11eb-935f-080027e6c111\",\"userCode\":\"auditor01\"},{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"auditSort\":2,\"createTime\":1625540019661,\"auditStrategyId\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"userName\":\"审核员2\",\"userId\":\"32de7ebc-621a-11eb-935f-080027e6c112\",\"userCode\":\"auditor02\"}],\"procDefId\":\"Process_SHARE001:5:1972be24-beda-11eb-b314-ba08cfd26d9c\",\"auditModel\":\"tjsh\",\"docName\":\"单元测试用户\",\"actDefId\":\"UserTask_0zz6lcw\",\"createTime\":1625540019661,\"id\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"procDefName\":\"实名共享审核工作流\"},{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"docType\":\"user_doc_lib\",\"actDefName\":\"审核\",\"createUserName\":\"单元测试用户\",\"auditorList\":[{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"auditSort\":1,\"createTime\":1625540019661,\"auditStrategyId\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"userName\":\"审核员1\",\"userId\":\"32de7ebc-621a-11eb-935f-080027e6c111\",\"userCode\":\"auditor01\"},{\"createUserId\":\"9e4e7ebc-621a-11eb-935f-080027e6c16c\",\"auditSort\":2,\"createTime\":1625540019661,\"auditStrategyId\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"userName\":\"审核员2\",\"userId\":\"32de7ebc-621a-11eb-935f-080027e6c112\",\"userCode\":\"auditor02\"}],\"procDefId\":\"Process_SHARE001:5:1972be24-beda-11eb-b314-ba08cfd26d9c\",\"auditModel\":\"tjsh\",\"docName\":\"单元测试用户\",\"actDefId\":\"UserTask_0zz6lcw\",\"createTime\":1625540019661,\"id\":\"859a474f-54eb-4213-a9d8-305e1f4a257e\",\"procDefName\":\"实名共享审核工作流\"}]";

    // 流程定义ID
    private static String PROCESS_DEFINITION_ID = "";

    private static RedisServer server = null;

    @Autowired
    private DocAuditApplyService docAuditApplyService;

    @Autowired
    private DocAuditMainService docAuditMainService;

    @Autowired
    DocShareStrategyService docShareStrategyService;

    @InjectMocks
    @Autowired
    private ProcessDefinitionService processDefinitionService = new ProcessDefinitionServiceImpl();

    @InjectMocks
    @Autowired
    private ProcessModelServiceImpl processModelService;

    @InjectMocks
    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @Mock
	private UserService userService;

	@BeforeAll
	static void startRedis() {
		server = RedisServer.builder().port(6379)
				.setting("maxmemory 64m").build();
		server.start();
	}

    @AfterAll
    static void stopRedis() {
        if(null != server){
            server.stop();
        }
    }

	/**
	 * @description 增加测试数据
	 * @author ouandyang
	 * @updateTime 2021/6/19
	 */
    @BeforeEach
	public void beforeEach() {
        // 部署实名共享流程
        ProcDefModel procDefModel = JSONUtil.toBean(REALNAME_DEFINITION_JSON, ProcDefModel.class);
        ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
        this.PROCESS_DEFINITION_ID = processDefinitionService.deployProcess(processDeploymentDTO, "new", TEST_USER_ID);
        // 新增审核策略
        String procDefId = "Process_SHARE001:5:1972be24-beda-11eb-b314-ba08cfd26d9c";
        String procDefName = "实名共享审核工作流";
        List<DocShareStrategy> shareStrategyList = JSONUtil.toList(JSONUtil.parseArray(SHARE_STRATEGY),
                DocShareStrategy.class);
        docShareStrategyService.saveDocAuditStrategy(procDefId, procDefName, TEST_USER_ID, shareStrategyList, false,"as_wrokflow");
        // Mock测试用户
		User user = new User();
		user.setUserName("单元测试用户");
		user.setUserId(TEST_USER_ID);
		user.setCsfLevel(6);
		Mockito.when(userService.getUserById(TEST_USER_ID)).thenReturn(user);
        // 发起文档审核申请
        DocAuditApplyModel docAuditApplyModel = JSONUtil.toBean(REALNAME_APPLY_JSON, DocAuditApplyModel.class);
        docAuditMainService.startDocAudit(docAuditApplyModel);
	}

	@Test
	@DisplayName("查询我的待办列表")
	public void selectTodoApplyListTest() {
        // 正确入参
        DocAuditTaskDTO docAuditDto = new DocAuditTaskDTO();
        docAuditDto.setDoc_name("文本");
        docAuditDto.setType(DocConstants.BIZ_TYPE_REALNAME_SHARE);
        docAuditDto.setOffset(0);
        docAuditDto.setLimit(1);
//        IPage<DocAuditApplyModel> page = docAuditApplyService.selectTodoApplyList(docAuditDto, TEST_USER_ID);
//        Assertins.assertNotNull(page);
//        Assertions.assertTrue(page.getTotal() == 1);
//        Assertions.assertTrue(page.getRecords().size() == 1);
//
//        // 异常入参
//        IPage<DocAuditApplyModel> page2 = docAuditApplyService.selectTodoApplyList(docAuditDto, IdUtil.randomUUID());
//        Assertions.assertNotNull(page2);
//        Assertions.assertTrue(page2.getTotal() == 0);
//        Assertions.assertTrue(page2.getRecords().size() == 0);
	}

}
