package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.engine.identity.dao.User2roleDao;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class User2roleService extends ServiceImpl<User2roleDao, User2role> {

    @Autowired
    private User2roleDao user2roleDao;


    public List<User2role> getUser2roleListByOrgs(String roleId, List<String> orgIdList){
        return user2roleDao.getUser2roleListByOrgs(roleId, orgIdList);
    }

}
