package com.aishu.wf.core.engine.core.identity;

import java.util.ArrayList;
import java.util.List;

import org.activiti.engine.identity.Group;
import org.activiti.engine.impl.GroupQueryImpl;
import org.activiti.engine.impl.Page;
import org.activiti.engine.impl.persistence.entity.GroupEntity;
import org.activiti.engine.impl.persistence.entity.GroupEntityManager;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User;
/**
 * 扩展activiti资源组的管理类(替换掉activiti中的group接口)
 * @version:  1.0
 * @author lw 
 */
@Service
public class CustomGroupManager extends GroupEntityManager {
	private static final Log logger = LogFactory
			.getLog(CustomGroupManager.class);

	@Autowired
	private RoleService roleService;
	@Autowired
	private OrgService orgService;
	@Autowired
	private UserService userService;

/*	@Override
	public GroupEntity findGroupById(final String groupCode) {
		GroupEntity groupEntity = null;
		if (groupCode == null)
			return groupEntity;
		try {
			Role bRole = roleService.getRoleById(groupCode);
			groupEntity = new GroupEntity();
			groupEntity.setRevision(1);
			// activiti有3种预定义的组类型：security-role、assignment、user
			// 如果使用Activiti
			// Explorer，需要security-role才能看到manage页签，需要assignment才能claim任务
			groupEntity.setType("assignment");
			groupEntity.setId(bRole.getRoleId());
			groupEntity.setName(bRole.getRoleName());
			return groupEntity;
		} catch (Exception e) {
			logger.error(e);
		}
		return groupEntity;

	}*/

	@Override
	public List<Group> findGroupsByUser(String userCode,String appId) {
		List<Group> groups = new ArrayList<Group>();
		if (userCode == null)
			return groups;
		try {
			List<Role> bRoleList = roleService.findRoleByUserId(userCode);
			
			if (bRoleList == null || bRoleList.isEmpty())
				return groups;
			
			GroupEntity GroupEntity;
			for (Role bRole : bRoleList) {
				if(StringUtils.isEmpty(appId)||!appId.equals(bRole.getRoleAppId())) {
					continue;
				}
				GroupEntity = new GroupEntity();
				GroupEntity.setRevision(1);
				GroupEntity.setType("assignment");
				GroupEntity.setId(bRole.getRoleId());
				GroupEntity.setName(bRole.getRoleName());
				groups.add(GroupEntity);
			}
		} catch (Exception e) {
			logger.warn(e);
		}
		return groups;
	}

	@Override
	public List<Group> findGroupByQueryCriteria(GroupQueryImpl query, Page page) {
		List<Group> bGroups = null;
		if (query == null)
			return bGroups;
		try {
			Role paramsRole = MyUserToActivitiUserUtils.toMyRole(query);
			List<Role> roles = roleService
					.findRoleByEntityCriteria(paramsRole);
			if (roles == null || roles.isEmpty())
				return new ArrayList<org.activiti.engine.identity.Group>();
			bGroups = MyUserToActivitiUserUtils.toActivitiGroups(roles);
		} catch (Exception e) {
			logger.warn(e);
		}
		return bGroups;
	}

	@Override
	public long findGroupCountByQueryCriteria(GroupQueryImpl query) {
		// MyUserToActivitiUserUtils
		throw new RuntimeException("not implement method.");
	}
	
	@Override
	public List<Group> findOrgsByUser(String userId) {
		User user=userService.getUserById(userId);
		if(user==null){
			return null;
		}
		List<Org> orgList=orgService.findParentOrgTree(user.getOrgId());
		return MyUserToActivitiUserUtils.toActivitiGroupsByOrg(orgList);
	}
}
