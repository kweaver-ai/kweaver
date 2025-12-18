/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */
 
package com.aishu.wf.core.engine.config.service;

import com.aishu.wf.core.engine.config.dao.ActivityInfoConfigDao;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author lw
 * @version 1.0
 * @since  
 */

@Service
public class ActivityInfoConfigManager extends ServiceImpl<ActivityInfoConfigDao, ActivityInfoConfig> {

    @Autowired
    private ActivityInfoConfigDao activityInfoConfigDao;

    /**
     * @description 获取环节配置信息
     * @author hanj
     * @version 1.0
     */
    public ActivityInfoConfig getActivityInfoConfig(String procDefId, String activityDefId) throws WorkFlowException {
        ActivityInfoConfig param=new ActivityInfoConfig();
        param.setActivityDefId(activityDefId);
        param.setProcessDefId(procDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(param);
        return activityInfoConfigDao.selectOne(queryWrapper);
    }

    /**
     * @description 根据流程定义ID删除环节配置信息
     * @author hanj
     * @version 1.0
     */
    public boolean deleteActivityInfoConfigs(String procDefId) throws WorkFlowException {
        ActivityInfoConfig param = new ActivityInfoConfig();
        param.setProcessDefId(procDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(param);
        return activityInfoConfigDao.delete(queryWrapper) > 0;
    }

    /**
     * @description 根据流程定义ID查询环节配置信息
     * @author hanj
     * @version 1.0
     */
    public List<ActivityInfoConfig> findActivityInfoConfigs(String procDefId) throws WorkFlowException {
        ActivityInfoConfig param = new ActivityInfoConfig();
        param.setProcessDefId(procDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(param);
        return activityInfoConfigDao.selectList(queryWrapper);
    }

    /**
     * @description 根据流程定义ID更新流程定义名称
     * @author hanj
     * @version 1.0
     */
    public void updateByProcessDefName(String processDefId, String processDefName){
        ActivityInfoConfig param = new ActivityInfoConfig();
        param.setProcessDefId(processDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(param);
        ActivityInfoConfig upConfig = new ActivityInfoConfig();
        upConfig.setProcessDefName(processDefName);
        activityInfoConfigDao.update(upConfig, queryWrapper);
    }

    /**
     * @description 根据流程定义ID和环节定义ID删除环节配置信息
     * @author hanj
     * @version 1.0
     */
    public void remove(String processDefId, String activityDefId) {
        ActivityInfoConfig param = new ActivityInfoConfig();
        param.setProcessDefId(processDefId);
        param.setActivityDefId(activityDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(param);
        activityInfoConfigDao.delete(queryWrapper);
    }

}
