package com.aishu.wf.core.anyshare.client;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.anyshare.model.Emails;
import com.aishu.wf.core.anyshare.model.UserProfile;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.common.exception.InternalException;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.exception.UserNotFoundException;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @description 用户管理操作
 * @author hanj
 * @version 1.0
 */
@Slf4j
public class UserManagementOperation {

    private static final String ENDPOINT = "/api/user-management/v1";

    private static final String GET_DEPARTMENT_IDS = "/users/%s/department_ids";

    private static final String NAMES = "/names";

    private static final String GET_USER_FIELD = "/users/%s/account,roles,enabled,priority,csf_level,parent_deps,name";

    private static final String GET_USER_FIELDS = "/users/%s/roles,enabled,priority,csf_level,parent_deps,name,account,email,telephone,third_attr,third_id";


//    private static final String GET_USER_FIELDS = "/users/%s/roles,enabled,priority,csf_level";

    private static final String TOKEN_TO_USERID = "/oauth2/introspect";

    private static final String GET_USER_EMAILS = "/emails";

    private static final String GET_GROUP_USERS = "/group-members";

    private static final String GET_DEPARTMENT_USERS = "/departments/%s/all_user_ids";

    private static final String CREATE_INTERNAL_GROUP = "/internal-groups";

    private static final String DELETE_INTERNAL_GROUP = "/internal-groups/%s";
    
    private static final String INTERNAL_GROUP_USERS = "/internal-group-members/%s";
    
    private static final String BATCH_GET_USERS = "/batch-get-user-info";
    
    private final ApiClient apiClient;

    private static final List<String> DEFAULT_FIELDS = Arrays.asList("manager");

