/*
 * 该类为数据库表实体类
 */
package com.aishu.wf.core.engine.identity.model;

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
@TableName("t_wf_org")
public class Org implements Serializable {
    private static final long serialVersionUID = 5454155825314635342L;
    //columns START
    /**
     * 组织编码       数据字段: ORG_ID
     */
    @TableId
    private String orgId;
    /**
     * 组织简称       数据字段: ORG_NAME
     */
    @TableField("org_name")
    private String orgName;
    /**
     * 组织全称       数据字段: ORG_FULL_NAME
     */
    @TableField("org_full_name")
    private String orgFullName;
    /**
     * 组织全路径名称，如组织1/部门1/科室1       数据字段: ORG_FULL_PATH_NAME
     */
    @TableField("org_full_path_name")
    private String orgFullPathName;
    /**
     * 组织全路径ID，如1/2/3       数据字段: ORG_FULL_PATH_ID
     */
    @TableField("org_full_path_id")
    private String orgFullPathId;
    /**
     * 上级组织编码       数据字段: ORG_PARENT_ID
     */
    @TableField("org_parent_id")
    private String orgParentId;
    /**
     * 组织类型，如单位：UNIT、部门：DEPT、其他：OTHER       数据字段: ORG_TYPE
     */
    @TableField("org_type")
    private String orgType;
    /**
     * 组织级别，顶层组织：0、一级组织：1、二级组织：2、三级组织：3、四级组织：4       数据字段: ORG_LEVEL
     */
    @TableField("org_level")
    private Integer orgLevel;
    /**
     * 政府单位区域类别，省级：SJ，地市：DS，县：QX，乡镇：XZ，街道：JD       数据字段: ORG_AREA_TYPE
     */
    @TableField("org_area_type")
    private String orgAreaType;
    /**
     * 组织排序号       数据字段: ORG_SORT
     */
    @TableField("org_sort")
    private Integer orgSort;

    /**
     * 组织负责人       数据字段: ORG_PRINCIPAL
     */
    @TableField("org_principal")
    private String orgPrincipal;
    /**
     * 组织状态，（启用:QY、禁用:JY）       数据字段: ORG_STATUS
     */
    @TableField("org_status")
    private String orgStatus;
    /**
     * 分管领导Id       数据字段: ORG_BRANCH_LEADER
     */
    @TableField("org_branch_leader")
    private String orgBranchLeader;
    /**
     * 分管领导姓名       冗余字段
     */
    @TableField(exist = false)
    private String orgBranchLeaderName;

    /**
     * 公司ID
     */
    @TableField("company_id")
    private String companyId;

    /**
     * 公司名称
     */
    @TableField("company_name")
    private String companyName;

    /**
     * 部门ID
     */
    @TableField("dept_id")
    private String deptId;
    /**
     * 部门名称
     */
    @TableField("dept_name")
    private String deptName;

    @TableField(exist = false)
    private List<String> orgIds;
}

