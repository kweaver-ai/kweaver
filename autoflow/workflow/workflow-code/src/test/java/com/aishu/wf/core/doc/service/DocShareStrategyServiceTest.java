package com.aishu.wf.core.doc.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.doc.dao.DocShareStrategyMapper;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.ShareStrategyDTO;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@DisplayName("文档共享审核策略单元测试")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
@SpringBootTest(classes = WorkflowCodeApplication.class)
class DocShareStrategyServiceTest {

    private final String procDefId = "Process_SHARE001:13:72699b0f-da34-11eb-86d4-38baf87998c1";

    private final String actDefId = "UserTask_0zz6lcw";

    private final String userId = "266c6a42-6131-4d62-8f39-853e7093701c";

    @Autowired
    private DocShareStrategyMapper docShareStrategyMapper;

    @InjectMocks
    @Autowired
    private DocShareStrategyService docShareStrategyService;

    @InjectMocks
    @Autowired
    private UserManagementService userManagementService;


   /* @InjectMocks
    @Autowired
    private UserService userService = new AnyShareUserServiceImpl();*/

    @Mock
    private UserManagementOperation userManagementOperation;

    @Mock
    private  UserService userService;

    @BeforeEach
    void setUp() throws Exception {
        List<DocShareStrategy> shareStrategyList = new ArrayList<>();
        for(int i = 1; i <= 10; i++){
            List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
            DocShareStrategy strategy = new DocShareStrategy();
            this.addAuditor(auditorList, 3, "add");
            strategy.setDocId("test" + i);
            strategy.setDocName("文档库" + i);
            strategy.setDocType("user_doc_lib");
            strategy.setAuditModel("tjsh");
            strategy.setActDefId(actDefId);
            strategy.setActDefName("审核");
            strategy.setAuditorList(auditorList);
            shareStrategyList.add(strategy);
        }
        docShareStrategyService.saveDocAuditStrategy(procDefId, "", userId, shareStrategyList, false,"as_workflow");

        com.aishu.wf.core.engine.identity.model.User userA = new com.aishu.wf.core.engine.identity.model.User();
        userA.setEnabled(true);
        com.aishu.wf.core.engine.identity.model.User userB = new com.aishu.wf.core.engine.identity.model.User();
        userB.setEnabled(true);
        com.aishu.wf.core.engine.identity.model.User userC = new com.aishu.wf.core.engine.identity.model.User();
        userC.setEnabled(true);
        Mockito.when(userService
                .getUserById("auditor_id_add1")).thenReturn(userA);
        Mockito.when(userService
                .getUserById("auditor_id_add2")).thenReturn(userB);
        Mockito.when(userService
                .getUserById("auditor_id_add3")).thenReturn(userC);

        User user1 = new User();
        user1.setName("test1");
        user1.setEnabled(true);
        User user2 = new User();
        user2.setName("test2");
        user2.setEnabled(true);
        User user3 = new User();
        user3.setName("test3");
        user3.setEnabled(true);
        Mockito.when(userManagementOperation
                .getUserInfoById("auditor_id_add1")).thenReturn(user1);
        Mockito.when(userManagementOperation
                .getUserInfoById("auditor_id_add2")).thenReturn(user2);
        Mockito.when(userManagementOperation
                .getUserInfoById("auditor_id_add3")).thenReturn(user3);

    }

    @AfterEach
    void tearDown() {
    }

    @DisplayName(value = "保存审核策略")
    @Test
    void saveDocAuditStrategy() throws Exception {
        List<DocShareStrategy> shareStrategyList = new ArrayList<>();
        List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
        DocShareStrategyAuditor auditor = new DocShareStrategyAuditor();
        auditor.setUserDeptName("");
        auditor.setUserDeptId("");
        auditor.setUserName("审核员001");
        auditor.setUserCode("auditor001");
        auditor.setUserId("auditor_id001");
        auditorList.add(auditor);
        DocShareStrategy strategy = new DocShareStrategy();
        strategy.setDocId("test001");
        strategy.setDocName("文档库001");
        strategy.setDocType("user_doc_lib");
        strategy.setAuditModel("tjsh");
        strategy.setActDefId("UserTask_0zz6lcw");
        strategy.setActDefName("审核");
        strategy.setAuditorList(auditorList);
        shareStrategyList.add(strategy);
        docShareStrategyService.saveDocAuditStrategy(procDefId, "", userId, shareStrategyList, false,"as_workflow");
        ShareStrategyDTO queryDTO = new ShareStrategyDTO();
        queryDTO.setProc_def_id(procDefId);
        queryDTO.setOffset(1);
        queryDTO.setLimit(10);
        queryDTO.setDoc_name("文档库001");
        IPage<DocShareStrategy> page = docShareStrategyService.findDocShareStrategyPage(queryDTO);
        Assertions.assertNotNull(page);
        Assertions.assertTrue(page.getRecords().size() > 0);
    }