    public UserManagementOperation(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * @description 根据token获取用户id
     * @author hanj
     * @param  token
     * @updateTime 2021/4/30
     */
    public String getUserIdByToken(String token) throws Exception {
        MediaType mediaType = MediaType.get("application/x-www-form-urlencoded");
        String body = apiClient.post(TOKEN_TO_USERID , "token=" + token, mediaType);
        if (StrUtil.isBlank(body)) {
            return null;
        }
        try {
            JSONObject jsonObject = JSON.parseObject(body);
            Boolean active = jsonObject.getBoolean("active");
            if (active != null && active) {
                return jsonObject.getString("sub");
            }
        } catch (Exception e) {
            log.warn("返回值解析成JSON对象失败！", e);
        }
        return null;
    }

    /**
     * @description 根据ids查询用户或部门数据
     * @author hanj
     * @param  type,ids 类型（user:用户、department：部门）
     * @updateTime 2021/4/30
     */
    public List<ValueObjectEntity> getInfoByTypeAndIds(String type, List<String> ids) {
        List<String> idsParams = ids.stream().distinct().collect(Collectors.toList());
        JSONObject postJson = new JSONObject();
        postJson.put("method", "GET");
        postJson.put(type + "_ids", idsParams);
        MediaType mediaType = MediaType.get("application/json");
        String s = postJson.toJSONString();
        if (log.isDebugEnabled()) {
            log.debug("根据ids查询用户或部门数据，请求参数：{}", s);
        }

        String body = null;
        try {
            body = apiClient.postAndCollect(ENDPOINT + NAMES, s, mediaType);
        } catch (Exception e) {
            log.warn("根据ids查询用户或部门数据失败！参数:{},原因：{}", s, e.getMessage());
        }
        if (log.isDebugEnabled()) {
            log.debug("body:{}", body);
        }
        JSONObject object = JSON.parseObject(body);
        if(object.containsKey("code")){
            throw new RestException(object.getInteger("code"), object.getString("message"), object.getString("detail"));
        }
        JSONArray arr = object.getJSONArray(type + "_names");
        return JSON.parseArray(arr.toJSONString(), ValueObjectEntity.class);
    }

    /**
     * @description 根据ids查询用户或部门数据,查询过程会自动过滤不存在的用户
     * @author siyu.chen
     * @param  type,ids 
     * @updateTime 2024/3/26
     */
    public List<ValueObjectEntity> getInfoByTypeAndIdsWithFilterNonExist(String type, List<String> ids) {
        if (CollUtil.isEmpty(ids)) {
            List<ValueObjectEntity> empty = new ArrayList<>();
            return empty;
        }
        List<Integer> errorCodes = Arrays.asList(400019001, 400019002, 400019003, 400019004, 404019001);
        List<String> idsParams = ids.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        try {
            return this.getInfoByTypeAndIds(type, idsParams);
        } catch (Exception e) {
            if (!(e instanceof RestException)) {
                log.warn("根据ids查询用户信息,解析body失败！detail：{}", e.getMessage());
                throw e;
            }
            // 自定义异常类型的处理
            RestException ce = (RestException) e;
            if (!errorCodes.contains(ce.getErrCode())) {
                log.warn("根据ids查询用户信息,解析body失败！detail：{}", e.getMessage());
                throw e;
            }
            JSONObject detailObj = JSON.parseObject(ce.getDetail().toString());
            List<String> notExistIds = JSON.parseArray(detailObj.getString("ids"), String.class);
            ids.removeAll(notExistIds);
            return getInfoByTypeAndIdsWithFilterNonExist(type, ids);
        }
    }

    /**
     * @description 取用户所有直属部门ID
     * @author hanj
     * @param  userId
     * @updateTime 2021/4/30
     */
    public List<String> getDepartmentIdsByUserId(String userId) throws Exception {
        List<String> result = Lists.newArrayList();
        String body = apiClient.get(ENDPOINT + String.format(GET_DEPARTMENT_IDS, userId));
        if (StrUtil.isNotBlank(body)) {
            try {
                result = JSON.parseArray(body, String.class);
            } catch (Exception ignore) {
            }
        }
        return result;
    }

    /**
     * @description 获取用户信息字段名：(可任意组合，若获取多个字段以逗号相隔)
     * @author hanj
     * @param  userId
     * @updateTime 2021/5/13
     */
    public User getUserInfoById(String userId) throws Exception {
        String body = apiClient.getAndCollect(ENDPOINT + String.format(GET_USER_FIELD, userId));
        try {
            List<User> userInfos = JSON.parseArray(body, User.class);
            return userInfos.get(0);
        } catch (Exception e) {
            try {
                JSONObject object = JSON.parseObject(body);
                if (object.getInteger("code") != null) {
                    throw new UserNotFoundException(object.getString("message"));
                }
                User user = JSON.parseObject(body, User.class);
                return user;
            } catch (Exception ex) {
                throw new UserNotFoundException(ex.getMessage());
            }
            
        }
    }

    /**
     * @description 获取多个用户信息字段名：(可任意组合，若获取多个字段以逗号相隔)
     * @author xiashenghui
     * @param  userId
     * @updateTime 2022/4/19
     */
    public List<User> getUserInfoByIds(String userId) throws Exception {
        String  body = apiClient.getAndCollect(ENDPOINT + String.format(GET_USER_FIELDS, userId));
        try {
            List<User> userInfos = JSON.parseArray(body, User.class);
            return userInfos;
        } catch (Exception e) {
            try {
                JSONObject object = JSON.parseObject(body);
                if (object.getInteger("code") != null) {
                    throw new UserNotFoundException(object.getString("message"));
                }
                User user = JSON.parseObject(body, User.class);
                List<User> userInfos = Arrays.asList(user);
                return userInfos;
            } catch (Exception ex) {
                throw new UserNotFoundException(ex.getMessage());
            }
            
        }
    }

    public List<User> batchListUsers(List<String> userIds) {
        List<User> userInfos = new ArrayList<>();
        if (CollUtil.isEmpty(userIds)) {
            return userInfos;
        }
        userIds = userIds.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        String userId = String.join(",", userIds);
        try {
            String body = apiClient.getWithOriginResp(ENDPOINT + String.format(GET_USER_FIELDS, userId));
            try {
                // 如果不存在异常则可直接解析返回用户信息
                userInfos = JSON.parseArray(body, User.class);
                return userInfos;
            } catch (Exception ex) {
                try {
                    JSONObject object = JSON.parseObject(body);
                    if (object.getInteger("code") != null && object.getInteger("code").equals(404019001)) {
                        JSONObject detailObj = JSON.parseObject(object.getString("detail"));
                        List<String> notExistIds = JSON.parseArray(detailObj.getString("ids"), String.class);
                        userIds.removeAll(notExistIds);
                        return batchListUsers(userIds);
                    }
                    log.warn("根据ids查询用户信息非用户不存在错误！detail：{}, resp body：{}", ex.getMessage(), body);
                    return userInfos;
                } catch (Exception e) {
                    log.warn("根据ids查询用户信息,解析body失败！detail：{}", e.getMessage());
                    return userInfos; 
                }
            }
        } catch (Exception e) {
            log.warn("根据ids查询用户信息失败！detail：{}", e.getMessage());
            return userInfos; 
        }
    }


    /**
     * @description 批量获取用户邮箱
     * @author ouandyang
     * @param  userIds 用户ID
     * @param  departmentIds 部门ID
     * @updateTime 2021/7/14
     */
    public Emails getEmails(List<String> userIds, List<String> departmentIds) throws Exception {
        StringBuffer url = new StringBuffer(ENDPOINT + GET_USER_EMAILS);
        if (CollUtil.isNotEmpty(userIds)) {
            for (String item : userIds) {
                String point = url.indexOf("?") == -1 ? "?" : "&";
                url.append(point + "user_id=" + item);
            }
        }
        if (CollUtil.isNotEmpty(departmentIds)) {
            for (String item : departmentIds) {
                String point = url.indexOf("?") == -1 ? "?" : "&";
                url.append(point + "department_id=" + item);
            }
        }
        String body = apiClient.get(url.toString());
        JSONObject object = JSON.parseObject(body);
        if (object.getInteger("code") != null) {
            throw new UserNotFoundException(object.getString("message"));
        }
        return JSON.parseObject(body, Emails.class);
    }

    public List<String> getGroupUserList(List<String> groupIDs) throws Exception {
        JSONObject service = new JSONObject();
        service.put("method", "GET");
        service.put("group_ids", groupIDs);
        String postData = JSON.toJSONString(service);
        MediaType mediaType = MediaType.get("application/json");
        String body = apiClient.postAndCollect(ENDPOINT + GET_GROUP_USERS, postData, mediaType);
        try {
            JSONObject object = JSON.parseObject(body);
            if (object.getInteger("code") != null) {
                throw new InternalException(object.getString("message"));
            }
            List<String> allUsers = JSON.parseArray(object.getString("user_ids"), String.class);
            List<String> departMentIDs = JSON.parseArray(object.getString("department_ids"), String.class);
            for (String departmentID : departMentIDs) {
              allUsers.addAll(this.getDepartmentUserList(departmentID));
            }
            allUsers = allUsers.stream().distinct().collect(Collectors.toList());
            Collections.sort(allUsers);
            return allUsers;
        } catch (Exception ex) {
            throw new InternalException(ex.getMessage());
        }
    }

    public List<String> getDepartmentUserList(String departMentID) throws Exception {
        String body = apiClient.getAndCollect(ENDPOINT + String.format(GET_DEPARTMENT_USERS, departMentID));
        try {
            JSONObject object = JSON.parseObject(body);
            if (object.getInteger("code") != null) {
                throw new UserNotFoundException(object.getString("message"));
            }
            return JSON.parseArray(object.getString("all_user_ids"), String.class);
        } catch (Exception ex) {
            throw new UserNotFoundException(ex.getMessage());
        }
    }

    public String createInternalGroup() throws Exception {
        JSONObject postJson = new JSONObject();
        MediaType mediaType = MediaType.get("application/json");
        String body = apiClient.postAndCollect(ENDPOINT + CREATE_INTERNAL_GROUP, postJson.toJSONString() ,mediaType);
        JSONObject object = JSON.parseObject(body);
        if (object.getInteger("code") != null) {
            throw new RestException(object.getInteger("code"), object.getString("message"), object.getString("detail"));
        }
        return object.getString("id");
    }

    public void deleteInternalGroup(List<String> ids) throws Exception {
        apiClient.delete(ENDPOINT + String.format(DELETE_INTERNAL_GROUP, String.join(",", ids)));
    }

    public List<UserProfile> getInternalGroupUser(String id) throws Exception {
        List<UserProfile> groupUsers = new ArrayList<>();
        String body = apiClient.getAndCollect(ENDPOINT + String.format(INTERNAL_GROUP_USERS, id));
        try {
            groupUsers = JSON.parseArray(body, UserProfile.class);
            return groupUsers;
        } catch (Exception e) {
            JSONObject object = JSON.parseObject(body);
            if (object.getInteger("code") != null) {
                throw new RestException(object.getInteger("code"), object.getString("message"), object.getString("detail"));
            }
            return groupUsers;
        }
       
    }

    public void updateInternalGroupUser(String groupID, List<String> ids) throws Exception {
        JSONArray users = new JSONArray();
        for (String id : ids) {
            UserProfile internalUser = new UserProfile();
            internalUser.setId(id);
            internalUser.setType("user");
            users.add(internalUser);
        }
        apiClient.put(ENDPOINT + String.format(INTERNAL_GROUP_USERS, groupID), users.toJSONString());
    }

    public List<User> batchGetUserInfo(List<String> userIds) throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("method", "GET");
        payload.put("user_ids", userIds);
        payload.put("fields", DEFAULT_FIELDS);
        String postData = JSON.toJSONString(payload);
        MediaType mediaType = MediaType.get("application/json");
        String body = apiClient.postAndCollect(ENDPOINT + BATCH_GET_USERS, postData, mediaType);
        try {
            List<User> userInfos = JSON.parseArray(body, User.class);
            return userInfos;
        } catch (Exception e) {
            try {
                JSONObject object = JSON.parseObject(body);
                if (object.getInteger("code") != null) {
                    throw new UserNotFoundException(object.getString("message"));
                }
                User user = JSON.parseObject(body, User.class);
                List<User> userInfos = Arrays.asList(user);
                return userInfos;
            } catch (Exception ex) {
                throw new UserNotFoundException(ex.getMessage());
            }
        }
    }
}
