package com.aishu.wf.core.doc.service;

import com.aishu.wf.core.doc.dao.DocShareStrategyAuditorMapper;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.service.User2roleService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DocShareStrategyAuditorService extends ServiceImpl<DocShareStrategyAuditorMapper, DocShareStrategyAuditor> {

    @Autowired
    private User2roleService user2roleService;
    @Autowired
    static DocShareStrategyAuditorService docShareStrategyAuditorService;

    public void deleteAuditorByUserDeleted(String userId){
        // 用户删除，审核策略的审核员同步删除
        remove(new LambdaQueryWrapper<DocShareStrategyAuditor>().eq(DocShareStrategyAuditor::getUserId, userId));

        // 用户删除，部门审核员规则的审核员同步删除
        user2roleService.remove(new LambdaQueryWrapper<User2role>().eq(User2role::getUserId, userId));
    }

    public void updateAuditorNameByUserNameModify(String userId, String newUserName){
        // 用户名称变更，审核策略的审核员名称同步变更
        DocShareStrategyAuditor updateStrategyAuditor = new DocShareStrategyAuditor();
        updateStrategyAuditor.setUserName(newUserName);
        update(updateStrategyAuditor, new LambdaQueryWrapper<DocShareStrategyAuditor>().eq(DocShareStrategyAuditor::getUserId, userId));

        // 用户名称变更，部门审核员规则的审核员名称同步变更
        User2role updateUser2role = new User2role();
        updateUser2role.setUserName(newUserName);
        user2roleService.update(updateUser2role, new LambdaQueryWrapper<User2role>().eq(User2role::getUserId, userId));
    }

}
