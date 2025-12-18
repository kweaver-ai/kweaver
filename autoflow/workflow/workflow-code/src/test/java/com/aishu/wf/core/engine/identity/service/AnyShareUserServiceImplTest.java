package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.engine.identity.UserService;
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
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@DisplayName("爱数用户服务单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class AnyShareUserServiceImplTest {

    @InjectMocks
    @Autowired
    private UserService userService = new AnyShareUserServiceImpl();

    @Mock
    private UserManagementOperation userManagementOperation;

    private static String USER_ID = "testUser";

    @BeforeEach
    void setUp() throws Exception {
        User userC = new User();
        List<List<Department>> departmentList = new ArrayList<>();
        userC.setParent_deps(departmentList);
        Mockito.when(userManagementOperation.getUserInfoById(USER_ID)).thenReturn(userC);

    }

    @Test
    @DisplayName("根据用户ID获取用户")
    public void getUserById() {
        com.aishu.wf.core.engine.identity.model.User user = userService.getUserById(USER_ID);
        Assertions.assertNotNull(user);
    }
}
