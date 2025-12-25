package com.aishu.wf.core.engine.config.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.engine.config.dao.Application2UserDao;
import com.aishu.wf.core.engine.config.model.Application2UserEntity;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

@Service
public class Application2UserManager extends ServiceImpl<Application2UserDao, Application2UserEntity> {

	@Autowired
	private Application2UserDao application2UserDao;
	
	public void deleteApplicationUser(String appId) {
		application2UserDao.deleteById(appId);
	}

	// 新增应用与用户关联
	public boolean addApplicationUser(String appId, String... users) {
		List<Application2UserEntity> application2UserList = new ArrayList<Application2UserEntity>();
		for (String user : users) {
			Application2UserEntity application2UserEntity = new Application2UserEntity();
			application2UserEntity.setAppId(appId);
			application2UserEntity.setUserId(user);
			application2UserList.add(application2UserEntity);
		}
		return application2UserDao.batchInsert(application2UserList);
	}
}