    @DisplayName(value = "获取审核策略分页数据")
    @Test
    void findDocShareStrategyPage() throws Exception {
        ShareStrategyDTO queryDTO = new ShareStrategyDTO();
        queryDTO.setProc_def_id(procDefId);
        queryDTO.setOffset(1);
        queryDTO.setLimit(10);
        IPage<DocShareStrategy> page = docShareStrategyService.findDocShareStrategyPage(queryDTO);
        Assertions.assertNotNull(page);
        Assertions.assertTrue(page.getRecords().size() > 0);
    }

    @DisplayName(value = "批量修改审核策略")
    @Test
    void updateDocAuditStrategy() throws Exception {
        List<DocShareStrategy> shareStrategyList = new ArrayList<>();
        for(int i = 1; i <= 3; i++){
            List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
            DocShareStrategy strategy = new DocShareStrategy();
            this.addAuditor(auditorList, 2, "update");
            strategy.setDocId("test" + i);
            strategy.setDocName("文档库" + i);
            strategy.setDocType("user_doc_lib");
            strategy.setAuditModel("tjsh");
            strategy.setActDefId("UserTask_0zz6lcw");
            strategy.setActDefName("审核");
            strategy.setAuditorList(auditorList);
            shareStrategyList.add(strategy);
        }
        docShareStrategyService.updateDocAuditStrategy(shareStrategyList, procDefId, userId);
        IPage<DocShareStrategy> page = this.checkDisplay("", "审核员_update1");
        Assertions.assertNotNull(page);
        Assertions.assertTrue(page.getRecords().size() > 0);
    }

    @DisplayName(value = "根据文档库id删除审核策略")
    @Test
    void deleteDocShareStrategyByDocId() throws Exception {
        docShareStrategyService.deleteDocShareStrategyByDocId("test4");
        IPage<DocShareStrategy> page = this.checkDisplay("文档库4", "");
        Assertions.assertNotNull(page);
        Assertions.assertTrue(page.getRecords().size() == 0);
    }

    /*@DisplayName(value = "根据流程定义ID、环节定义ID、文档ID，查找审核人员列表")
    @Test
    void getDocAuditorList() throws Exception {
        int docCsfLevel = 5;
        String docUserId = "test1";
        List<DocShareStrategyAuditor> list = docShareStrategyService.getDocAuditorList(procDefId, actDefId,
                "test1", "user_doc_lib", docCsfLevel, docUserId);
        Assertions.assertTrue(list.size() > 0);
    }*/

    @DisplayName(value = "根据文档共享审核策略过滤共享审核员")
    @Test
    void filterAuditorByStrategy() throws Exception {
        String docLibId = "test5";
        String docUserId = "test5";
        String docLibType = "user_doc_lib";
        LambdaQueryWrapper<DocShareStrategy> queryWrapper =new LambdaQueryWrapper<DocShareStrategy>()
                .eq(DocShareStrategy::getProcDefId, procDefId).eq(DocShareStrategy::getActDefId, actDefId);
        // 查询出指定流程指定环节下当前文档库配置的共享审核策略
        queryWrapper.eq(DocShareStrategy::getDocId, docUserId);
        List<DocShareStrategy> docShareStrategyList = docShareStrategyMapper.selectList(queryWrapper);
        List<DocShareStrategyAuditor> list = docShareStrategyService.filterAuditorByStrategy(docShareStrategyList,
                docLibId, docLibType);
        Assertions.assertTrue(list.size() > 0);
    }

    private IPage<DocShareStrategy> checkDisplay(String docName, String auditor){
        ShareStrategyDTO queryDTO = new ShareStrategyDTO();
        queryDTO.setProc_def_id(procDefId);
        queryDTO.setOffset(1);
        queryDTO.setLimit(10);
        queryDTO.setDoc_name(docName);
        queryDTO.setAuditor(auditor);
        IPage<DocShareStrategy> page = docShareStrategyService.findDocShareStrategyPage(queryDTO);
        return page;
    }

    void addAuditor(List<DocShareStrategyAuditor> auditorList, int total, String type) {
        for(int i = 1; i <= total; i++){
            DocShareStrategyAuditor auditor = new DocShareStrategyAuditor();
            auditor.setUserDeptName("");
            auditor.setUserDeptId("");
            auditor.setUserName("审核员_" + type + i);
            auditor.setUserCode("auditor_" + type + i);
            auditor.setUserId("auditor_id_" + type + i);
            auditorList.add(auditor);
        }
    }

}