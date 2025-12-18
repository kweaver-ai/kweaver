/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */
 
package com.aishu.wf.core.engine.config.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.aishu.wf.core.engine.config.dao.ProcessErrorLogDao;
import com.aishu.wf.core.engine.config.model.ProcessErrorLog;

import lombok.extern.slf4j.Slf4j;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Slf4j
@Service
@Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
public class ProcessErrorLogManager{
	@Autowired
	private ProcessErrorLogDao processErrorLogDao;

	@Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = false)
	public void save(ProcessErrorLog entity) {
		try {
			processErrorLogDao.insert(entity);
		} catch (Exception e) {
			log.warn("记录流程执行日志出现异常，ProcessErrorLog：" + entity, e);
		}
	}

}
