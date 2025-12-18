/*
 * 该Dao主要负责该类同名表或其他与之关联表的操作
 * 如增删改查等操作,该类不负责系统业务逻辑的处理,主要业务逻辑的实现在对应的Manager中
 */
 
package com.aishu.wf.core.engine.identity.dao;

import com.aishu.wf.core.engine.identity.model.User;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.springframework.stereotype.Repository;


/**
 * @author lw
 * @version 1.0
 * @since  
 */

@Repository
public interface UserQueryDao extends BaseMapper<User> {
}
