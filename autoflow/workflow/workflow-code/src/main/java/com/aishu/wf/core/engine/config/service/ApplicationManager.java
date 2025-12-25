/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */

package com.aishu.wf.core.engine.config.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.config.dao.ApplicationDao;
import com.aishu.wf.core.engine.config.model.ApplicationEntity;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

@Service
public class ApplicationManager extends ServiceImpl<ApplicationDao, ApplicationEntity> {
	@Autowired
	// TpubApplication对应的DAO类,主要用于数据库的增删改查等操作
	private ApplicationDao applicationDao;
	
	public boolean save(ApplicationEntity entity) {
		entity.setAppCreateTime(new Date());
		return applicationDao.insert(entity)>0;
	}

	public List<ApplicationEntity> selectByUserId(String userId) {
		return applicationDao.selectByUserId(userId);
	}

	public List<String> getAllowIpList() {
		List<String> allowIpList = new ArrayList<String>();
		List<ApplicationEntity> list = applicationDao.selectList(null);
		for (ApplicationEntity app : list) {
			String ip = app.getIpList();
			if (ip == null)
				continue;
			String[] ips = ip.split(",");
			allowIpList.addAll(Arrays.asList(ips));
		}
		return allowIpList;
	}
}
