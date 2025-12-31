
SET SEARCH_PATH TO adp;


CREATE TABLE IF NOT EXISTS `t_wf_activity_info_config`  (
  `activity_def_id` VARCHAR(100) NOT NULL COMMENT '流程环节定义ID',
  `activity_def_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程环节定义名称',
  `process_def_id` VARCHAR(100) NOT NULL COMMENT '流程定义ID',
  `process_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `activity_page_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程环节表单URL',
  `activity_page_info` MEDIUMTEXT NULL COMMENT '流程环节表单数据',
  `activity_operation_roleid` VARCHAR(4000) NULL DEFAULT NULL COMMENT '流程环节绑定操作权限ID',
  `remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  `jump_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '环节跳转类型，AUTO：自动路径跳转；MANUAL：人工选择跳转、FREE：自由选择跳转',
  `activity_status_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程环节状态名称(默认与环节名称一致)',
  `activity_order` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '环节排序',
  `activity_limit_time` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '环节时限',
  `idea_display_area` VARCHAR(50) NULL DEFAULT NULL COMMENT '意见分栏',
  `is_show_idea` VARCHAR(10) NULL DEFAULT NULL COMMENT '是否显示意见输入区域,默认启用ENABLED,否则禁用DISABLE',
  `activity_def_child_type` VARCHAR(20) NULL DEFAULT NULL COMMENT '环节子类型，through:流程贯穿,inside:内部流程',
  `activity_def_deal_type` VARCHAR(20) NULL DEFAULT NULL COMMENT '环节处理类型，单人多人',
  `activity_def_type` VARCHAR(20) NULL DEFAULT NULL COMMENT '环节类型',
  `is_start_usertask` VARCHAR(4) NULL DEFAULT NULL COMMENT '是否是开始节点  是为Y  否为N',
  `c_protocl` VARCHAR(50) NULL DEFAULT NULL COMMENT 'PC端协议',
  `m_protocl` VARCHAR(50) NULL DEFAULT NULL COMMENT '移动端协议',
  `m_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '手机端待办地址',
  `other_sys_deal_status` VARCHAR(10) NULL DEFAULT NULL COMMENT '其它系统处理状态   0 不可处理；1 仅阅读；2可处理',
  PRIMARY KEY (`activity_def_id`, `process_def_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_activity_rule`  (
  `rule_id` VARCHAR(50) NOT NULL COMMENT '规则ID',
  `rule_name` VARCHAR(250) NOT NULL COMMENT '规则名称',
  `proc_def_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程定义ID',
  `source_act_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '源环节ID',
  `target_act_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '目标环节ID',
  `rule_script` MEDIUMTEXT NOT NULL COMMENT '规则脚本',
  `rule_priority` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '优先级',
  `rule_type` VARCHAR(5) NULL DEFAULT NULL COMMENT '规则类型：A：环节，R：资源，F:多实例环节完成条件',
  `tenant_id` VARCHAR(255) NOT NULL COMMENT '租户ID',
  `rule_remark` VARCHAR(2000) NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`rule_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_application`  (
  `app_id` VARCHAR(50) NOT NULL COMMENT '应用系统ID',
  `app_name` VARCHAR(50) NULL DEFAULT NULL COMMENT '应用系统名称',
  `app_type` VARCHAR(20) NULL DEFAULT NULL COMMENT '应用系统分类',
  `app_access_url` VARCHAR(300) NULL DEFAULT NULL COMMENT '应用系统访问地址',
  `app_create_time` DATETIME(0) NULL DEFAULT NULL COMMENT '应用系统创建时间',
  `app_update_time` DATETIME(0) NULL DEFAULT NULL COMMENT '应用系统更新时间',
  `app_creator_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '应用系统创建人ID',
  `app_updator_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '应用系统更新人ID',
  `app_status` VARCHAR(2) NULL DEFAULT NULL COMMENT '应用系统状态',
  `app_desc` VARCHAR(300) NULL DEFAULT NULL COMMENT '应用系统描述',
  `app_provider` VARCHAR(100) NULL DEFAULT NULL COMMENT '应用系统开发厂商',
  `app_linkman` VARCHAR(50) NULL DEFAULT NULL COMMENT '应用系统联系人',
  `app_phone` VARCHAR(30) NULL DEFAULT NULL COMMENT '应用系统联系电话',
  `app_unitework_check_url` VARCHAR(300) NULL DEFAULT NULL COMMENT '应用系统检查路径',
  `app_sort` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '应用系统排序号',
  `app_shortname` CHAR(50) NULL DEFAULT NULL COMMENT '应用系统简洁名称',
  PRIMARY KEY (`app_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_application_user`  (
  `app_id` VARCHAR(50) NOT NULL COMMENT '租户ID',
  `user_id` VARCHAR(50) NOT NULL COMMENT '用户ID',
  `remark` VARCHAR(300) NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`app_id`, `user_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_dict`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键id',
  `dict_code` VARCHAR(50) NULL DEFAULT NULL COMMENT '字典编码',
  `dict_parent_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '字典上级主键id',
  `dict_name` TEXT NULL COMMENT '字典名称',
  `sort` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '排序号',
  `status` VARCHAR(2) NULL DEFAULT NULL COMMENT '状态',
  `creator_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '创建人',
  `create_date` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  `updator_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '更新人',
  `update_date` DATETIME(0) NULL DEFAULT NULL COMMENT '最后更新时间',
  `app_id` VARCHAR(50) NOT NULL COMMENT '应用id',
  `dict_value` VARCHAR(4000) NULL DEFAULT NULL COMMENT '字典值',
  PRIMARY KEY (`id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_apply`  (
  `id` VARCHAR(50) NOT NULL COMMENT '申请ID',
  `biz_id` VARCHAR(50) NOT NULL COMMENT '业务关联ID，如：AS共享申请ID',
  `doc_id` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `doc_path` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档路径，如：/name/xxx.txt',
  `doc_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '文档类型（folder文件夹,file文件,doc_lib文档库）',
  `csf_level` INT(2) NULL DEFAULT NULL COMMENT '文件密级,5~15，如果是文件夹，则为0',
  `biz_type` VARCHAR(100) NULL DEFAULT NULL COMMENT '业务类型（realname共享给指定用户的申请，anonymous共享给任意用户的申请，sync同步申请，flow流转申请，security定密申请）',
  `apply_type` VARCHAR(100) NOT NULL COMMENT '申请类型（sync同步申请，flow流转申请，perm共享申请，anonymous匿名申请，owner所有者申请，security定密申请，inherit更改继承申请）',
  `apply_detail` MEDIUMTEXT NOT NULL COMMENT '申请明细（docLibType文档库ID，accessorId访问者ID，accessorName访问者名称，accessorType访问者类型，allowValue允许权限，denyValue拒绝权限，inherit是否继承权限，expiresAt有效期，opType操作类型，linkUrl链接地址，title链接标题，password密码，accessLimit访问次数）',
  `proc_def_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程定义ID',
  `proc_def_name` VARCHAR(300) NULL DEFAULT NULL COMMENT '流程定义名称',
  `proc_inst_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程实例ID',
  `audit_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '审核模式（tjsh-同级审核，hqsh-汇签审核，zjsh-逐级审核）',
  `auditor` TEXT NULL COMMENT '审核员，冗余字段，用于页面展示(id审核人ID，name审核人名称，status审核状态，auditDate审核时间)',
  `apply_user_id` VARCHAR(50) NOT NULL COMMENT '申请人ID',
  `apply_user_name` VARCHAR(150) NULL DEFAULT NULL COMMENT '申请人名称',
  `apply_time` DATETIME(0) NOT NULL COMMENT '申请时间',
  `doc_names` VARCHAR(2000) NULL DEFAULT NULL COMMENT '文档名称',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_c2cfa35a_AK_t_wf_doc_audit_application_proc_inst_idx` ON `t_wf_doc_audit_apply` (`proc_inst_id`);
CREATE INDEX IF NOT EXISTS `idx_c2cfa35a_AK_t_wf_doc_audit_application_apply_user_idx` ON `t_wf_doc_audit_apply` (`apply_user_id`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_apply_AK_t_wf_doc_audit_application_biz_idx` ON `t_wf_doc_audit_apply` (`biz_id`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_apply_AK_t_wf_doc_audit_application_biz_typex` ON `t_wf_doc_audit_apply` (`biz_type`);


CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_detail`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `apply_id` VARCHAR(50) NOT NULL COMMENT '申请ID',
  `doc_id` TEXT NOT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `doc_path` VARCHAR(1000) NOT NULL COMMENT '文档路径，如：/name/xxx.txt',
  `doc_type` VARCHAR(10) NOT NULL COMMENT '文档类型（folder文件夹,file文件,doc_lib文档库）',
  `csf_level` INT(2) NULL DEFAULT NULL COMMENT '文件密级,5~15，如果是文件夹，则为0',
  `doc_name` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文件名称',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_detail_AK_t_wf_doc_audit_detail_apply_idx` ON `t_wf_doc_audit_detail` (`apply_id`);


CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_history`  (
  `id` VARCHAR(50) NOT NULL COMMENT '申请ID',
  `biz_id` VARCHAR(50) NOT NULL COMMENT '业务关联ID，如：AS共享申请ID',
  `doc_id` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `doc_path` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档路径，如：/name/xxx.txt',
  `doc_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '文档类型（folder文件夹,file文件,doc_lib文档库）',
  `csf_level` INT(2) NULL DEFAULT NULL COMMENT '文件密级,5~15，如果是文件夹，则为0',
  `biz_type` VARCHAR(100) NULL DEFAULT NULL COMMENT '业务类型（realname共享给指定用户的申请，anonymous共享给任意用户的申请，sync同步申请，flow流转申请，security定密申请）',
  `apply_type` VARCHAR(100) NOT NULL COMMENT '申请类型（sync同步申请，flow流转申请，perm共享申请，anonymous匿名申请，owner所有者申请，security更改密级申请，inherit更改继承申请）',
  `apply_detail` MEDIUMTEXT NOT NULL COMMENT '申请明细（docLibType文档库ID，accessorId访问者ID，accessorName访问者名称，accessorType访问者类型，allowValue允许权限，denyValue拒绝权限，inherit是否继承权限，expiresAt有效期，opType操作类型，linkUrl链接地址，title链接标题，password密码，accessLimit访问次数）',
  `proc_def_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程定义ID',
  `proc_def_name` VARCHAR(300) NULL DEFAULT NULL COMMENT '流程定义名称',
  `proc_inst_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程实例ID',
  `apply_user_id` VARCHAR(50) NOT NULL COMMENT '申请人ID',
  `apply_user_name` VARCHAR(150) NULL DEFAULT NULL COMMENT '申请人名称',
  `apply_time` DATETIME(0) NOT NULL COMMENT '申请时间',
  `audit_status` INT(10) NOT NULL COMMENT '审核状态，1-审核中 2-已拒绝 3-已通过 4-自动审核通过 5-作废  6-发起失败',
  `audit_result` VARCHAR(10) NULL DEFAULT NULL COMMENT '审核结果，pass-通过 reject-拒绝',
  `audit_msg` VARCHAR(2400) NULL DEFAULT NULL COMMENT '最后一次审核意见，默认为审核意见，当审核状态为6时代表发起失败异常码，异常码包含：S0001未配置审核策略;S0002无匹配审核员;S0003无匹配的审核员（发起人与审核人为同一人);S0004无匹配密级审核员',
  `audit_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '审核模式（tjsh-同级审核，hqsh-汇签审核，zjsh-逐级审核）',
  `auditor` TEXT NULL COMMENT '审核员，冗余字段，用于页面展示(id审核人ID，name审核人名称，status审核状态，auditDate审核时间)',
  `last_update_time` DATETIME(0) NULL DEFAULT NULL COMMENT '最后一次修改时间',
  `doc_names` VARCHAR(2000) NULL DEFAULT NULL COMMENT '文档名称',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_b89573ef_AK_t_wf_doc_audit_history_proc_inst_idx` ON `t_wf_doc_audit_history` (`proc_inst_id`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_history_AK_t_wf_doc_audit_history_biz_idx` ON `t_wf_doc_audit_history` (`biz_id`);
CREATE INDEX IF NOT EXISTS `idx_b89573ef_AK_t_wf_doc_audit_history_apply_user_id_idx` ON `t_wf_doc_audit_history` (`apply_user_id`, `audit_status`, `biz_type`, `last_update_time`);


CREATE TABLE IF NOT EXISTS `t_wf_doc_share_strategy`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键',
  `doc_id` VARCHAR(200) NULL DEFAULT NULL COMMENT '文档库ID',
  `doc_name` VARCHAR(300) NULL DEFAULT NULL COMMENT '文档库名称',
  `doc_type` VARCHAR(100) NULL DEFAULT NULL COMMENT '文档库类型，个人文档库：user_doc_lib；部门文档库：department_doc_lib；自定义文档库：custom_doc_lib; 知识库: knowledge_doc_lib',
  `audit_model` VARCHAR(100) NOT NULL COMMENT '审核模式，同级审核：tjsh；汇签审核：hqsh；逐级审核：zjsh；',
  `proc_def_id` VARCHAR(300) NOT NULL COMMENT '流程定义ID',
  `proc_def_name` VARCHAR(300) NOT NULL COMMENT '流程定义名称',
  `act_def_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程环节ID',
  `act_def_name` VARCHAR(300) NULL DEFAULT NULL COMMENT '流程环节名称',
  `create_user_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人ID',
  `create_user_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人名称',
  `create_time` DATETIME(0) NOT NULL COMMENT '创建时间',
  `strategy_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '策略类型，指定用户审核：named_auditor；部门审核员：dept_auditor；连续多级部门审核：multilevel',
  `rule_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '规则类型，角色：role',
  `rule_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '规则ID',
  `level_type` VARCHAR(100) NULL DEFAULT NULL COMMENT '匹配级别类型，直属部门向上一级：belongUp1；直属部门向上二级：belongUp2；直属部门向上三级：belongUp3；直属部门向上四级：belongUp4；直属部门向上五级：belongUp5；直属部门向上六级：belongUp6；直属部门向上七级：belongUp7；直属部门向上八级：belongUp8；直属部门向上九级：belongUp9；直属部门向上十级：belongUp10；最高级部门审核员：highestLevel；最高级部门向下一级：highestDown1；最高级部门向下二级：highestDown2；最高级部门向下三级：highestDown3；最高级部门向下四级：highestDown4；最高级部门向下五级：highestDown5；最高级部门向下六级：highestDown6；最高级部门向下七级：highestDown7；最高级部门向下八级：highestDown8；最高级部门向下九级：highestDown9；最高级部门向下十级：highestDown10；',
  `no_auditor_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '未匹配到部门审核员类型，自动拒绝：auto_reject；自动通过：auto_pass',
  `repeat_audit_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '同一审核员重复审核类型，只需审核一次：once；每次都需要审核：always',
  `own_auditor_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '审核员为发起人自己时审核类型，自动拒绝：auto_reject；自动通过：auto_pass',
  `countersign_switch` VARCHAR(10) NULL DEFAULT NULL COMMENT '是否允许加签 Y-是',
  `countersign_count` VARCHAR(10) NULL DEFAULT NULL COMMENT '允许最大加签次数',
  `countersign_auditors` VARCHAR(10) NULL DEFAULT NULL COMMENT '允许最大加签人数',
  `transfer_switch` VARCHAR(10) NULL DEFAULT NULL COMMENT '转审开关',
  `transfer_count` VARCHAR(10) NULL DEFAULT NULL COMMENT '最大转审次数',
  `perm_config` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '申请人权限配置',
  `strategy_configs` VARCHAR(128) NOT NULL DEFAULT '' COMMENT '新增高级配置统一存放位置',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_cef3b4bc_AK_T_WF_DOC_SHARE_STRATEGY_PROC_DEF_ID_IDX` ON `t_wf_doc_share_strategy` (`proc_def_id`);
CREATE INDEX IF NOT EXISTS `idx_cef3b4bc_AK_T_WF_DOC_SHARE_STRATEGY_ACT_DEF_ID_IDX` ON `t_wf_doc_share_strategy` (`act_def_id`);


CREATE TABLE IF NOT EXISTS `t_wf_doc_share_strategy_auditor`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键',
  `user_id` VARCHAR(300) NOT NULL COMMENT '审核人',
  `user_code` VARCHAR(300) NOT NULL COMMENT '审核人账号',
  `user_name` VARCHAR(300) NOT NULL COMMENT '审核人名称',
  `user_dept_id` VARCHAR(300) NULL DEFAULT NULL COMMENT '审核人部门ID',
  `user_dept_name` VARCHAR(300) NULL DEFAULT NULL COMMENT '审核人部门名称',
  `audit_strategy_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '审核策略ID（t_wf_doc_audit_strategy主键）',
  `audit_sort` INT(11) NULL DEFAULT NULL COMMENT '审核人排序',
  `create_user_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人ID',
  `create_user_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人名称',
  `create_time` DATETIME(0) NOT NULL COMMENT '创建时间',
  `org_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '组织类型',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_12b09c0d_AK_T_WF_DOC_SHARE_STRATEGY_AUDITOR_STRATEGY_ID_IDX` ON `t_wf_doc_share_strategy_auditor` (`audit_strategy_id`);
CREATE INDEX IF NOT EXISTS `idx_12b09c0d_AK_T_WF_DOC_SHARE_STRATEGY_AUDITOR_USER_ID_IDX` ON `t_wf_doc_share_strategy_auditor` (`user_id`);


CREATE TABLE IF NOT EXISTS `t_wf_evt_log`  (
  `log_nr_` BIGSERIAL NOT NULL COMMENT '主键',
  `type_` VARCHAR(64) NULL DEFAULT NULL COMMENT '类型',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程执行ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务ID',
  `time_stamp_` TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '日志时间',
  `user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户ID',
  `data_` LONGBLOB NULL COMMENT '内容',
  `lock_owner_` VARCHAR(255) NULL DEFAULT NULL,
  `lock_time_` TIMESTAMP(0) NULL DEFAULT NULL,
  `is_processed_` TINYINT(4) NULL DEFAULT 0,
  PRIMARY KEY (`log_nr_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_free_audit`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `process_def_key` VARCHAR(30) NULL DEFAULT NULL COMMENT '流程定义key',
  `department_id` VARCHAR(50) NOT NULL COMMENT '部门id',
  `department_name` VARCHAR(600) NOT NULL COMMENT '部门名称',
  `create_user_id` VARCHAR(50) NOT NULL COMMENT '创建人id',
  `create_time` DATETIME(0) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_free_audit_AK_t_wf_free_audit_process_def_keyx` ON `t_wf_free_audit` (`process_def_key`);


CREATE TABLE IF NOT EXISTS `t_wf_ge_bytearray`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '部署的文件名称',
  `deployment_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '部署的ID',
  `bytes_` LONGBLOB NULL COMMENT '大文本类型，存储文本字节流',
  `generated_` TINYINT(4) NULL DEFAULT NULL COMMENT '是否是引擎生成 0为用户生成 1为Activiti生成',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ge_bytearray_ACT_FK_BYTEARR_DEPL` ON `t_wf_ge_bytearray` (`deployment_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_ge_property`  (
  `name_` VARCHAR(64) NOT NULL COMMENT '名称',
  `value_` VARCHAR(300) NULL DEFAULT NULL COMMENT '值',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  PRIMARY KEY (`name_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_hi_actinst`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程执行ID',
  `act_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '活动ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务ID',
  `call_proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '调用外部流程的流程实例ID',
  `act_name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '活动名称',
  `act_type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '活动类型 如startEvent、userTask',
  `assignee_` VARCHAR(255) NULL DEFAULT NULL COMMENT '代理人员',
  `start_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '开始时间',
  `end_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '结束时间',
  `duration_` BIGINT(20) NULL DEFAULT NULL COMMENT '时长，耗时',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `proc_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `proc_title` VARCHAR(300) NULL DEFAULT NULL COMMENT '流程标题',
  `pre_act_id` VARCHAR(255) NULL DEFAULT NULL COMMENT '父级活动ID',
  `pre_act_name` VARCHAR(255) NULL DEFAULT NULL COMMENT '父级活动名称',
  `pre_act_inst_id` VARCHAR(255) NULL DEFAULT NULL COMMENT '父级活动实例ID',
  `create_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '创建时间',
  `last_updated_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_actinst_ACT_IDX_HI_ACT_INST_START` ON `t_wf_hi_actinst` (`start_time_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_actinst_ACT_IDX_HI_ACT_INST_END` ON `t_wf_hi_actinst` (`end_time_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_actinst_ACT_IDX_HI_ACT_INST_PROCINST` ON `t_wf_hi_actinst` (`proc_inst_id_`, `act_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_actinst_ACT_IDX_HI_ACT_INST_EXEC` ON `t_wf_hi_actinst` (`execution_id_`, `act_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_hi_attachment`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户ID',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '附件名称',
  `description_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '描述',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '附件类型',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务Id',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `url_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '附件地址',
  `content_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '内容Id（字节表的ID）',
  `time_` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_hi_comment`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '类型：event（事件）comment（意见）',
  `time_` DATETIME(0) NULL DEFAULT NULL COMMENT '填写时间',
  `user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '填写人',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务Id',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `action_` VARCHAR(255) NULL DEFAULT NULL COMMENT '行为类型 （值为下列内容中的一种：AddUserLink、DeleteUserLink、AddGroupLink、DeleteGroupLink、AddComment、AddAttachment、DeleteAttachment）',
  `message_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '处理意见',
  `full_msg_` LONGBLOB NULL COMMENT '全部消息',
  `display_area` VARCHAR(500) NULL DEFAULT NULL,
  `top_proc_inst_id_` VARCHAR(100) NULL DEFAULT NULL COMMENT '顶级流程实例ID',
  PRIMARY KEY (`id_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_hi_detail`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '类型:（表单：FormProperty；参数：VariableUpdate）',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务实例ID',
  `act_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '活动实例Id',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '名称',
  `var_type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '变量类型',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `time_` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  `bytearray_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '字节数组Id',
  `double_` double NULL DEFAULT NULL COMMENT '存储变量类型为Double',
  `long_` BIGINT(20) NULL DEFAULT NULL COMMENT '存储变量类型为long',
  `text_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '存储变量值类型为String',
  `text2_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '此处存储的是JPA持久化对象时，才会有值。此值为对象ID',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_detail_ACT_IDX_HI_DETAIL_PROC_INST` ON `t_wf_hi_detail` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_detail_ACT_IDX_HI_DETAIL_ACT_INST` ON `t_wf_hi_detail` (`act_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_detail_ACT_IDX_HI_DETAIL_TIME` ON `t_wf_hi_detail` (`time_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_detail_ACT_IDX_HI_DETAIL_NAME` ON `t_wf_hi_detail` (`name_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_detail_ACT_IDX_HI_DETAIL_TASK_ID` ON `t_wf_hi_detail` (`task_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_hi_identitylink`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `group_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户组ID',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户组类型',
  `user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务Id',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_identitylink_ACT_IDX_HI_IDENT_LNK_USER` ON `t_wf_hi_identitylink` (`user_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_identitylink_ACT_IDX_HI_IDENT_LNK_TASK` ON `t_wf_hi_identitylink` (`task_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_identitylink_ACT_IDX_HI_IDENT_LNK_PROCINST` ON `t_wf_hi_identitylink` (`proc_inst_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_hi_procinst`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `business_key_` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义Id',
  `start_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '开始时间',
  `end_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '结束时间',
  `duration_` BIGINT(20) NULL DEFAULT NULL COMMENT '时长',
  `start_user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '发起人员Id',
  `start_act_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '开始节点',
  `end_act_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '结束节点',
  `super_process_instance_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '超级流程实例Id',
  `delete_reason_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '删除理由',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '名称',
  `proc_state` INT(11) NULL DEFAULT NULL COMMENT '流程状态',
  `proc_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `start_user_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '发起人名称',
  `starter_org_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '发起人组织ID',
  `starter_org_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '发起人组织名称',
  `starter` VARCHAR(100) NULL DEFAULT NULL COMMENT '发起人',
  `top_process_instance_id_` VARCHAR(100) NULL DEFAULT NULL COMMENT '顶级流程实例ID',
  PRIMARY KEY (`id_`),
  UNIQUE KEY `idx_t_wf_hi_procinst_PROC_INST_ID_` (`proc_inst_id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_procinst_ACT_IDX_HI_PRO_INST_END` ON `t_wf_hi_procinst` (`end_time_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_procinst_ACT_IDX_HI_PRO_I_BUSKEY` ON `t_wf_hi_procinst` (substring(`business_key_`,1,50));


CREATE TABLE IF NOT EXISTS `t_wf_hi_taskinst`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `task_def_key_` VARCHAR(255) NULL DEFAULT NULL COMMENT '任务定义Key',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '名称',
  `parent_task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '父节点实例ID',
  `description_` VARCHAR(500) NULL DEFAULT NULL,
  `owner_` VARCHAR(255) NULL DEFAULT NULL COMMENT '实际签收人 任务的拥有者',
  `assignee_` VARCHAR(255) NULL DEFAULT NULL COMMENT '代理人',
  `start_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '开始时间',
  `claim_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '提醒时间',
  `end_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '结束时间',
  `duration_` BIGINT(20) NULL DEFAULT NULL COMMENT '时长',
  `delete_reason_` VARCHAR(500) NULL DEFAULT NULL,
  `priority_` INT(11) NULL DEFAULT NULL COMMENT '优先级',
  `due_date_` DATETIME(0) NULL DEFAULT NULL COMMENT '应完成时间',
  `form_key_` VARCHAR(255) NULL DEFAULT NULL COMMENT '表单key',
  `category_` VARCHAR(255) NULL DEFAULT NULL,
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `proc_title` VARCHAR(2000) NULL DEFAULT NULL COMMENT '流程标题',
  `sender` VARCHAR(64) NULL DEFAULT NULL,
  `pre_task_def_key` VARCHAR(64) NULL DEFAULT NULL COMMENT '父级任务定义key',
  `pre_task_id` VARCHAR(64) NULL DEFAULT NULL COMMENT '父级任务ID',
  `pre_task_def_name` VARCHAR(255) NULL DEFAULT NULL COMMENT '父级任务名称',
  `action_type` VARCHAR(64) NULL DEFAULT NULL,
  `top_execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '顶级执行ID',
  `sender_org_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '发送人组织ID',
  `assignee_org_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '代理人组织ID',
  `proc_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `status` VARCHAR(100) NULL DEFAULT NULL COMMENT '审核状态，1-审核中 2-已拒绝 3-已通过 4-自动审核通过 5-作废 6-发起失败 70-已撤销',
  `biz_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '业务主键',
  `doc_id` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `doc_name` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档名称',
  `doc_path` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档路径',
  `addition` MEDIUMTEXT NULL COMMENT '业务字段',
  `message_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息ID',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_taskinst_ACT_IDX_HI_TASK_INST_PROCINST` ON `t_wf_hi_taskinst` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_taskinst_ACT_IDX_HI_TASK_INST_END_TIME` ON `t_wf_hi_taskinst` (`end_time_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_taskinst_ACT_IDX_HI_TASK_DELETE_REASON_` ON `t_wf_hi_taskinst` (`assignee_`, `delete_reason_`);


CREATE TABLE IF NOT EXISTS `t_wf_hi_varinst`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务Id',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '名称',
  `var_type_` VARCHAR(100) NULL DEFAULT NULL COMMENT '变量类型',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `bytearray_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '字节数组ID',
  `double_` double NULL DEFAULT NULL COMMENT '存储DoubleType类型的数据',
  `long_` BIGINT(20) NULL DEFAULT NULL COMMENT '存储LongType类型的数据',
  `text_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '存储变量值类型为String，如此处存储持久化对象时，值jpa对象的class',
  `text2_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '此处存储的是JPA持久化对象时，才会有值。此值为对象ID',
  `create_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  `last_updated_time_` DATETIME(0) NULL DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_varinst_ACT_IDX_HI_PROCVAR_PROC_INST` ON `t_wf_hi_varinst` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_varinst_ACT_IDX_HI_PROCVAR_NAME_TYPE` ON `t_wf_hi_varinst` (`name_`, `var_type_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_hi_varinst_ACT_IDX_HI_PROCVAR_TASK_ID` ON `t_wf_hi_varinst` (`task_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_org`  (
  `org_id` VARCHAR(50) NOT NULL COMMENT '组织编码',
  `org_name` VARCHAR(200) NOT NULL COMMENT '组织简称',
  `org_full_name` VARCHAR(500) NOT NULL COMMENT '组织全称',
  `org_full_path_name` VARCHAR(4000) NULL DEFAULT NULL COMMENT '组织全路径名称',
  `org_full_path_id` VARCHAR(4000) NULL DEFAULT NULL COMMENT '组织全路径ID',
  `org_parent_id` VARCHAR(50) NOT NULL COMMENT '上级组织编码',
  `org_type` VARCHAR(10) NOT NULL COMMENT '组织类型',
  `org_level` INT(11) NOT NULL COMMENT '组织级别',
  `org_area_type` VARCHAR(10) NOT NULL COMMENT '政府单位区域类别',
  `org_sort` INT(11) NULL DEFAULT NULL COMMENT '组织排序号',
  `org_work_phone` VARCHAR(50) NULL DEFAULT NULL COMMENT '组织工作手机号',
  `org_work_address` VARCHAR(1000) NULL DEFAULT NULL COMMENT '组织工作地址',
  `org_principal` VARCHAR(100) NULL DEFAULT NULL COMMENT '组织负责人',
  `org_status` VARCHAR(10) NOT NULL COMMENT '组织状态',
  `org_create_time` date NULL DEFAULT NULL COMMENT '组织创建时间',
  `remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  `fund_code` VARCHAR(20) NULL DEFAULT NULL COMMENT '基金编码',
  `fund_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '基金名称',
  `company_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '公司ID',
  `dept_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '部门ID',
  `dept_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '部门名称',
  `company_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '公司名称',
  `org_branch_leader` VARCHAR(50) NULL DEFAULT NULL COMMENT '分管领导ID',
  PRIMARY KEY (`org_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_procdef_info`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `info_json_id_` VARCHAR(64) NULL DEFAULT NULL,
  CONSTRAINT `ACT_FK_INFO_JSON_BA` FOREIGN KEY (`info_json_id_`) REFERENCES `t_wf_ge_bytearray` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`),
  UNIQUE KEY `idx_t_wf_procdef_info_ACT_UNIQ_INFO_PROCDEF` (`proc_def_id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_procdef_info_ACT_IDX_INFO_PROCDEF` ON `t_wf_procdef_info` (`proc_def_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_procdef_info_ACT_FK_INFO_JSON_BA` ON `t_wf_procdef_info` (`info_json_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_process_error_log`  (
  `pelog_id` VARCHAR(36) NOT NULL COMMENT '主键，GUID',
  `process_instance_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程实例ID',
  `process_title` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程标题',
  `creator` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程发送人',
  `action_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程操作类型',
  `process_msg` MEDIUMTEXT NULL COMMENT '流程消息内容',
  `pelog_create_time` DATETIME(0) NULL DEFAULT NULL COMMENT '记录时间',
  `receivers` VARCHAR(4000) NULL DEFAULT NULL COMMENT '任务接收者',
  `process_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `app_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '应用ID',
  `process_log_level` VARCHAR(20) NULL DEFAULT NULL COMMENT '日志级别，INFO-信息，ERROR异常',
  `retry_status` VARCHAR(2) NULL DEFAULT NULL COMMENT '错误重试状态,y:已处理：n：未处理',
  `error_msg` MEDIUMTEXT NULL COMMENT '异常信息',
  `user_time` VARCHAR(100) NULL DEFAULT NULL COMMENT '耗时（毫秒）',
  PRIMARY KEY (`pelog_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_process_error_log_INDEX_T_WF_ERROR_LOG_APPID` ON `t_wf_process_error_log` (`app_id`, `process_log_level`, `pelog_create_time`);


CREATE TABLE IF NOT EXISTS `t_wf_process_info_config`  (
  `process_def_id` VARCHAR(100) NOT NULL COMMENT '流程定义ID',
  `process_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `process_def_key` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程KEY',
  `process_type_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程类型ID',
  `process_type_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '流程类型名称',
  `process_page_url` VARCHAR(1000) NULL DEFAULT NULL COMMENT '流程表单URL',
  `process_page_info` VARCHAR(4000) NULL DEFAULT NULL COMMENT '流程表单数据',
  `process_start_auth` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程表单起草权限',
  `process_start_isshow` VARCHAR(10) NULL DEFAULT NULL COMMENT '新建流程是否可见，Y-可见，N-不可见',
  `remark` VARCHAR(1000) NULL DEFAULT NULL COMMENT '备注',
  `page_isshow_select_usertree` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '是否展示选人组件',
  `process_handler_class_path` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程处理程序类路径',
  `process_start_order` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '排序号',
  `deployment_id` VARCHAR(64) NULL DEFAULT NULL COMMENT '部署ID',
  `create_time` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  `last_update_time` DATETIME(0) NULL DEFAULT NULL COMMENT '最后一次修改时间',
  `create_user` VARCHAR(50) NULL DEFAULT NULL COMMENT '创建人',
  `create_user_name` VARCHAR(150) NULL DEFAULT NULL COMMENT '创建人名称',
  `last_update_user` VARCHAR(50) NULL DEFAULT NULL COMMENT '最后一次修改人',
  `tenant_id` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `process_mgr_state` VARCHAR(20) NULL DEFAULT NULL COMMENT '流程定义管理状态，UNRELEASE-未发布，UPDATE-修订中，RELEASE-已发布',
  `process_model_sync_state` VARCHAR(10) NULL DEFAULT NULL COMMENT '流程定义与模型同步状态，Y:已同步,N:未同步',
  `process_mgr_isshow` VARCHAR(10) NULL DEFAULT NULL COMMENT '流程定义管理状态：Y:可见，N:不可见',
  `aris_code` VARCHAR(100) NULL DEFAULT NULL COMMENT 'arisr流程编码',
  `c_protocl` VARCHAR(50) NULL DEFAULT NULL COMMENT 'PC端协议',
  `m_protocl` VARCHAR(50) NULL DEFAULT NULL COMMENT '移动端协议',
  `m_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '移动端待办地址',
  `other_sys_deal_status` VARCHAR(10) NULL DEFAULT NULL COMMENT '移动端处理状态',
  `template` VARCHAR(10) NULL DEFAULT NULL COMMENT '是否是流程模板 Y-是',
  PRIMARY KEY (`process_def_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_re_deployment`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '部署包的名称',
  `category_` VARCHAR(255) NULL DEFAULT NULL COMMENT '类型',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户',
  `deploy_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '部署时间',
  PRIMARY KEY (`id_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_re_model`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '模型的名称：比如：收文管理',
  `key_` VARCHAR(255) NULL DEFAULT NULL COMMENT '模型的关键字，流程引擎用到。比如：FTOA_SWGL',
  `category_` VARCHAR(255) NULL DEFAULT NULL COMMENT '类型，用户自己对流程模型的分类。',
  `create_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '创建时间',
  `last_update_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '最后修改时间',
  `version_` INT(11) NULL DEFAULT NULL COMMENT '版本，从1开始。',
  `meta_info_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '数据源信息，比如：\n            {"name":"FTOA_SWGL","revision":1,"description":"丰台财政局OA，收文管理流程"}',
  `deployment_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '部署ID',
  `editor_source_value_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '编辑源值ID',
  `editor_source_extra_value_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '编辑源额外值ID（外键ACT_GE_BYTEARRAY ）',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户',
  `model_state` VARCHAR(10) NULL DEFAULT NULL COMMENT '状态',
  CONSTRAINT `ACT_FK_MODEL_DEPLOYMENT` FOREIGN KEY (`deployment_id_`) REFERENCES `t_wf_re_deployment` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_MODEL_SOURCE` FOREIGN KEY (`editor_source_value_id_`) REFERENCES `t_wf_ge_bytearray` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_MODEL_SOURCE_EXTRA` FOREIGN KEY (`editor_source_extra_value_id_`) REFERENCES `t_wf_ge_bytearray` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_re_model_ACT_FK_MODEL_SOURCE` ON `t_wf_re_model` (`editor_source_value_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_re_model_ACT_FK_MODEL_SOURCE_EXTRA` ON `t_wf_re_model` (`editor_source_extra_value_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_re_model_ACT_FK_MODEL_DEPLOYMENT` ON `t_wf_re_model` (`deployment_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_re_procdef`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `category_` VARCHAR(255) NULL DEFAULT NULL COMMENT '流程命名空间（该编号就是流程文件targetNamespace的属性值）',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '流程名称（该编号就是流程文件process元素的name属性值）',
  `key_` VARCHAR(255) NULL DEFAULT NULL COMMENT '流程编号（该编号就是流程文件process元素的id属性值）',
  `version_` INT(11) NOT NULL COMMENT '流程版本号（由程序控制，新增即为1，修改后依次加1来完成的）',
  `deployment_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '部署表ID',
  `resource_name_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '资源文件名称',
  `dgrm_resource_name_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '图片资源文件名称',
  `description_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '描述信息',
  `has_start_form_key_` TINYINT(4) NULL DEFAULT NULL COMMENT '是否从key启动（start节点是否存在formKey 0否  1是）',
  `has_graphical_notation_` TINYINT(4) NULL DEFAULT NULL,
  `suspension_state_` INT(11) NULL DEFAULT NULL COMMENT '是否挂起 1激活 2挂起',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `org_id_` VARCHAR(100) NULL DEFAULT NULL COMMENT '组织ID',
  PRIMARY KEY (`id_`),
  UNIQUE KEY `idx_t_wf_re_procdef_ACT_UNIQ_PROCDEF` (`key_`, `version_`, `tenant_id_`)
);



CREATE TABLE IF NOT EXISTS `t_wf_role`  (
  `role_id` VARCHAR(50) NOT NULL COMMENT '角色ID',
  `role_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '角色名称',
  `role_type` VARCHAR(20) NULL DEFAULT NULL COMMENT '角色类型',
  `role_sort` INT(11) NULL DEFAULT NULL COMMENT '角色排序号',
  `role_org_id` INT(11) NULL DEFAULT NULL COMMENT '角色组织ID',
  `role_app_id` VARCHAR(500) NULL DEFAULT NULL COMMENT '角色所属租户',
  `role_status` VARCHAR(10) NOT NULL COMMENT '角色状态',
  `role_create_time` DATETIME(0) NULL DEFAULT NULL COMMENT '角色创建时间',
  `role_creator` VARCHAR(50) NULL DEFAULT NULL COMMENT '角色创建者',
  `remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  `template` VARCHAR(10) NULL DEFAULT NULL COMMENT '是否是流程模板 Y-是',
  PRIMARY KEY (`role_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_ru_event_subscr`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `event_type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '事件类型',
  `event_name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '事件名称',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程执行ID',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `activity_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '活动ID',
  `configuration_` VARCHAR(255) NULL DEFAULT NULL COMMENT '配置信息',
  `created_` TIMESTAMP(0) NOT NULL DEFAULT current_timestamp(0) COMMENT '创建时间',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_event_subscr_ACT_IDX_EVENT_SUBSCR_CONFIG_` ON `t_wf_ru_event_subscr` (`configuration_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_event_subscr_ACT_FK_EVENT_EXEC` ON `t_wf_ru_event_subscr` (`execution_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_ru_execution`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `business_key_` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `parent_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '父节点实例ID',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `super_exec_` VARCHAR(64) NULL DEFAULT NULL,
  `act_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '节点实例ID即ACT_HI_ACTINST中ID',
  `is_active_` TINYINT(4) NULL DEFAULT NULL COMMENT '是否存活',
  `is_concurrent_` TINYINT(4) NULL DEFAULT NULL COMMENT '是否为并行',
  `is_scope_` TINYINT(4) NULL DEFAULT NULL,
  `is_event_scope_` TINYINT(4) NULL DEFAULT NULL,
  `suspension_state_` INT(11) NULL DEFAULT NULL COMMENT '挂起状态   1激活 2挂起',
  `cached_ent_state_` INT(11) NULL DEFAULT NULL COMMENT '缓存结束状态',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '名称',
  `lock_time_` TIMESTAMP(0) NULL DEFAULT NULL,
  `top_process_instance_id_` VARCHAR(100) NULL DEFAULT NULL COMMENT '顶级流程实例ID',
  CONSTRAINT `ACT_FK_EXE_PROCDEF` FOREIGN KEY (`proc_def_id_`) REFERENCES `t_wf_re_procdef` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_EXE_SUPER` FOREIGN KEY (`super_exec_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_execution_ACT_FK_EXE_PROCINST` ON `t_wf_ru_execution` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_execution_ACT_FK_EXE_PARENT` ON `t_wf_ru_execution` (`parent_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_execution_ACT_FK_EXE_SUPER` ON `t_wf_ru_execution` (`super_exec_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_execution_ACT_FK_EXE_PROCDEF` ON `t_wf_ru_execution` (`proc_def_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_execution_ACT_IDX_EXEC_BUSKEY` ON `t_wf_ru_execution` (substring(`business_key_`,1,50));


CREATE TABLE IF NOT EXISTS `t_wf_ru_identitylink`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `group_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户组ID',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户组类型（主要分为以下几种：assignee、candidate、\n\n            owner、starter、participant。即：受让人,候选人,所有者、起动器、参与者）',
  `user_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '用户ID',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务Id',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义Id',
  `org_id_` VARCHAR(100) NULL DEFAULT NULL COMMENT '组织ID',
  CONSTRAINT `ACT_FK_ATHRZ_PROCEDEF` FOREIGN KEY (`proc_def_id_`) REFERENCES `t_wf_re_procdef` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_IDL_PROCINST` FOREIGN KEY (`proc_inst_id_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_identitylink_ACT_IDX_IDENT_LNK_USER` ON `t_wf_ru_identitylink` (`user_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_identitylink_ACT_IDX_IDENT_LNK_GROUP` ON `t_wf_ru_identitylink` (`group_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_identitylink_ACT_IDX_ATHRZ_PROCEDEF` ON `t_wf_ru_identitylink` (`proc_def_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_identitylink_ACT_FK_TSKASS_TASK` ON `t_wf_ru_identitylink` (`task_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_identitylink_ACT_FK_IDL_PROCINST` ON `t_wf_ru_identitylink` (`proc_inst_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_ru_job`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '类型',
  `lock_exp_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '锁定释放时间',
  `lock_owner_` VARCHAR(255) NULL DEFAULT NULL COMMENT '挂起者',
  `exclusive_` TINYINT(1) NULL DEFAULT NULL,
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID',
  `process_instance_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `retries_` INT(11) NULL DEFAULT NULL,
  `exception_stack_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '异常信息ID',
  `exception_msg_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '异常信息',
  `duedate_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '到期时间',
  `repeat_` VARCHAR(255) NULL DEFAULT NULL COMMENT '重复',
  `handler_type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '处理类型',
  `handler_cfg_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '标识',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  CONSTRAINT `ACT_FK_JOB_EXCEPTION` FOREIGN KEY (`exception_stack_id_`) REFERENCES `t_wf_ge_bytearray` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_job_ACT_FK_JOB_EXCEPTION` ON `t_wf_ru_job` (`exception_stack_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_ru_task`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例ID',
  `proc_def_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程定义ID',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '任务名称',
  `parent_task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '父节任务ID',
  `description_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '任务描述',
  `task_def_key_` VARCHAR(255) NULL DEFAULT NULL COMMENT '任务定义key',
  `owner_` VARCHAR(255) NULL DEFAULT NULL COMMENT '拥有者',
  `assignee_` VARCHAR(255) NULL DEFAULT NULL COMMENT '代理人',
  `delegation_` VARCHAR(64) NULL DEFAULT NULL COMMENT '委托类型，DelegationState分为两种：PENDING，RESOLVED。如无委托则为空',
  `priority_` INT(11) NULL DEFAULT NULL COMMENT '优先级别',
  `create_time_` TIMESTAMP(0) NULL DEFAULT NULL COMMENT '创建时间',
  `due_date_` DATETIME(0) NULL DEFAULT NULL COMMENT '执行时间',
  `category_` VARCHAR(255) NULL DEFAULT NULL,
  `suspension_state_` INT(11) NULL DEFAULT NULL COMMENT '暂停状态 1代表激活 2代表挂起',
  `tenant_id_` VARCHAR(255) NULL DEFAULT NULL COMMENT '租户ID',
  `form_key_` VARCHAR(255) NULL DEFAULT NULL,
  `proc_title` VARCHAR(2000) NULL DEFAULT NULL COMMENT '流程标题',
  `sender` VARCHAR(64) NULL DEFAULT NULL,
  `pre_task_def_key` VARCHAR(64) NULL DEFAULT NULL COMMENT '父级任务key',
  `pre_task_id` VARCHAR(64) NULL DEFAULT NULL COMMENT '父级任务ID',
  `pre_task_def_name` VARCHAR(255) NULL DEFAULT NULL COMMENT '父级任务名称',
  `action_type` VARCHAR(64) NULL DEFAULT NULL,
  `sender_org_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '发送人组织ID',
  `assignee_org_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '代理人组织ID',
  `proc_def_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '流程定义名称',
  `biz_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '业务主键',
  `doc_id` TEXT NULL COMMENT '文档ID，如：gns://xxx/xxx',
  `doc_name` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档名称',
  `doc_path` VARCHAR(1000) NULL DEFAULT NULL COMMENT '文档路径',
  `addition` MEDIUMTEXT NULL COMMENT '业务字段',
  CONSTRAINT `ACT_FK_TASK_EXE` FOREIGN KEY (`execution_id_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_TASK_PROCDEF` FOREIGN KEY (`proc_def_id_`) REFERENCES `t_wf_re_procdef` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_TASK_PROCINST` FOREIGN KEY (`proc_inst_id_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_task_ACT_IDX_TASK_PARENT_TASK_ID` ON `t_wf_ru_task` (`parent_task_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_task_ACT_FK_TASK_EXE` ON `t_wf_ru_task` (`execution_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_task_ACT_FK_TASK_PROCINST` ON `t_wf_ru_task` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_task_ACT_FK_TASK_PROCDEF` ON `t_wf_ru_task` (`proc_def_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_task_ACT_IDX_TASK_ASSIGNEE__LIST_IDX` ON `t_wf_ru_task` (`assignee_`, `create_time_`);


CREATE TABLE IF NOT EXISTS `t_wf_ru_variable`  (
  `id_` VARCHAR(64) NOT NULL COMMENT '主键',
  `rev_` INT(11) NULL DEFAULT NULL COMMENT '版本号',
  `type_` VARCHAR(255) NULL DEFAULT NULL COMMENT '编码类型',
  `name_` VARCHAR(255) NULL DEFAULT NULL COMMENT '变量名称',
  `execution_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '执行实例ID,4.9版本改为与task_id_组成联合索引',
  `proc_inst_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '流程实例Id',
  `task_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '任务id',
  `bytearray_id_` VARCHAR(64) NULL DEFAULT NULL COMMENT '字节组ID',
  `double_` double NULL DEFAULT NULL COMMENT '存储变量类型为Double',
  `long_` BIGINT(20) NULL DEFAULT NULL COMMENT '存储变量类型为long',
  `text_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '存储变量值类型为String\n\n            如此处存储持久化对象时，值jpa对象的class',
  `text2_` VARCHAR(4000) NULL DEFAULT NULL COMMENT '此处存储的是JPA持久化对象时，才会有值。此值为对象ID',
  CONSTRAINT `ACT_FK_VAR_BYTEARRAY` FOREIGN KEY (`bytearray_id_`) REFERENCES `t_wf_ge_bytearray` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_VAR_EXE` FOREIGN KEY (`execution_id_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ACT_FK_VAR_PROCINST` FOREIGN KEY (`proc_inst_id_`) REFERENCES `t_wf_ru_execution` (`id_`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  PRIMARY KEY (`id_`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_variable_ACT_IDX_VARIABLE_TASK_ID` ON `t_wf_ru_variable` (`task_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_variable_ACT_FK_VAR_EXE` ON `t_wf_ru_variable` (`execution_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_variable_ACT_FK_VAR_PROCINST` ON `t_wf_ru_variable` (`proc_inst_id_`);
CREATE INDEX IF NOT EXISTS `idx_t_wf_ru_variable_ACT_FK_VAR_BYTEARRAY` ON `t_wf_ru_variable` (`bytearray_id_`);


CREATE TABLE IF NOT EXISTS `t_wf_sys_log`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键id',
  `type` VARCHAR(10) NOT NULL COMMENT '日志类型 info信息，warn警告，error异常',
  `url` VARCHAR(500) NULL DEFAULT NULL COMMENT '接口地址',
  `system_name` VARCHAR(20) NULL DEFAULT NULL COMMENT '系统名称',
  `user_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '访问人ID',
  `msg` VARCHAR(500) NOT NULL COMMENT '信息',
  `ex_msg` TEXT NULL COMMENT '附加信息',
  `create_time` DATETIME(0) NOT NULL DEFAULT current_timestamp(0) COMMENT '创建时间',
  PRIMARY KEY (`id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_type`  (
  `type_id` VARCHAR(50) NOT NULL COMMENT '类型ID',
  `type_name` VARCHAR(50) NOT NULL COMMENT '类型名称',
  `type_parent_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '父类型ID',
  `type_sort` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '排序',
  `app_key` VARCHAR(50) NOT NULL COMMENT '应用key',
  `type_remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`type_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_user`  (
  `user_id` VARCHAR(50) NOT NULL COMMENT '用户ID',
  `user_code` VARCHAR(50) NOT NULL COMMENT '用户编码',
  `user_name` VARCHAR(50) NOT NULL COMMENT '用户姓名',
  `user_sex` VARCHAR(2) NULL DEFAULT NULL COMMENT '用户性别',
  `user_age` INT(11) NULL DEFAULT NULL COMMENT '用户年龄',
  `company_id` VARCHAR(50) NOT NULL COMMENT '直属单位编码',
  `org_id` VARCHAR(50) NOT NULL COMMENT '所属单位编码',
  `user_mobile` VARCHAR(50) NULL DEFAULT NULL COMMENT '用户手机号码',
  `user_mail` VARCHAR(100) NULL DEFAULT NULL COMMENT '用户邮箱',
  `user_work_address` VARCHAR(500) NULL DEFAULT NULL COMMENT '用户工作地址',
  `user_work_phone` VARCHAR(100) NULL DEFAULT NULL COMMENT '用户工作手机号',
  `user_home_addree` VARCHAR(500) NULL DEFAULT NULL COMMENT '用户家庭地址',
  `user_home_phone` VARCHAR(100) NULL DEFAULT NULL COMMENT '用户家庭手机号',
  `position_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '主要岗位',
  `plurality_position_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '兼职岗位',
  `title_id` VARCHAR(1000) NULL DEFAULT NULL COMMENT '主要职务',
  `plurality_title_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '兼职职务',
  `user_type` VARCHAR(10) NULL DEFAULT NULL COMMENT '用户类别',
  `user_status` VARCHAR(10) NOT NULL COMMENT '用户状态',
  `user_sort` INT(11) NULL DEFAULT NULL COMMENT '用户排序',
  `user_pwd` VARCHAR(20) NULL DEFAULT '123456' COMMENT '用户密码',
  `user_create_time` date NULL DEFAULT NULL COMMENT '用户创建时间',
  `user_update_time` TIMESTAMP(0) NOT NULL DEFAULT current_timestamp(0) COMMENT '用户修改时间',
  `user_creator` VARCHAR(30) NULL DEFAULT NULL COMMENT '用户创建者',
  `remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  `dept_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '直属单位编码',
  `company_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '直属单位名称',
  `dept_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '直属单位名称',
  `org_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '所属单位名称',
  PRIMARY KEY (`user_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_user2role`  (
  `role_id` VARCHAR(50) NOT NULL COMMENT '角色ID',
  `user_id` VARCHAR(500) NOT NULL COMMENT '用户ID',
  `remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '备注',
  `user_code` VARCHAR(500) NULL DEFAULT NULL COMMENT '用户编码',
  `user_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '用户名称',
  `org_id` VARCHAR(50) NOT NULL COMMENT '组织ID',
  `org_name` VARCHAR(500) NULL DEFAULT NULL COMMENT '组织名称',
  `sort` INT(11) NULL DEFAULT NULL COMMENT '排序',
  `create_user_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人ID',
  `create_user_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '创建人名称',
  `create_time` DATETIME(0) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`role_id`, `user_id`, `org_id`)
);



CREATE TABLE IF NOT EXISTS `t_wf_countersign_info`  (
  `id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `proc_inst_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程实例ID',
  `task_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '任务ID',
  `task_def_key` VARCHAR(100) NULL DEFAULT NULL COMMENT '任务定义KEY',
  `countersign_auditor` VARCHAR(100) NULL DEFAULT NULL COMMENT '加签的审核员',
  `countersign_auditor_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '加签的审核员名称',
  `countersign_by` VARCHAR(100) NULL DEFAULT NULL COMMENT '加签人',
  `countersign_by_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '加签人名称',
  `reason` VARCHAR(1000) NULL DEFAULT NULL COMMENT '加签原因',
  `batch` DECIMAL(10, 0) NULL DEFAULT NULL COMMENT '批次',
  `create_time` DATETIME(0) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_countersign_info_inst_id_def_key` ON `t_wf_countersign_info` (`proc_inst_id`, `task_def_key`);


CREATE TABLE IF NOT EXISTS `t_wf_transfer_info` (
  `id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `proc_inst_id` VARCHAR(50) NULL DEFAULT NULL COMMENT '流程实例ID',
  `task_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '任务ID',
  `task_def_key` VARCHAR(100) NULL DEFAULT NULL COMMENT '任务定义KEY',
  `transfer_auditor` VARCHAR(100) NULL DEFAULT NULL COMMENT '转审的审核员',
  `transfer_auditor_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '转审的审核员名称',
  `transfer_by` VARCHAR(100) NULL DEFAULT NULL COMMENT '转审人',
  `transfer_by_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '转审人名称',
  `reason` VARCHAR(1000) NULL DEFAULT NULL COMMENT '转审原因',
  `batch` DECIMAL(10,0) NULL DEFAULT NULL COMMENT '批次',
  `create_time` DATETIME(0) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_transfer_info_inst_id_def_key` ON `t_wf_transfer_info` (`proc_inst_id`, `task_def_key`);


CREATE TABLE IF NOT EXISTS `t_wf_outbox` (
  `f_id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `f_topic` VARCHAR(128) NOT NULL COMMENT '消息topic',
  `f_message` LONGTEXT NOT NULL COMMENT '消息内容,json格式字符串',
  `f_create_time` DATETIME(0) NOT NULL COMMENT '消息创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_outbox_f_create_time` ON `t_wf_outbox` (`f_create_time`);


CREATE TABLE IF NOT EXISTS `t_wf_internal_group` (
  `f_id` VARCHAR(40) NOT NULL COMMENT '主键id',
  `f_apply_id` VARCHAR(50) NOT NULL COMMENT '申请id',
  `f_apply_user_id` VARCHAR(40) NOT NULL COMMENT '申请人id',
  `f_group_id` VARCHAR(40) NOT NULL COMMENT '内部组id',
  `f_expired_at` BIGINT DEFAULT -1 COMMENT '创内部组过期时间',
  `f_created_at` BIGINT DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_internal_group_apply_id` ON `t_wf_internal_group` (f_apply_id);
CREATE INDEX IF NOT EXISTS `idx_t_wf_internal_group_expired_at` ON `t_wf_internal_group` (f_expired_at);


CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message (
  id VARCHAR(64) NOT NULL COMMENT '主键ID',
  proc_inst_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '流程实例ID',
  chan VARCHAR(255) NOT NULL DEFAULT '' COMMENT '消息 channel',
  payload MEDIUMTEXT NULL DEFAULT NULL COMMENT '消息 payload',
  ext_message_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息中心消息ID',
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_message_proc_inst_id` ON `t_wf_doc_audit_message` (proc_inst_id);


CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message_receiver (
  id VARCHAR(64) NOT NULL COMMENT '主键ID',
  message_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息ID',
  receiver_id  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '接收者ID',
  handler_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '处理者ID',
  audit_status VARCHAR(10) NOT NULL DEFAULT '' COMMENT '处理状态',
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_message_receiver_message_id` ON `t_wf_doc_audit_message_receiver` (message_id);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_message_receiver_receiver_id` ON `t_wf_doc_audit_message_receiver` (receiver_id);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_message_receiver_handler_id` ON `t_wf_doc_audit_message_receiver` (handler_id);


CREATE TABLE IF NOT EXISTS `t_wf_doc_share_strategy_config` (
  `f_id` VARCHAR(40) NOT NULL COMMENT '主键id',
  `f_proc_def_id` VARCHAR(300) NOT NULL COMMENT '流程定义ID',
  `f_act_def_id` VARCHAR(100) NOT NULL COMMENT '流程环节ID',
  `f_name` VARCHAR(64) NOT NULL COMMENT '字段名称',
  `f_value` VARCHAR(64) NOT NULL COMMENT '字段值',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_share_strategy_config_proc_act_def_id` ON `t_wf_doc_share_strategy_config` (f_proc_def_id, f_act_def_id);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_share_strategy_config_proc_def_id_name` ON `t_wf_doc_share_strategy_config` (f_proc_def_id, f_name);
CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_share_strategy_config_name` ON `t_wf_doc_share_strategy_config` (f_name);


CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_sendback_message` (
  `f_id` VARCHAR(64) NOT NULL COMMENT '主键ID',
  `f_proc_inst_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '流程实例ID',
  `f_message_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息中心消息ID',
  `f_created_at` DATETIME NOT NULL COMMENT '创建时间',
  `f_updated_at` DATETIME NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_sendback_message_proc_inst_id` ON `t_wf_doc_audit_sendback_message` (f_proc_inst_id);


CREATE TABLE IF NOT EXISTS `t_wf_inbox` (
  `f_id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `f_topic` VARCHAR(128) NOT NULL COMMENT '消息topic',
  `f_message` LONGTEXT NOT NULL COMMENT '消息内容,json格式字符串',
  `f_create_time` DATETIME(0) NOT NULL COMMENT '消息创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_inbox_f_create_time` ON `t_wf_inbox` (`f_create_time`);

INSERT INTO `t_wf_ge_property` SELECT 'next.dbid', '1', 1 FROM DUAL WHERE NOT EXISTS(SELECT `value_`, `rev_` FROM `t_wf_ge_property` WHERE `name_`='next.dbid');

INSERT INTO `t_wf_ge_property` SELECT 'schema.history', 'create(7.0.4.7.0)', 1 FROM DUAL WHERE NOT EXISTS(SELECT `value_`, `rev_` FROM `t_wf_ge_property` WHERE `name_`='schema.history');

INSERT INTO `t_wf_ge_property` SELECT 'schema.version', '7.0.4.7.0', 1 FROM DUAL WHERE NOT EXISTS(SELECT `value_`, `rev_` FROM `t_wf_ge_property` WHERE `name_`='schema.version');

INSERT INTO `t_wf_dict` SELECT 'dc10b959-1bb4-4182-baf7-ab16d9409989', 'free_audit_secret_level', NULL, '6', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT `dict_code`, `dict_parent_id`, `dict_name`, `sort`, `status`, `creator_id`, `create_date`, `updator_id`, `update_date`, `app_id`, `dict_value` FROM `t_wf_dict` WHERE `dict_code`='free_audit_secret_level');

INSERT INTO `t_wf_dict` SELECT '3d89e740-df13-4212-92a0-29e674da0e17', 'self_dept_free_audit', NULL, 'Y', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT `dict_code`, `dict_parent_id`, `dict_name`, `sort`, `status`, `creator_id`, `create_date`, `updator_id`, `update_date`, `app_id`, `dict_value` FROM `t_wf_dict` WHERE `dict_code`='self_dept_free_audit');

INSERT INTO `t_wf_dict` SELECT 'bfc1c6cd-1bda-4057-992e-feb624915b0e', 'free_audit_secret_level_enum', NULL, '{"非密": 5,"内部": 6, "秘密": 7,"机密": 8}', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT `dict_code`, `dict_parent_id`, `dict_name`, `sort`, `status`, `creator_id`, `create_date`, `updator_id`, `update_date`, `app_id`, `dict_value` FROM `t_wf_dict` WHERE `dict_code`='free_audit_secret_level_enum');

INSERT INTO `t_wf_dict` SELECT 'eaa1b91c-c53c-4113-a066-3e2690c36eae', 'anonymity_auto_audit_switch', NULL, 'n', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', NULL FROM DUAL WHERE NOT EXISTS(SELECT `dict_code`, `dict_parent_id`, `dict_name`, `sort`, `status`, `creator_id`, `create_date`, `updator_id`, `update_date`, `app_id`, `dict_value` FROM `t_wf_dict` WHERE `dict_code`='anonymity_auto_audit_switch');

INSERT INTO `t_wf_dict` SELECT '706601cd-948b-4e4b-9265-3ada83d23326', 'rename_auto_audit_switch', NULL, 'n', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', NULL FROM DUAL WHERE NOT EXISTS(SELECT `dict_code`, `dict_parent_id`, `dict_name`, `sort`, `status`, `creator_id`, `create_date`, `updator_id`, `update_date`, `app_id`, `dict_value` FROM `t_wf_dict` WHERE `dict_code`='rename_auto_audit_switch');

