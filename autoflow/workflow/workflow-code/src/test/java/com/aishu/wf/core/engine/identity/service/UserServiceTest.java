package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("ut")
@DisplayName("用户服务单元测试")
@ExtendWith(SpringExtension.class)
@Transactional
@MockitoSettings(strictness = Strictness.LENIENT)
@SpringBootTest(classes = WorkflowCodeApplication.class)
class UserServiceTest {

    @Autowired
    @Qualifier("UserServiceImpl")
    private UserService userService;

    private final String userId = "cesry1122";
    private final String userCode = "cesry1122";
    private final String orgId = "9943010581";

    @Test
    @DisplayName("根据用户ID获取用户")
    void getUserById(){
        User user = userService.getUserById(userId);
        Assertions.assertEquals(user.getUserId(),userId);
    }

    @Test
    @DisplayName("根据用户code和组织ID获取用户")
    void getUserByCode(){
        User user = userService.getUserByCode(userCode, orgId);
        Assertions.assertEquals(user.getUserId(),userId);
    }


}
