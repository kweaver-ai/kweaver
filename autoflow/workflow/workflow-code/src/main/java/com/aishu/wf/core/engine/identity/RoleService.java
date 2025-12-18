package com.aishu.wf.core.engine.identity;

import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleQueryDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleDTO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface RoleService extends IService<Role> {

	IPage<Role> findDeptAuditorRuleRolePage(IPage<Role> page, String id, String name, String[] names, String[] auditors, String roleCreator, String tenantId,String template);

	/**
	 * 根据角色ID来获取角色对象
	 * @param roleId	角色ID
	 * @return	角色对象
	 */
	Role getRoleById(String roleId);
	/**
	 * 根据用户ID来获取用户绑定的角色列表
	 * @param userId	用户ID
	 * @return	角色对象列表
	 */
	List<Role> findRoleByUserId(String userId);
	/**
	 * 根据角色对象做为查询条件来获取角色列表
	 * @param paramEntity	角色对象
	 * @return	角色对象列表
	 */
	List<Role> findRoleByEntityCriteria(Role paramEntity);

	/**
	 * 根据角色ID集合做为查询条件来获取角色列表
	 * 
	 * @param roleIds
	 * @return
	 */
	List<Role> findRoleByIds(List<String> roleIds);
}
