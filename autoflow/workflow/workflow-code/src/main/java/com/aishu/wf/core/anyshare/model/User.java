package com.aishu.wf.core.anyshare.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * @description 爱数用户数据实体
 * @author hanj
 */
@Getter
@Setter
public class User {

    /**
     * 名称
     */
    private String name;

    /**
     * 用户角色
     */
    private List<String> roles;

    /**
     * 用户状态
     */
    private Boolean enabled;

    /**
     * 优先级
     */
    private Integer priority;

    /**
     * 密级
     */
    private Integer csf_level;
    /**
     * 登录名
     */
    private String account;
    /**
     * 邮件地址
     */
    private String email;
    /**
     * 用户ID
     */
    private String id;
    /**
     * 电话号码
     */
    private String telephone;
    /**
     * 第三方应用属性
     */
    private String third_attr;

    /**
     * 第三方应用ID
     */
    private String third_id;

    /**
     * 父部门
     */
    private List<List<Department>> parent_deps;

    /**
     * 上级
     */
    private UserProfile manager;


}
