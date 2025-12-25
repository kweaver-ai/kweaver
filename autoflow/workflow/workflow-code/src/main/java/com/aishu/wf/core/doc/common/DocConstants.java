package com.aishu.wf.core.doc.common;

/**
 * 文档常量
 *
 * @author ouandyang
 * @since 2021-3-30 17:56:10
 */
public class DocConstants {

    /**
     * 个人文档库
     */
    public final static String USER_DOC_LIB = "user_doc_lib";
    /**
     * 部门文档库
     */
    public final static String DEPARTMENT_DOC_LIB = "department_doc_lib";
    /**
     * 自定义文档库
     */
    public final static String CUSTOM_DOC_LIB = "custom_doc_lib";
    /**
     * 知识库
     */
    public final static String KNOWLEDGE_DOC_LIB = "knowledge_doc_lib";
    /**
     * 所有个人文档库
     */
    public final static String ALL_USER_DOC_LIB = "all_user_doc_lib";
    /**
     * 所有部门文档库
     */
    public final static String ALL_DEPARTMENT_DOC_LIB = "all_department_doc_lib";
    /**
     * 所有自定义文档库
     */
    public final static String ALL_CUSTOM_DOC_LIB = "all_custom_doc_lib";
    /**
     * 共享个人文档库
     */
    public final static String SHARED_USER_DOC_LIB = "shared_user_doc_lib";
    /**
     * 文档ID前缀
     */
    public final static String GNS_PROTOCOL = "gns://";
    /**
     * 文件类型-文件
     **/
    public static final String DOC_TYPE_FILE = "file";
    /**
     * 文件类型-文件夹
     **/
    public static final String DOC_TYPE_FOLDER = "folder";
    /**
     * 文件类型-多个文件-自定义类型
     **/
    public static final String DOC_TYPE_MULTIPLE = "multiple";

    /**
     * 共享申请
     */
    public final static String SHARED_LINK_PERM = "perm";
    /**
     * 外链申请
     */
    public final static String SHARED_LINK_HTTP = "anonymous";
    /**
     * 所有者申请
     */
    public final static String CHANGE_OWNER = "owner";
    /**
     * 更改密级申请
     */
    public final static String CHANGE_CSF_LEVEL = "security";
    /**
     * 更改继承申请
     */
    public final static String CHANGE_INHERIT = "inherit";
    /**
     * 操作类型-新增
     */
    public final static String OP_TYPE_CREATE = "create";
    /**
     * 操作类型-编辑
     */
    public final static String OP_TYPE_MODIFY = "modify";
    /**
     * 操作类型-删除
     */
    public final static String OP_TYPE_DELETE = "delete";

    /**
     * 共享给指定用户的申请
     */
    public final static String BIZ_TYPE_REALNAME_SHARE = "realname";

    /**
     * 共享给任意用户的申请
     */
    public final static String BIZ_TYPE_ANONYMITY_SHARE = "anonymous";

    /**
     * 同步申请
     */
    public final static String BIZ_TYPE_SYNC = "sync";

    /**
     * 定密申请
     */
    public final static String BIZ_TYPE_SECURITY = "security";

    /**
     * 流程申请
     */
    public final static String BIZ_TYPE_FLOW = "flow";
    /**
     * 文档审核执行实现类前置
     */
    public static final String DOC_AUDIT_BIZ_SERVICE_PRFIX="doc_audit_biz";
    /**
     * 免审密级dict_code
     */
    public static final String FREE_AUDIT_SECRET_LEVEL="free_audit_secret_level";
    /**
     * 免审所有密级dict_code
     */
    public static final String FREE_AUDIT_SECRET_LEVEL_ENUM="free_audit_secret_level_enum";

    /**
     * 当前部门允许共享密级dict_code
     */
    public static final String SELF_DEPT_FREE_AUDIT="self_dept_free_audit";

    /**
     * 开关代码
     */
    public static final String FREE_AUDIT_SWITCH_ENABLE="y";
    public static final String FREE_AUDIT_SWITCH_DISABLE="n";

    /**
     * 访问者类型
     */
    public static final String FREE_AUDIT_ACCESS_USER="user";
    public static final String FREE_AUDIT_ACCESS_DEPARTMENT="department";

    /**
     * 审核状态-审核中
     */
    public static final String AUDIT_STATUS_PENDING = "pending";
    /**
     * 审核状态-通过
     */
    public static final String AUDIT_STATUS_PASS = "pass";
    /**
     * 审核状态-拒绝
     */
    public static final String AUDIT_STATUS_REJECT = "reject";
    /**
     * 审核状态-免审核
     */
    public static final String AUDIT_STATUS_AVOID = "avoid";
    /**
     * 审核状态-发起失败
     */
    public static final String AUDIT_STATUS_FAILED = "failed";

    /**
     * 审核状态-撤销
     */
    public static final String AUDIT_STATUS_UNDONE = "undone";

    /**
     * 审核状态-作废
     */
    public static final String AUDIT_STATUS_CANCEL = "cancel";

    /**
     * 审核状态-已通过（审核已通过、审核中）（针对审核员我处理的状态查询）
     */
    public static final String AUDIT_STATUS_DONE_PASS = "donepass";

    /**
     * 审核状态-已通过（审核已通过、审核中）（针对审核员我处理的状态查询）
     */
    public static final String AUDIT_STATUS_TRANSFER = "transfer";

    /**
     * 审核状态-已退回
     */
    public static final String AUDIT_STATUS_SENDBACK = "sendback";

    /**
     * 文档同步-同步模式-同步
     */
    public static final String DOC_SYNC_MODE_SYNC = "sync";
    /**
     * 文档同步-同步模式-复制
     */
    public static final String DOC_SYNC_MODE_COPY = "copy";
    /**
     * 文档同步-同步模式-移动
     */
    public static final String DOC_SYNC_MODE_MOVE = "move";

    /**
     * 文档审核日志bean前缀
     */
    public static final String DOC_AUDIT_LOG_PRFIX = "doc_audit_log_";

    /**
     * 文档全路径前缀
     */
    public final static String DOC_PATH_PREFIX = "AnyShare://";

    /**
     * 流程作废理由-流程定义删除
     */
    public static final String DELETE_REASON_PROC_DEF_DELETE = "proc_def_delete";

    /**
     * 流程作废理由-文档流转流程定义删除
     */
    public static final String PROC_FLOW_DEF_DELETE = "proc_flow_def_delete";
    /**
     * 流程作废理由-流程定义删除
     */
    public static final String DELETE_REASON_REVOCATION = "revocation";
    /**
     * 流程作废理由-文件变更（文档流转）
     */
    public static final String FLOW_DEL_FILE_CANCEL = "flow_del_file_cancel";
    /**
     * 流程作废理由,用户被删除了
     */
    public static final String USER_DELETED = "user_deleted";
    /**
     * 流程作废理由,冲突替换
     */
    public static final String CONFLICT_APPLY = "conflictApply";

    /**
     * 默认审核意见
     */
    public static final String DEFAULT_COMMENT = "default_comment";

    /**
     * 流程节点更新
     */
    public static final String PROC_DEF_BROKEN = "proc_def_broken";



}
