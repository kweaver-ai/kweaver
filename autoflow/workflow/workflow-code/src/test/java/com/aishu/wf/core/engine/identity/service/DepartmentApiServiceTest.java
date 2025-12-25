package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.anyshare.client.DepartmentApi;
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

@DisplayName("爱数部门服务单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class DepartmentApiServiceTest {

    @InjectMocks
    @Autowired
    private DepartmentApiService departmentApiService;

    @Mock
    private DepartmentApi departmentApi;

    private static String TEST_DEPT_ID = "testdeptid";

    @BeforeEach
    void setUp() throws Exception {
        List<String> list = new ArrayList<>();
        list.add("测试部门");
        Mockito.when(departmentApi.getDepartmentIdsByDeptId(TEST_DEPT_ID)).thenReturn(list);

    }

    @Test
    @DisplayName("获取部门ID与父部门ID集合")
    public void getDepartmentIdsByDeptId() {
        List<String> list = null;
        try {
            list = departmentApiService.getDepartmentIdsByDeptId(TEST_DEPT_ID);
        } catch (Exception e) {
            e.printStackTrace();
        }
        Assertions.assertTrue(list.size() > 0);
    }
}
