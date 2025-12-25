package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.model.EmailInfo;
import com.aishu.wf.core.anyshare.model.Emails;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import org.assertj.core.util.Lists;
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

@DisplayName("用户组织架构管理服务单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class UserManagementServiceTest {

    @InjectMocks
    @Autowired
    private UserManagementService userManagementService;

    @Mock
    private UserManagementOperation userManagementOperation;

    private static String TEST_DEPT_ID = "testdeptid";

    private static List<String > USER_ID_LIST = new ArrayList<>();

    private static List<String > DEPARTMENT_ID_LIST = new ArrayList<>();

    @BeforeAll
    static void init() {
        USER_ID_LIST.add("testuserid1");
        USER_ID_LIST.add("testuserid2");

        DEPARTMENT_ID_LIST.add("testdepartmentid1");
        DEPARTMENT_ID_LIST.add("testdepartmentid2");
    }

    @BeforeEach
    void setUp() throws Exception {
        List<ValueObjectEntity> list = new ArrayList<>();
        ValueObjectEntity value = new ValueObjectEntity();
        value.setId("testid");
        value.setName("测试用户");
        list.add(value);
        Mockito.when(userManagementOperation.getInfoByTypeAndIds("user", USER_ID_LIST)).thenReturn(list);

        User user = new User();
        user.setName("测试用户");
        Mockito.when(userManagementOperation.getUserInfoById("test1")).thenReturn(user);

        List<String> departmentList = new ArrayList<>();
        departmentList.add("testdepartmentid");
        Mockito.when(userManagementOperation.getDepartmentIdsByUserId("test1")).thenReturn(departmentList);

        Emails emails = new Emails();
        Mockito.when(userManagementOperation.getEmails(USER_ID_LIST, DEPARTMENT_ID_LIST)).thenReturn(emails);
    }

    @Test
    @DisplayName("id转名称")
    void names() {
        List<ValueObjectEntity> list = userManagementService.names("user", USER_ID_LIST);
        Assertions.assertTrue(list.size() > 0);
    }

    @Test
    @DisplayName("获取用户信息")
    void getUserInfoById() {
        User user = null;
        try {
            user = userManagementService.getUserInfoById("test1");
        } catch (Exception e) {
            e.printStackTrace();
        }
        Assertions.assertNotNull(user);
    }

    @Test
    @DisplayName("取用户直属部门ID集合")
    void getDepartmentIdsByUserId() {
        List<String> list = null;
        try {
            list = userManagementService.getDepartmentIdsByUserId("test1");
        } catch (Exception e) {
            e.printStackTrace();
        }
        Assertions.assertNotNull(list);
        Assertions.assertTrue(list.size() > 0);
    }

    @Test
    @DisplayName("批量获取用户邮箱")
    void getEmails() {
        List<String> emails = null;
        try {
            emails = userManagementService.getEmails(USER_ID_LIST, DEPARTMENT_ID_LIST);
        } catch (Exception e) {
            e.printStackTrace();
        }
        Assertions.assertNotNull(emails);
    }
}
