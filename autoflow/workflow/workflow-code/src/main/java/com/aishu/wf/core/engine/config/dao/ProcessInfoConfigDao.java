package com.aishu.wf.core.engine.config.dao;

import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface ProcessInfoConfigDao extends BaseMapper<ProcessInfoConfig> {

	IPage<List<ProcessInfoConfig>> findConfigAndModelPage(IPage<Map<String, Object>> page, @Param("ew") Wrapper<ProcessInfoConfig> queryWrapper);

	ProcessInfoConfig getLinkId(Map params);
	
	
	List<String> getPreTaskInstance(@Param("processInstanceId") String processInstanceId,@Param("taskId") String taskId);
}
