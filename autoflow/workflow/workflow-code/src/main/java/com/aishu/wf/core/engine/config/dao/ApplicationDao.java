package com.aishu.wf.core.engine.config.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.aishu.wf.core.engine.config.model.ApplicationEntity;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;


public interface ApplicationDao extends BaseMapper<ApplicationEntity>{
	public List<ApplicationEntity> selectByUserId(@Param("userId") String userId);
}
