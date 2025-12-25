/*
 * 该Dao主要负责该类同名表或其他与之关联表的操作
 * 如增删改查等操作,该类不负责系统业务逻辑的处理,主要业务逻辑的实现在对应的Manager中
 */

package com.aishu.wf.core.engine.identity.dao;

import com.aishu.wf.core.engine.identity.model.Role;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * @author lw
 * @version 1.0
 * @since
 */

@Repository
public interface RoleQueryDao extends BaseMapper<Role> {

    IPage<Role> findDeptAuditorRuleRolePage(IPage<Role> page, @Param("id") String id, @Param("name") String name, @Param("names") String[] names,
                                                   @Param("auditors") String[] auditors, @Param("roleCreator") String roleCreator, @Param("tenantId") String tenantId,@Param("template") String template);

    List<Role> findRoleByUser(@Param("userId") String userId);

    List<Role> findRoleByUserCode(@Param("userCode") String userCode);
}
