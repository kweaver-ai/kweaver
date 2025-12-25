package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.dao.RoleQueryDao;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.util.IdentityException;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleServiceImpl extends ServiceImpl<RoleQueryDao,Role> implements RoleService {

	private static final Log logger = LogFactory.getLog(RoleServiceImpl.class);

	@Autowired
	private RoleQueryDao roleQueryDao;

	@Override
	public IPage<Role> findDeptAuditorRuleRolePage(IPage<Role> page, String id, String name, String[] names, String[] auditors, String roleCreator, String tenantId,String template){
		return roleQueryDao.findDeptAuditorRuleRolePage(page, id, name, names, auditors, roleCreator, tenantId,template);
	}

	@Override
	public Role getRoleById(String roleId) {
		return roleQueryDao.selectById(roleId);
	}

	@Override
	public List<Role> findRoleByUserId(String userId) {
		List<Role> roles = null;
		try {
			roles = roleQueryDao.findRoleByUser(userId);
		} catch (Exception e) {
			logger.warn(e);
			throw new IdentityException(e);
		}
		return roles;
	}

	@Override
	public List<Role> findRoleByEntityCriteria(Role paramEntity) {
		QueryWrapper<Role> wrapper = new QueryWrapper<>(paramEntity);
		return roleQueryDao.selectList(wrapper);
	}

	@Override
	public List<Role> findRoleByIds(List<String> roleIds) {
		List<Role> roles=null;
		try{
			roles=roleQueryDao.selectBatchIds(roleIds);
		}catch(Exception e){
			logger.warn(e);
			throw new IdentityException(e);
		}
		return roles;
	}

}
