package com.aishu.wf.core.engine.util;

public class WorkFlowContants {
	public static final String WF_PAGE_INPUT_PREFIX = "wf_";
	public static final String START_OPEN_PAGE_TYPE = "1";
	public static final String TODO_OPEN_PAGE_TYPE = "2";
	public static final String ZAIBAN_OPEN_PAGE_TYPE = "3";
	public static final String FINISH_OPEN_PAGE_TYPE = "4";
	/**
	 * 流转线属性-当前任务的输出活动排序号
	 */
	public static final String TRANSITION_DISPLAY_ORDER = "TRANSITION_DISPLAY_ORDER";
	/**
	 * 流转线属性-返回经办人
	 */
	public static final String TRANSITION_RETURN_FORMER = "TRANSITION_RETURN_FORMER";
	/**
	 * 活动属性-同组织机构层次限制
	 */
	public static final String ACTIVITY_USER_SAME_ORG_LEVEL = "ACTIVITY_USER_SAME_ORG_LEVEL";

	public static final String WF_PRE_TASK_DEF_ID_VAR_KEY = "wf_preTaskDefKey";
	public static final String WF_PRE_TASK_DEF_NAME_VAR_KEY = "wf_preTaskDefName";
	public static final String WF_PRE_TASK_ID_VAR_KEY = "wf_preTaskId";
	public static final String WF_BUSINESS_DATA_OBJECT_KEY = "wf_businessDataObject";
	public static final String WF_THROUGH_BUSINESS_DATA_OBJECT_KEY = "wf_throughBizDataObject";
	public static final String WF_CUR_COMMENT_KEY = "wf_curComment";

	public static final String GLOBAL_VARIABLE_PREFIX_KEY = "wf_";

	// 新建流程
	public static final String ACTION_TYPE_LAUCH_PROCESS = "lauch_process";
	// 新建流程暂存
	public static final String ACTION_TYPE_LAUCH_SAVE_PROCESS = "lauch_save_process";
	// 结束流程
	public static final String ACTION_TYPE_END_PROCESS = "end_process";
	// 作废流程
	public static final String ACTION_TYPE_CANCEL_PROCESS = "cancel_process";
	// 执行活动
	public static final String ACTION_TYPE_EXECUTE_ACTIVITY = "execute_activity";
	// 自动活动
	public static final String ACTION_TYPE_AUTO_ACTIVITY = "auto_activity";
	// 撤回活动
	public static final String ACTION_TYPE_CALLBACK_ACTIVITY = "callback_activity";
	// 撤回至开始节点
	public static final String ACTION_TYPE_CALLBACK_START_ACTIVITY = "callback_start_activity";
	// 撤回至上一节点
	public static final String ACTION_TYPE_CALLBACK_PREV_ACTIVITY = "callback_prev_activity";
	// 通过服务任务实现流程贯穿
	public static final String ACTION_TYPE_THROUGH_PROCESS = "through_process";
	// 暂存活动
	public static final String ACTION_TYPE_SAVE_ACTIVITY = "save_activity";

	// 补发并行多实例
	public static final String ACTION_TYPE_ADD_PARALLER_MULTIINSTANCE_ACTIVITY = "add_paraller_multiinstance_activity";
	// 补发多实例
	public static final String ACTION_TYPE_ADD_MULTIINSTANCE_ACTIVITY = "add_multiinstance_activity";
	// 补发串行多实例
	public static final String ACTION_TYPE_ADD_MULTIINSTANCE_SERIAL_ACTIVITY = "add_multiinstance_serial_activity";
	// 撤销多实例
	public static final String ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY = "delete_multiinstance_activity";
	//驳回待办任务
	public static final String ACTION_TYPE_REJECT_ACTIVITY = "reject_activity";
	// 发送信号给RECEIVE环节
	public static final String ACTION_TYPE_SIGNAL_RECEIVE_ACTIVITY = "signel_receive_activity";

	// 转办
		public static final String ACTION_TYPE_RECEIVER_TRANSFER = "receiver_transfer";


	/*public static final Map<String, String> ACTION_TYPE_MAP = new HashMap<String, String>();
	static {
		ACTION_TYPE_MAP.put(ACTION_TYPE_LAUCH_PROCESS, "新建");
		ACTION_TYPE_MAP.put(ACTION_TYPE_LAUCH_SAVE_PROCESS, "新建暂存");
		ACTION_TYPE_MAP.put(ACTION_TYPE_CANCEL_PROCESS, "作废");
		ACTION_TYPE_MAP.put(ACTION_TYPE_EXECUTE_ACTIVITY, "执行");
		ACTION_TYPE_MAP.put(ACTION_TYPE_CALLBACK_ACTIVITY, "撤回");
		ACTION_TYPE_MAP.put(ACTION_TYPE_CALLBACK_START_ACTIVITY, "退回至起草");
		ACTION_TYPE_MAP.put(ACTION_TYPE_CALLBACK_PREV_ACTIVITY, "退回上一步");
		ACTION_TYPE_MAP.put(ACTION_TYPE_SAVE_ACTIVITY, "暂存");
		ACTION_TYPE_MAP.put(ACTION_TYPE_ADD_MULTIINSTANCE_ACTIVITY, "补发");
		ACTION_TYPE_MAP.put(ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY, "撤销");
		ACTION_TYPE_MAP.put(ACTION_TYPE_REJECT_ACTIVITY, "驳回");
		ACTION_TYPE_MAP.put(ACTION_TYPE_SIGNAL_RECEIVE_ACTIVITY, "信号");
		ACTION_TYPE_MAP.put(ACTION_TYPE_RECEIVER_TRANSFER, "转办");
	}*/

