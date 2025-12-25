package com.aishu.wf.core.engine.identity.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.EmailInfo;
import com.aishu.wf.core.anyshare.model.Emails;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户组织架构管理服务
 *
 * @author Liuchu
 * @since 2021-3-3 15:06:09
 */
@Service
public class UserManagementService {

    @Resource
    private AnyShareConfig anyShareConfig;

    private UserManagementOperation userManagementOperation;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }

    /**
     * id转名称，返回非404引起的异常信息
     *
     * @param type 类型（user:用户、department：部门）
     * @param ids  id集合
     * @return 名称集合
     */
    public List<ValueObjectEntity> names(String type, List<String> ids) {
        return userManagementOperation.getInfoByTypeAndIdsWithFilterNonExist(type, ids);
    }

    /**
     * id转名称，返回所有异常信息
     *
     * @param type 类型（user:用户、department：部门）
     * @param ids  id集合
     * @return 名称集合
     */
    public List<ValueObjectEntity> namesWithExcepteion(String type, List<String> ids) {
        return userManagementOperation.getInfoByTypeAndIds(type, ids);
    }

    /**
     * 获取用户信息
     *
     * @param userId 用户ID
     * @return  用户信息
     * @throws Exception
     */
    public User getUserInfoById(String userId) throws Exception {
        return userManagementOperation.getUserInfoById(userId);
    }

    /**
     * 获取多个用户信息
     *
     * @param userIds 用户IDs
     * @return  用户信息
     * @throws Exception
     */
    public List<User> getUserInfoByIds(String userIds) throws Exception {
        return userManagementOperation.getUserInfoByIds(userIds);
    }

    /**
     * 获取用户直属部门ID集合
     *
     * @param userId 用户ID
     * @return 直属部门ID集合
     * @throws Exception
     */
    public List<String> getDepartmentIdsByUserId(String userId) throws Exception {
        return userManagementOperation.getDepartmentIdsByUserId(userId);
    }

    /**
     * @description 批量获取用户、部门邮箱
     * @author ouandyang
     * @param  userIds 用户ID
     * @param  departmentIds 部门ID
     * @updateTime 2021/7/14
     */
    public List<String> getEmails(List<String> userIds, List<String> departmentIds) throws Exception {
        if (CollUtil.isEmpty(userIds) && CollUtil.isEmpty(departmentIds)) {
            return null;
        }
        Emails emails = userManagementOperation.getEmails(userIds, departmentIds);
        if (emails != null) {
            // 拼装所有邮箱
            List<EmailInfo> list = new ArrayList<>(emails.getUser_emails());
            list.addAll(emails.getDepartment_emails());
            return list.stream().filter(item -> StrUtil.isNotBlank(item.getEmail()))
                    .map(EmailInfo::getEmail).distinct().collect(Collectors.toList());
        }
        return null;
    }



}
