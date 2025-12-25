package com.aishu.wf.core.engine.config.dao;

import java.util.List;

import com.aishu.wf.core.engine.config.model.Application2UserEntity;
import com.aishu.wf.core.engine.config.model.ApplicationEntity;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

public interface Application2UserDao extends BaseMapper<Application2UserEntity>{
	boolean batchInsert(List<Application2UserEntity> application2UserList);
}