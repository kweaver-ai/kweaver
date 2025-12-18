/*
 * 该Dao主要负责该类同名表或其他与之关联表的操作
 * 如增删改查等操作,该类不负责系统业务逻辑的处理,主要业务逻辑的实现在对应的Manager中
 */
 
package com.aishu.wf.core.engine.identity.dao;

import com.aishu.wf.core.engine.identity.model.Org;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * @author lw
 * @version 1.0
 * @since  
 */

@Repository
public interface OrgQueryDao extends BaseMapper<Org> {
	/**
	 * 获取组织全路径名称 （XX公司XX部门XX）
	 * @param orgId
	 * @return
	 */
	List<Org> findFullPath(String orgId);

	/**
	 * 根据组织机构ID来获取其所有上级组织机构列表(递归包含所有的父组织机构树)
	 * @param org
	 * @return
	 */
	List<Org> findParentOrgTree(Org org);

	/**
	 * 根据组织机构ID集合做为查询条件来获取组织机构列表
	 * @param orgIds
	 * @return
	 */
	List<Org> findOrgByIds(@Param("orgIds") List<String> orgIds);
}
