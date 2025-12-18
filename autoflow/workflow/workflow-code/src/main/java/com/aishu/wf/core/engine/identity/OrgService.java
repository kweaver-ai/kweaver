package com.aishu.wf.core.engine.identity;

import com.aishu.wf.core.engine.identity.model.Org;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface OrgService extends IService<Org> {
	/**
	 * 根据组织机构ID来获取组织机构
	 * 
	 * @param orgId
	 *            组织机构ID
	 * @return 组织机构对象
	 */
	Org getOrgById(String orgId);

	/**
	 * 根据组织机构ID来获取其所有上级组织机构列表(递归包含所有的父组织机构树)
	 * 
	 * @param parentOrgId
	 * @return 组织机构列表
	 */
	List<Org> findParentOrgTree(String orgId);
	
	/**
	 * 根据组织机构ID和组织级别来获取其所有上级组织机构列表(递归包含所有的父组织机构树)
	 * 
	 * @param parentOrgId
	 * @return 组织机构列表
	 */
	List<Org> findParentOrgTree(String orgId,Integer orgLevel) ;
	/**
	 * 根据组织机构ID来获取其所有上级组织机构列表(递归包含所有的父组织机构树)
	 * @param orgId
	 * @param isIncludeSelf		是否包含orgId参数的组织
	 * @return
	 */
	List<Org> findParentOrgTree(String orgId,boolean isIncludeSelf);
	
	/**
	 * 根据组织机构ID集合做为查询条件来获取组织机构列表
	 * 
	 * @param orgIds
	 * @return
	 */
	List<Org> findOrgByOrgIds(List<String> orgIds);
	/**
	 * 获取组织全路径名称 （XX公司XX部门XX）
	 * @return
	 */
	String getFullPathName(String orgId,String pjStr);

}
