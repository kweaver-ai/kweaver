package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.model.DictChild;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.util.Lists;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Slf4j
@DisplayName("字典管理单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@Transactional
class DictServiceTest {

    @Autowired
    private DictService dictService;

    private String testDictCode = "test-dictCode-1";

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
        dictService.removeById("111111");
    }

    @DisplayName("保存或更新字典")
    @Test
    void saveDict() {
        List<DictChild> childList = Lists.newArrayList();
        DictChild child1 = DictChild.builder().dictCode("childCode1").dictName("childName1").sort(1).build();
        DictChild child2 = DictChild.builder().dictCode("childCode2").dictName("childName2").sort(2).build();
        childList.add(child1);
        childList.add(child2);
        Dict build = Dict.builder().id("111111").dictCode(testDictCode).dictName("dictCodeName").dictParentId("1")
                .appId("as_workflow").dictValue(childList).sort(1).status("QY").createDate(new Date()).creatorId("p_liuc")
                .updatorId("p_liuc").updateDate(new Date()).build();
        boolean flag = dictService.saveDict(build);
        Assertions.assertFalse(flag);
        build.setId(null);
        flag = dictService.saveDict(build);
        Assertions.assertTrue(flag);
    }

    @DisplayName("根据编码查询字典数据")
    @Test
    void findDictByCode() {
        String dictCode = testDictCode;
        Dict dict = dictService.findDictByCode(dictCode);
        Assertions.assertNull(dict);
        //
        List<DictChild> childList = Lists.newArrayList();
        DictChild child1 = DictChild.builder().dictCode("childCode1").dictName("childName1").sort(1).build();
        DictChild child2 = DictChild.builder().dictCode("childCode2").dictName("childName2").sort(2).build();
        childList.add(child1);
        childList.add(child2);
        Dict build = Dict.builder().id("").dictCode(testDictCode).dictName("dictCodeName").dictParentId("1")
                .appId("as_workflow").dictValue(childList).sort(1).status("QY").createDate(new Date()).creatorId("p_liuc")
                .updatorId("p_liuc").updateDate(new Date()).build();
        dictService.saveDict(build);
        dict = dictService.findDictByCode(dictCode);
        Assertions.assertNotNull(dict);
    }

}