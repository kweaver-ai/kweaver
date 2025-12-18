/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */
 
package com.aishu.wf.core.engine.config.service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.config.dao.ActivityInfoConfigDao;
import com.aishu.wf.core.engine.config.dao.ActivityRuleDao;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Service
public class ActivityRuleManager extends ServiceImpl<ActivityRuleDao, ActivityRule> {

	@Autowired
	// ActivityRule对应的DAO类,主要用于数据库的增删改查等操作
	private ActivityRuleDao activityRuleDao;

	public ActivityRule getActivityRule(String procDefId, String sourceActId, String targetActId, String ruleType) {
		ActivityRule params = new ActivityRule();
		params.setProcDefId(procDefId);
		params.setSourceActId(sourceActId);
		params.setTargetActId(targetActId);
		params.setRuleType(ruleType);
		QueryWrapper<ActivityRule> queryWrapper = new QueryWrapper<>(params);
		return activityRuleDao.selectOne(queryWrapper);
	}

	public List<ActivityRule> findActivityRules(String procDefId, String ruleType) {
		ActivityRule params = new ActivityRule();
		params.setProcDefId(procDefId);
		params.setRuleType(ruleType);
		QueryWrapper<ActivityRule> queryWrapper = new QueryWrapper<>(params);
		return activityRuleDao.selectList(queryWrapper);
	}

	public void deleteAllActivityRule(String procDefId) {
		ActivityRule params = new ActivityRule();
		params.setProcDefId(procDefId);
		QueryWrapper<ActivityRule> queryWrapper = new QueryWrapper<>(params);
		activityRuleDao.delete(queryWrapper);
	}

}
