package com.aishu.wf.core.engine.identity.dao;

import com.aishu.wf.core.engine.identity.model.User2role;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface User2roleDao extends BaseMapper<User2role> {

	List<User2role> getUser2roleList(@Param("roleId") String roleId);

	List<User2role> getUser2roleListByOrgs(@Param("roleId") String roleId, @Param("orgIdList") List<String> orgIdList);

	/*public List<User2role> getUser2roleList(String roleId){
		return this.getSqlSessionTemplate().selectList(getIbatisMapperNamesapce()+".getUser2roleList", roleId);
	}*/

}
