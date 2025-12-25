package com.aishu.wf.core.engine.identity.model;

import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.anyshare.model.UserProfile;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Data
@TableName("t_wf_user")
public class User implements Serializable {

    private static final long serialVersionUID = 5454155825314635342L;

    /**
     * 用户ID       数据字段: USER_ID
     */
    @TableId
    private String userId;
    /**
     * 用户编码       数据字段: USER_CODE
     */
    private String userCode;
    /**
     * 用户姓名       数据字段: USER_NAME
     */
    private String userName;
    /**
     * 直属单位编码       数据字段: COMPANY_ID
     */
    private String deptId;
    /**
     * 直属单位编码       数据字段: COMPANY_ID
     */
    private String deptName;
    /**
     * 直属单位编码       数据字段: COMPANY_ID
     */
    private String companyId;
    /**
     * 直属单位编码       数据字段: COMPANY_ID
     */
    private String companyName;
    /**
     * 所属单位编码       数据字段: ORG_ID
     */
    private String orgId;

    /**
     * 所属单位名称       数据字段: ORG_NAME
     */
    private String orgName;
    /**
     * 手机号码       数据字段: USER_MOBILE
     */
    private String userMobile;
    /**
     * 用户邮箱       db_column: USER_MAIL
     */
    private String userMail;

    /**
     * 主要岗位       数据字段: POSITION_ID
     */
    private String positionId;
    /**
     * 兼职岗位       数据字段: PLURALITY_POSITION_ID
     */
    private String pluralityPositionId;
    /**
     * 主要职务       数据字段: TITLE_ID
     */
    private String titleId;
    /**
     * 兼职职务       数据字段: PLURALITY_TITLE_ID
     */
    private String pluralityTitleId;
    /**
     * 用户类别，(正式人员:ZS、试用人员:SY、离职人员:LZ、临时人员:LS、外部人员、WB)       数据字段: USER_TYPE
     */
    private String userType;

    private Integer userSort;
    /**
     * 用户状态（启用:QY、未启用:WQY）       数据字段: USER_STATUS
     */
    private String userStatus;
    /**
     * 用户密码       数据字段: USER_PWD
     */
    private String userPwd;


    @TableField(exist = false)
    private Org org;
    @TableField(exist = false)
    private String orgFullPath;

    /**
     * 父部门
     */
    @TableField(exist = false)
    private List<List<Department>> parentDeps;

    /**
     * 直属部门集合
     */
    @TableField(exist = false)
    private List<Department> directDeptInfoList;
    /**
     * 角色ID集合
     */
    @TableField(exist = false)
    private List<String> roleList;
    /**
     * 用户状态
     */
    @TableField(exist = false)
    private Boolean enabled;

    /**
     * 优先级
     */
    @TableField(exist = false)
    private Integer priority;

    /**
     * 密级
     */

    @TableField(exist = false)
    private Integer csfLevel;

    /**
     * 上级
     */
    @TableField(exist = false)
    private UserProfile manager;
}

