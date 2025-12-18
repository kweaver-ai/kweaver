package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.model.Org;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@ActiveProfiles("ut")
@DisplayName("组织服务单元测试")
@ExtendWith(SpringExtension.class)
@Transactional
@MockitoSettings(strictness = Strictness.LENIENT)
@SpringBootTest(classes = WorkflowCodeApplication.class)
class OrgServiceTest {

    @Autowired
    private OrgService orgService;

    private final String orgId = "99460022";
    private final String orgId2 = "99460023";

    @Test
    @DisplayName("通过组织ID获取组织")
    void getOrgById(){
        Org org = orgService.getOrgById(orgId);
        Assertions.assertNotNull(org);
    }

    @Test
    @DisplayName("通过多个组织ID获取组织列表")
    void findOrgByOrgIds(){
        List<String> orgIds = new ArrayList<>();
        orgIds.add(orgId);
        orgIds.add(orgId2);
        List<Org> orgList = orgService.findOrgByOrgIds(orgIds);
        Assertions.assertEquals(orgList.size(),orgIds.size());
    }
}
