package com.aishu.wf.core.engine.core.identity;

import java.util.ArrayList;
import java.util.List;

import org.activiti.engine.impl.GroupQueryImpl;
import org.activiti.engine.impl.UserQueryImpl;
import org.activiti.engine.impl.persistence.entity.GroupEntity;
import org.activiti.engine.impl.persistence.entity.UserEntity;

import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User;

/**
 * activiti中的user、group与自定义的user、group属性转换类
 * @version:  1.0
 * @author lw 
 */
public class MyUserToActivitiUserUtils {
	public static UserEntity  toActivitiUser(User bUser){
		UserEntity userEntity = new UserEntity();
		if(bUser==null)
			return userEntity;
		userEntity.setId(bUser.getUserId());
		userEntity.setFirstName(bUser.getUserName());
		userEntity.setLastName(bUser.getUserName());
		userEntity.setPassword(bUser.getUserPwd());
		//userEntity.setEmail(bUser.getuser);
		userEntity.setRevision(1);
		return userEntity;
	}
	
	public static User toMyUser(UserQueryImpl userQueryImpl){
		User user = new User();
		user.setUserId(userQueryImpl.getId());
		user.setUserName(userQueryImpl.getFirstName());
		return user;
	}
	
	public static Role toMyRole(GroupQueryImpl groupQueryImpl){
		Role role = new Role();
		role.setRoleId(groupQueryImpl.getId());
		role.setRoleName(groupQueryImpl.getName());
		return role;
	}
	
	
	public static GroupEntity  toActivitiGroup(Role role){
		GroupEntity groupEntity = new GroupEntity();
		if(role==null)
			return groupEntity;
		groupEntity.setRevision(1);
		groupEntity.setType("assignment");
		groupEntity.setId(role.getRoleId());
		groupEntity.setName(role.getRoleName());
		return groupEntity;
	}
	
	
	public static List<org.activiti.engine.identity.Group> toActivitiGroups(List<Role> bGroups){
		List<org.activiti.engine.identity.Group> groupEntitys = new ArrayList<org.activiti.engine.identity.Group>();
		for (Role bGroup : bGroups) {
			GroupEntity groupEntity = toActivitiGroup(bGroup);
			groupEntitys.add(groupEntity);
		}
		return groupEntitys;
	}
	
	public static List<org.activiti.engine.identity.Group> toActivitiGroupsByOrg(List<Org> orgList){
		List<org.activiti.engine.identity.Group> groupEntitys = new ArrayList<org.activiti.engine.identity.Group>();
		for (Org org : orgList) {
			GroupEntity groupEntity = new GroupEntity();
			if(org==null)
				return groupEntitys;
			groupEntity.setRevision(1);
			groupEntity.setType("assignment");
			groupEntity.setId(org.getOrgId());
			groupEntity.setName(org.getOrgName());
			groupEntitys.add(groupEntity);
		}
		return groupEntitys;
	}
	
	public static List<org.activiti.engine.identity.User> toActivitiUsers(List<User> bUsers){
		List<org.activiti.engine.identity.User> userEntitys = new ArrayList<org.activiti.engine.identity.User>();
		for (User bUser : bUsers) {
			UserEntity userEntity = toActivitiUser(bUser);
			userEntitys.add(userEntity);
		}
		return userEntitys;
	}
}