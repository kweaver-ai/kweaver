package com.aishu.wf.core.engine.core.identity;

import java.util.List;

import org.activiti.engine.identity.Group;
import org.activiti.engine.identity.User;
import org.activiti.engine.impl.Page;
import org.activiti.engine.impl.UserQueryImpl;
import org.activiti.engine.impl.persistence.entity.IdentityInfoEntity;
import org.activiti.engine.impl.persistence.entity.UserEntity;
import org.activiti.engine.impl.persistence.entity.UserEntityManager;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Role;
/**
 * 扩展activiti人员的管理类(替换掉activiti中的user接口)
 * @version:  1.0
 * @author lw 
 */
@Service
public class CustomUserManager extends UserEntityManager {
	private static final Log logger = LogFactory
			.getLog(CustomUserManager.class);

	@Autowired
	private UserService userService;
	@Autowired
	private RoleService roleService;
	@Override
	public UserEntity findUserById(final String userCode) {
		UserEntity userEntity = null;
		if (userCode == null)
			return userEntity;
		try {
			com.aishu.wf.core.engine.identity.model.User bUser = userService
					.getUserById(userCode);
			userEntity = MyUserToActivitiUserUtils.toActivitiUser(bUser);
		} catch (Exception e) {
			logger.warn(e);
		}
		return userEntity;
	}

	@Override
	public List<Group> findGroupsByUser(final String userCode) {
		List<Group> groups = null;
		if (userCode == null)
			return groups;
		try {
			List<Role> bRoles = roleService.findRoleByUserId(userCode);
			groups = MyUserToActivitiUserUtils.toActivitiGroups(bRoles);
		} catch (Exception e) {
			logger.warn(e);
		}
		return groups;

	}

	@Override
	public List<User> findUserByQueryCriteria(UserQueryImpl query, Page page) {
		List<User> uList =null;
		if (query == null)
			return uList;
		try {
			List userList = userService.findUserByEntitiyCriteria(MyUserToActivitiUserUtils
					.toMyUser(query));
			uList = MyUserToActivitiUserUtils.toActivitiUsers(userList);
		} catch (Exception e) {
			logger.warn(e);
		}
		return uList;
	}

	@Override
	public IdentityInfoEntity findUserInfoByUserIdAndKey(String userId,
			String key) {
		throw new RuntimeException("not implement method.");
	}

	@Override
	public List<String> findUserInfoKeysByUserIdAndType(String userId,
			String type) {
		throw new RuntimeException("not implement method.");
	}

	@Override
	public long findUserCountByQueryCriteria(UserQueryImpl query) {
		throw new RuntimeException("not implement method.");
	}
}