	public static final String WF_PROCESS_INPUT_VARIABLE_KEY = "wf_processInputModel";

	public static final String ELEMENT_MULTIINSTANCE = "multiInstance";
	//业务流程贯穿标记
	public static final String IS_THROUGH_BIZ_PROCESS_KEY="IS_THROUGH_BIZ_PROCESS";
	public static final String IS_THROUGH_BIZ_PROCESS_YES="y";
	public static final String IS_THROUGH_BIZ_PROCESS_NO="n";
	public static final String ELEMENT_ASSIGNEE = "assignee";
	public static final String ELEMENT_ASSIGNEE_EL = "${assigneeList}";
	public static final String ELEMENT_ASSIGNEE_LIST = "assigneeList";


	public static final String PROCESS_DEF_DEL_MANAGE_OPT = "deleteProcessDef";

	public static final String ACTIVITY_DEF_CHILD_TYPE="activityDefChildType";
	public static final String PREX_ACTIVITY_DEF_CHILD_TYPE="activiti:activityDefChildType";
	public static final String ACTIVITY_DEF_CHILD_TYPE_THROUGH="through";
	//多实例删除
	public static final String DELETE_TASK_REASON_MULTI_DELETE_KEY="multi_delete";
	//文档删除-触发的待办删除
	public static final String DELETE_TASK_REASON_DOC_DEL_KEY="doc_delete";
	//文档更新-触发的待办删除
	public static final String DELETE_TASK_REASON_DOC_UPT_KEY="doc_update";
	//用户删除-触发的待办删除
	public static final String DELETE_TASK_REASON_USER_DEL_KEY="user_delete";
	//用户更新-触发的待办删除
	public static final String DELETE_TASK_REASON_USER_UPT_KEY="user_update";

	// 实名共享流程定义KEY
	public static final String RENAME_SHARE_PROC_DEF_KEY = "Process_SHARE001";
	// 匿名共享流程定义KEY
	public static final String ANONYMITY_SHARE_PROC_DEF_KEY = "Process_SHARE002";
	// 实名共享流程自动审核开关
	public static final String RENAME_AUTO_AUDIT_SWITCH = "rename_auto_audit_switch";
	// 实名共享流程是否允许加签
	public static final String RENAME_COUNTERSIGN_SWITCH = "rename_countersign_switch";
	// 实名共享流程是否允许加签
	public static final String RENAME_COUNTERSIGN_COUNT = "rename_countersign_count";
	// 实名共享流程允许最大加签次数
	public static final String RENAME_COUNTERSIGN_AUDITORS = "rename_countersign_auditors";
	// 匿名共享流程自动审核开关
	public static final String ANONYMITY_AUTO_AUDIT_SWITCH = "anonymity_auto_audit_switch";
	// 匿名共享流程是否允许加签
	public static final String ANONYMITY_COUNTERSIGN_SWITCH = "anonymity_countersign_switch";
	// 匿名共享流程是否允许加签
	public static final String ANONYMITY_COUNTERSIGN_COUNT = "anonymity_countersign_count";
	// 匿名共享流程允许最大加签次数
	public static final String ANONYMITY_COUNTERSIGN_AUDITORS = "anonymity_countersign_auditors";
	// 当同一个审核员重复审核同一申请时规则类型
	public static final String REPEAT_AUDIT_RULE = "repeat_audit_rule";
	// 当同一个审核员重复审核同一申请时规则类型-只需审核一次
	public static final String REPEAT_AUDIT_RULE_ONCE = "once";
	// 实名共享流程是否允许转审
	public static final String RENAME_TRANSFER_SWITCH = "rename_transfer_switch";
	// 实名共享流程允许加签最大次数
	public static final String RENAME_TRANSFER_COUNT = "rename_treansfer_count";
	// 匿名共享流程是否允许转审
	public static final String ANONYMITY_TRANSFER_SWITCH = "anonymity_transfer_switch";
	// 匿名共享流程允许加签最大次数
	public static final String ANONYMITY_TRANSFER_COUNT = "anonymity_treansfer_count";

}
