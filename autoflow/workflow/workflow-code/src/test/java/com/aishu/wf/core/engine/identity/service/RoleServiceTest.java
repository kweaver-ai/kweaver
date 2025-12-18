package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
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

@DisplayName("角色服务单元测试")
@ActiveProfiles("ut")
@ExtendWith(SpringExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SpringBootTest(classes = WorkflowCodeApplication.class)
@Transactional
class RoleServiceTest {

    @Autowired
    private RoleService roleService;

    private final String userId = "a5e65464-91c8-11eb-aeac-080027383fc3";
    private final String roleId = "DOC_SHARE_ROLE";
    private final String roleId2 = "DOC_SYNC_ROLE";
    private final String roleName = "文档共享审核员";
    private final String appId = "as_workflow";

    @Test
    @DisplayName("通过角色ID查询角色")
    void getRoleById(){
        Role role = roleService.getRoleById(roleId);
        Assertions.assertNotNull(role);
    }

    @Test
    @DisplayName("通过多个角色ID查询多个角色")
    void findRoleByIds(){
        List<String> ids = new ArrayList<>();
        ids.add(roleId);
        ids.add(roleId2);
        List<Role> roles = roleService.findRoleByIds(ids);
        Object[] objects = roles.stream().map(Role::getRoleId).toArray();
        Object[] resRoleIds = {roleId,roleId2};
        Assertions.assertArrayEquals(objects,resRoleIds);
    }

    @Test
    @DisplayName("查询用户绑定角色")
    void findRoleByUserId(){
        List<Role> roles = roleService.findRoleByUserId(userId);
        Assertions.assertTrue(roles.size() > 0);
    }

    @Test
    @DisplayName("根据角色对象做为查询条件来获取角色列表")
    void findRoleByEntityCriteria(){
        Role role = new Role();
        role.setRoleName(roleName);
        List<Role> roles = roleService.findRoleByEntityCriteria(role);
        Object[] objects = roles.stream().map(Role::getRoleId).toArray();
        Object[] resRoleIds = {roleId};
        Assertions.assertArrayEquals(objects,resRoleIds);
    }

    @Test
    @DisplayName("查询角色列表")
    void list(){
        QueryWrapper<Role> wrapper = new QueryWrapper<>();
        wrapper.lambda().eq(Role::getRoleAppId,appId);
        List<Role> roles = roleService.list(wrapper);
        Assertions.assertFalse(roles.isEmpty());
    }

    @Test
    @DisplayName("查询角色")
    void getById(){
        Role role = roleService.getById(roleId);
        Assertions.assertEquals(role.getRoleId(),roleId);
    }

    @Test
    @DisplayName("更新角色")
    void updateById(){
        Role role = roleService.getById(roleId);
        role.setRoleName("测试1");
        roleService.updateById(role);
        role = roleService.getById(roleId);
        Assertions.assertEquals(role.getRoleName(),"测试1");
    }

    @Test
    @DisplayName("保存角色")
    void save(){
        Role role = roleService.getById(roleId);
        roleService.removeById(role.getRoleId());
        roleService.save(role);
        role = roleService.getById(roleId);
        Assertions.assertEquals(role.getRoleId(),roleId);
    }
}
