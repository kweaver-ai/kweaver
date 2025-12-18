package com.aishu.wf.core.engine.core.model;

public enum ExceptionErrorCode {
	A1000(1000, "系统内部异常"),
	A1001(1001, "数据库访问异常"),
	B2000(2000, "流程数据异常"),
	B2001(2001, "验证接口输入参数异常"),
	B2002(2002, "流程定义不存在"),
	B2003(2003, "环节定义不存在"),
	B2005(2005, "当前环节后续输出环节不存在"),
	B2006(2006, "流程贯穿绑定流程定义不存在"),
	B2007(2007, "获取经办环节人员异常"),
	B2008(2008, "流程模型解析异常"),
	B2050(2050, "流程执行异常"),
	B2051(2051, "流程实例不存在"),
	B2052(2052, "待办任务不存在"),
	B2053(2053, "流程执行无法找到下一环节"),
	B2054(2054, "流程执行无法找到下一环节执行人"),
	B2055(2055, "此用户的待办数据已办理，请勿重复提交"),
	B2056(2056, "转办任务不允许有多个接收人"),
	B2057(2057, "指定环节节点在历史待办任务表中不存在"),
	B2058(2058, "发送人或发送人组织在数据库中不存在"),
	B2059(2059, "执行人或执行人组织在数据库中不存在"),
	B2060(2060, "根据上一环节待办ID和发送人无法找到当前流程待办"),
	B2061(2061, "待办任务分配人员异常"),
	B2062(2062, "待办任务分配人员异常,人员不能为空"),
	B2063(2063, "待办任务分配人员异常,单环节不允许发送多员"),
	S0001(401000001, "未配置审核策略或审核员，请联系管理员。"),
	S0002(401000002, "无匹配的审核员，请联系管理员。"),
	S0003(401000003, "无匹配的审核员，请联系管理员。"),//发起人是审核员
	S0004(401000004, "无匹配密级的审核员，请联系管理员。"),
	S0005(401000005, "无匹配的审核员，请联系管理员。");// 重复审核员只允许审核一次;

	private Integer errorCode;
	private String errorDesc;
	
	public Integer getErrorCode() {
		return errorCode;
	}

	public String getErrorDesc() {
		return errorDesc;
	}


	ExceptionErrorCode(Integer errorCode, String errorDesc) {
		this.errorCode=errorCode;
		this.errorDesc=errorDesc;
	}
	
	/**
     * @description 是否为下一环节无审核员异常
     * @author ouandyang
     * @updateTime 2022/3/2
     */
	public boolean isNotAuditorErr() {
		return S0001.equals(this) || 
				S0002.equals(this) || 
				S0003.equals(this) || 
				S0004.equals(this) ||
				S0005.equals(this);
	}
	
}
