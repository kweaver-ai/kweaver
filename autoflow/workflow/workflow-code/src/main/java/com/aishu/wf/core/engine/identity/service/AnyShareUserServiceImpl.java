package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.dao.User2roleDao;
import com.aishu.wf.core.engine.identity.dao.UserQueryDao;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.util.IdentityException;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 爱数用户服务
 *
 * @author Liuchu
 * @version 1.0
 * @since 2021-3-11 14:36:01
 */
@Slf4j
@Service
@Primary
public class AnyShareUserServiceImpl extends ServiceImpl<UserQueryDao, User> implements UserService {

    @Resource
    private AnyShareConfig anyShareConfig;

    @Autowired
    private User2roleDao user2roleDao;

    private UserManagementOperation userManagementOperation;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }

    @Override
    public User getUserById(String userId) {
        User user;
        try {
            com.aishu.wf.core.anyshare.model.User asUser = userManagementOperation.getUserInfoById(userId);
            user = new User();
            user.setUserId(userId);
            user.setUserName(asUser.getName());
            user.setUserCode(asUser.getAccount());
            user.setEnabled(asUser.getEnabled());
            user.setCsfLevel(asUser.getCsf_level());
            user.setRoleList(asUser.getRoles());
            user.setUserSort(asUser.getPriority());
            List<Department> departments = Lists.newArrayList();
            for (List<Department> parent_dep : asUser.getParent_deps()) {
                departments.addAll(parent_dep);
            }
            user.setDirectDeptInfoList(departments);
            user.setPriority(asUser.getPriority());
            user.setParentDeps(asUser.getParent_deps());
        } catch (Exception e) {
            log.warn("根据用户ID获取用户信息失败！userId：{}", userId, e);
            throw new IdentityException(e);
        }
        return user;
    }

    @Override
    public List<User> getUserList(List<String> userIds) {
        List<User> userList = new ArrayList<>();
        List< com.aishu.wf.core.anyshare.model.User> asUsers = userManagementOperation.batchListUsers(userIds);
        for (com.aishu.wf.core.anyshare.model.User asUser : asUsers) {
            User user = new User();
            user.setUserId(asUser.getId());
            user.setUserName(asUser.getName());
            user.setUserCode(asUser.getAccount());
            user.setEnabled(asUser.getEnabled());
            user.setCsfLevel(asUser.getCsf_level());
            user.setRoleList(asUser.getRoles());
            user.setUserSort(asUser.getPriority());
            List<Department> departments = Lists.newArrayList();
            for (List<Department> parent_dep : asUser.getParent_deps()) {
                departments.addAll(parent_dep);
            }
            user.setDirectDeptInfoList(departments);
            user.setPriority(asUser.getPriority());
            user.setParentDeps(asUser.getParent_deps());
            userList.add(user);
        }
        return userList;
    }

    @Override
    public User getUserByCode(String userCode, String orgId) {
        return null;
    }

    @Override
    public List<User> findUserByOrgIds(List<Org> orgs) {
        return null;
    }

    @Override
    public List<User> findUserByEntitiyCriteria(User paramEntity) {
        return null;
    }

    @Override
    public List<User> findUserIdByRoleCascade(String roleId) {
        QueryWrapper<User2role> wrapper = new QueryWrapper<>();
        wrapper.lambda().eq(User2role::getRoleId,roleId);
        List<User2role> userroleList = user2roleDao.selectList(wrapper);
        List<String> collect = userroleList.stream().map(User2role::getUserId).collect(Collectors.toList());
        List<User> userList = Lists.newArrayList();
        for (String userId : collect) {
            User user = this.getUserById(userId);
            userList.add(user);
        }
        return userList;
    }

    @Override
    public List<User> listUserByGroupId(List<String> groupIds) {
        try{
            List<String> allUsers = userManagementOperation.getGroupUserList(groupIds);
            return this.getUserList(allUsers);
        }catch (Exception e) {
            log.warn("根据用户组ID获取用户列表失败！groupIds：{}", groupIds, e);
            throw new IdentityException(e);
        }
    }
    
    @Override
    public List<User> batchGetUserInfo(List<String> userIds) {
        try{
            List<User> userList = new ArrayList<>();
            List<com.aishu.wf.core.anyshare.model.User> asUsers = userManagementOperation.batchGetUserInfo(userIds);
            for (com.aishu.wf.core.anyshare.model.User asUser : asUsers) {
                User user = new User();
                user.setManager(asUser.getManager());
                userList.add(user);
            }
            return userList;
        }catch (Exception e) {
            log.warn("批量获取用户信息失败！userIds：{}", userIds, e);
            throw new IdentityException(e);
        }
    }
}
