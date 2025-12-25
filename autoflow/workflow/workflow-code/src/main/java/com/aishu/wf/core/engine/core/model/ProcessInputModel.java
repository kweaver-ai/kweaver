package com.aishu.wf.core.engine.core.model;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.Data;

/**
 * 流程客户端输入对象
 * @author lw
 *
 */
@Data
public class ProcessInputModel implements java.io.Serializable{
	private static final long serialVersionUID = 1L;
	/**
	 * 流程应用系统
	 */
	private String wf_appId;
	/**
	 * 流程标题
	 */
	private String wf_procTitle;
	/**
	 * 动作处理标识
	 */
	private String wf_actionType;
	/**
	 * 流程定义ID,对应引擎自动生成的ID,规则为(流程定义KEY:版本号:部署ID)
	 */
	private String wf_procDefId;
	/**
	 * 流程定义KEY,对应建模的时候流程定义ID
	 */
	private String wf_procDefKey;
	/**
	 * 动作处理标识
	 */
	private String wf_procDefName;
	/**
	 * 流程实例ID
	 */
	private String wf_procInstId;
	
	/**
	 * 父流程实例ID
	 */
	private String wf_parentProcInstId;
	/**
	 * 当前环节定义Id
	 */
	private String wf_curActDefId;
	
	/**
	 * 当前环节定义类型
	 */
	private String wf_curActDefType;
	
	/**
	 * 当前环节定义Name
	 */
	private String wf_curActDefName;
	/**
	 * 当前环节实例Id
	 */
	private String wf_curActInstId;
	/**
	 * 当前环节实例Name
	 */
	private String wf_curActInstName;
	/**
	 * 下一个环节定义ID	
	 */
	private String wf_nextActDefId;
	/**
	 * 下一个环节定义Name
	 */
	private String wf_nextActDefName;
	/**
	 * 下一个环节定义类型
	 */
	private String wf_nextActDefType;
	/**
	 * 发送人ID
	 */
	private String wf_starter;
	/**
	 * 发送人ID
	 */
	private String wf_sendUserId;
	/**
	 * 发送人ID
	 */
	private String wf_sender;
	/**
	 * 发送人姓名
	 */
	private String wf_sendUserName;
	
	/**
	 * 发送人组织ID
	 */
	private String wf_sendUserOrgId;
	/**
	 * 发送人组织ID
	 */
	private String wf_sendUserOrgName;
	/**
	 * 发送人公司ID
	 */
	private String wf_sendUserCompanyId;
	/**
	 * 接收者列表(user1;user2;user3)
	 */
	private List<ActivityReceiverModel> wf_receivers;
	/**
	 * 接收者列表(user1;user2;user3)
	 */
	private String wf_receiver;
	/**
	 * 流程变量,存在于当前流程实例生命周期中
	 */
	private Map<String,Object> wf_variables=new HashMap<String,Object>();
	
	/**
	 * 页面中需要存储的表单元素，表示为：key:字段ID,value:字段值
	 */
	private Map<String,Object> fields=new HashMap<String,Object>();
	/**
	 * <附件路径+附件名>	页面传的该字段只在新增和修改附件的情况下填写，并且是该环节上的所有附件组合串	(没有附件时候，和没有对附件进行过修改时，该字段不需要)
	 */
	private String wf_attachments;
	/**
	 * 当前环节意见
	 */
	private String wf_curComment;
	/**
	 * 批量处理标识
	 */
	private String wf_batchId;
	/**
	 * 意见展示区域
	 */
	private String wf_commentDisplayArea;
	/**
	 * 流程与业务关联KY
	 */
	private String wf_businessKey;
	/**
	 * 业务数据对象
	 */
	private BusinessDataObject wf_businessDataObject;
	/**
	 * 扩业务的流程数据对象
	 */
	private BusinessDataObject wf_throughBizDataObject;
	/**
	 * 流程待办URL
	 */
	private String wf_uniteworkUrl;
	/**
	 * 桌面端、网页端访问待办详情的方式，指访问该待办采⽤的协议，具体参考统一待办规范
	 */
	private String wf_cportalProtocol ;
	/**
	 * 手机端统一待办处理URL，如果不传，取流程配置的手机端统一待办路径。流程平台在产生待办的时候会在这个URL之后附加流程实例的相关参数
	 */
	private String wf_mportalUrl;
	/**
	 * 手机端访问待办详情的方式，指访问该待办采⽤的协议，具体参考统一待办规范
	 */
	private String wf_mportalProtocol;
	/**
	 * 该属性仅在手机端使用，readonly指该待办在移动端是否只读。具体参考统一待办规范
	 */
	private String wf_otherSysDealStatus;
	/**
	 * 是否前端自动查询出下一步人员,用于ParallelMultiInstanceBehavior初始化人员的判断
	 */
	private boolean wf_webAutoQueryNextUserFlag;
	
	/**
	 * 是否前端自动查询出下一步人员,用于ParallelMultiInstanceBehavior初始化人员的判断
	 */
	private boolean wf_webAutoQueryNextActFlag;
	
	/**
	 * 是否前端自动跳过此节点
	 */
	private boolean wf_webAutoNextActFlag;
	
	private String wf_uniteCategory;
}

