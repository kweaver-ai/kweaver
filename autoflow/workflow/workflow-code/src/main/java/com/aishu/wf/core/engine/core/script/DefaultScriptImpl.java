package com.aishu.wf.core.engine.core.script;

import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("scriptImpl")
public class DefaultScriptImpl implements java.io.Serializable{
	@Autowired
	OrgService orgService;
	@Autowired
	UserService userService;
	@Autowired
	RoleService roleService;

	public boolean isUserInOrg(String userId, String orgId) {
		User user = userService.getUserById(userId);
		if (user == null) {
			return false;
		}
		return user.getOrgId().equals(orgId);
	}

	public boolean isCompanyLeader(String userId) {
		return false;
	}

	public boolean isDeptLeader(String userId) {
		return false;
	}

	/**
	 * 获取当前登录用户
	 */
	public User getCurUser() {
		User user = userService.getUserById("gaof0709");
		return user;
	}

	public List<Role> getCurUserRoles() {
		User user = userService.getUserById("gaof0709");
		return roleService.findRoleByUserId(user.getUserId());
	}

	public Org getCurUserOrg() {
		User user = userService.getUserById("gaof0709");
		return orgService.getOrgById(user.getOrgId());
	}

	public void getCurrentDate() {

	}
}
