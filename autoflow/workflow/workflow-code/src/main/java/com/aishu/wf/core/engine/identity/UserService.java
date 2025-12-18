package com.aishu.wf.core.engine.identity;

import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.model.User;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author lw
 * @version 1.0
 * @since
 */

public interface UserService extends IService<User> {
    /**
     * 根据用户ID来获取用户对象
     *
     * @param userId
     * @return 用户对象
     */
    User getUserById(String userId);

    User getUserByCode(String userCode, String orgId);

    List<User> getUserList(List<String> userIds);

    /**
     * 根据用户ID来查询用户的所有直属上级部门ID
     *
     * @param userId
     * @return 直属上级部门ID
     */
//    List<String> findDirectDeptIdsByUserId(String userId) throws Exception;

    //User getUserByCode(String userCode);

    /**
     * 根据角色ID来获取用户列表
     *
     * @param roleId
     * @return 用户对象列表
     */
    List<User> findUserIdByRoleCascade(String roleId);

    /**
     * 根据用户所属组织机构对象列表来获取用户列表
     *
     * @param orgId 组织机构ID
     * @return 用户对象列表
     */
    List<User> findUserByOrgIds(List<Org> orgs);

    /**
     * 根据用户对象做为查询条件来获取用户列表
     *
     * @param paramEntity
     * @return 用户对象列表
     */
    List<User> findUserByEntitiyCriteria(User paramEntity);

    /**
     * 根据组织ID获取用户列表
     *
     * @param groupIds
     * @return 组织对象列表
     */
    List<User> listUserByGroupId(List<String> groupIds);

     /**
     * 批量获取用户信息
     *
     * @param userIds
     * @param fields
     * @return 用户对象列表
     */
    List<User> batchGetUserInfo(List<String> userIds);

    /**
     * 根据用户所属组织机构ID来获取用户列表
     *
     * @param orgId
     *            组织机构ID
     * @return 用户对象列表
     *//*
	List<User> findUserByOrgId(String orgId);
	
	*//**
     * 根据角色ID来获取用户列表
     *
     * @param roleId
     * @return 用户对象列表
     *//*
	List<User> findUserByRoleId(String roleId);
	List<User> findAllUserByRole(String roleId);
	
	*//**
     * 根据角色ID和orgId来获取用户列表
     * @param roleId 角色id
     * @param orgId  部门id
     * @param flag   需要取出的用户数（如果为空则获取全部）
     * @return
     *//*
	List<User> findUserByRole(String roleId,String companyId,String deptId);
	
	*//**
     * 根据角色ID和orgId来获取用户列表
     * @param roleId 角色id
     * @param orgId  部门id
     * @param flag   需要取出的用户数（如果为空则获取全部）
     * @return
     *//*
	List<User> findUserByRoleCascade(String roleId,String orgId,Integer flag);
	

	*//**
     * 根据角色ID和组织机构ID来获取用户列表
     *
     * @param roleId
     *            角色ID
     * @param orgId
     *            组织机构ID
     * @return 用户对象列表
     *//*
	List<User> findUser(String roleId, String orgId);

	*//**
     *
     * @param orgId
     * @return
     *//*
	List<User> findUserTreeByOrgId(String orgId);

	*//**
     * 根据组织机构ID来判断该组织下是否包含该用户
     * @param orgId
     * @return true:是,false:否
     *//*
	boolean hasUser(String orgId);
	*//**
     * 根据userName或者UserCode查询用户对象列表
     * @param userName
     * @param userCode
     * @return
     *//*
	public List<User> getUserByUserNameOrUserCode(String userName,String userCode);
	*//**
     * 根据用户ID和组织机构ID来判断该用户是否包含该组织中
     * @param userId
     * @param orgId
     * @return
     *//*
	boolean isUserInOrg(String userId, String orgId);
	*//**
     * 根据用户ID和角色ID来判断该用户是否包含该角色中
     * @param userId
     * @param roleId
     * @return
     *//*
	boolean isUserInRole(String userId, String roleId);
	
	*//**
     * 根据部门ID和usercode得到user对象
     * @param deptId
     * @param userCode
     * @return
     *//*
	public User getUserByDeptId(String deptId,String userCode);
	
	
	*//**
     * 根据多个userid获取对应手机号码列表
     * @param userId
     * @return
     *//*
	public List<String> findUserMobiles(List<String> userId);
	*//**
     * 根据用户ID集合做为查询条件来获取用户列表
     *
     * @param orgIds
     * @return
     *//*
	public List<User> findUserByIds(List<String> userIds);*/
}
