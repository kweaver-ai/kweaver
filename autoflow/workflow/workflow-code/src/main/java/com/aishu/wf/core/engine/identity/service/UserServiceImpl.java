package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.dao.UserQueryDao;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.User;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Service("UserServiceImpl")
public class UserServiceImpl extends ServiceImpl<UserQueryDao,User> implements UserService {

    private static final Log logger = LogFactory.getLog(UserServiceImpl.class);

    @Autowired
    private UserQueryDao userQueryDao;

    @Override
    public User getUserById(String userId) {
        return userQueryDao.selectById(userId);
    }

    @Override
    public List<User> getUserList(List<String> userIdList) {
        return null;
    }

    @Override
    public User getUserByCode(String userCode, String orgId) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.lambda().eq(User::getUserCode,userCode).eq(User::getOrgId,orgId);
        return userQueryDao.selectOne(wrapper);
    }

    @Override
    public List<User> findUserIdByRoleCascade(String roleId) {
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
    public List<User> listUserByGroupId(List<String> groupIds) {
        return null;
    }

    @Override
    public List<User> batchGetUserInfo(List<String> userIds) {
        return null;
    }

}
