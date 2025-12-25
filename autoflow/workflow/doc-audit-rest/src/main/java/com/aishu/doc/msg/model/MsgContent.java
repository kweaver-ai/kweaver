package com.aishu.doc.msg.model;

import cn.hutool.json.JSONObject;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 流程消息内容对象
 *
 * @author liuchu
 * @since 2021-4-21 10:35:07
 */
@Data
@Builder
@AllArgsConstructor
public class MsgContent {
    /**
     * 访问者名称
     */
    private String accessorname;
    /**
     * 访问者类型
     */
    private String accessortype;
    /**
     * 审核消息
     */
    private String auditmsg;
    /**
     * 审核人名称
     */
    private String auditname;
    /**
     * 审核结果
     */
    private Boolean auditresult;
    /**
     * 允许权限值
     */
    private String[] allow;
    /**
     * 密级
     */
    private Integer csf;
    /**
     * 禁止权限值
     */
    private String[] deny;
    /**
     * 发起人id
     */
    private String id;
    /**
     * 申请id
     */
    private String applyid;
    /**
     * 权限值
     */
    private Integer perm;
    /**
     * 截止时间
     */
    private Long end;
    /**
     * 文档gnsID
     */
    private String gns;
    /**
     * 是否继承
     */
    private Boolean inherit;
    /**
     * 是否为目录
     */
    private Boolean isdir;
    /**
     * 申请人ID
     */
    private String sender;
    /**
     * 申请人名称
     */
    private String senderName;
    /**
     * 审核任务创建时间
     */
    private Long time;
    /**
     * 消息类型
     */
    private Integer type;
    /**
     * 文档路径名称
     */
    private String url;
    /**
     * 文档信息
     */
    private JSONArray docs;

    /**
     * 当前环节定义Id
     */
    private String cur_act_def_id;

    /**
     * 当前环节定义类型
     */
    private String cur_act_def_type;

    /**
     * 当前环节定义Name
     */
    private String cur_act_def_name;
    /**
     * 当前环节实例Id
     */
    private String cur_act_inst_id;
    /**
     * 当前环节实例Name
     */
    private String cur_act_inst_name;
    /**
     * 下一个环节定义ID
     */
    private String next_act_def_id;
    /**
     * 下一个环节定义Name
     */
    private String next_act_def_name;
    /**
     * 下一个环节定义类型
     */
    private String next_act_def_type;
    /**
     * 发送人ID
     */
    private String send_user_id;
    /**
     * 发送人姓名
     */
    private String send_user_name;

    /**
     * 发送人组织ID
     */
    private String send_user_org_id;
    /**
     * 发送人组织ID
     */
    private String send_user_org_name;

    /**
     * 流程创建时间
     */
    private Date create_time;

    /**
     * 流程完成时间
     */
    private Date finish_time;

    /**
     * 流程定义名称
     */
    private String proc_def_name;

    /**
     * 流程标题
     */
    private String proc_title;
    /**
     * 当前环节意见
     */
    private String cur_comment;
    /**
     * 链接地址
     */
    private String link_url;
    /**
     * 业务类型
     */
    private String bizType;
    /**
     * 业务数据对象
     */
    private JSONObject data;
    /**
     * 流程状态
     */
    private String proc_status;
    /**
     * 当前环节审核员信息
     */
    private List<Map<String, Object>> pre_auditors;
    /**
     * 当前环节审核员信息
     */
    private List<Map<String, Object>> cur_auditors;

    /**
     * 文件名
     */
    private String doc_names;

    /**
     * 原始 channel
     */
    private String original_channel;

    /**
     * 催办备注
     */
    private String remark;

    /**
     * 审核员处理结果
     * key: 审核员userid
     * value：审核结果，参考 AuditStatusEnum
     */
    private List<Map<String, Object>> audit_status;

    /**
     * 重新发起标志
     */
    private Boolean send_back;

    /**
     * @description 封装NSQ消息体
     * @author xiashenghui
     * @param msgContent    原生内容
     * @param instanceModel 流程实例对象
     * @updateTime 2022/4/11
     */
    public MsgContent append(MsgContent msgContent, ProcessInstanceModel instanceModel, User user) {
        ProcessInputModel processInputModel = instanceModel.getProcessInputModel();
        msgContent.setCreate_time(instanceModel.getCreateTime());
        msgContent.setFinish_time(instanceModel.getFinishTime());
        msgContent.setProc_def_name(instanceModel.getProcDefName());
        msgContent.setProc_title(processInputModel.getWf_procTitle());
        msgContent.setNext_act_def_name(processInputModel.getWf_nextActDefName());
        msgContent.setCur_comment(processInputModel.getWf_curComment());
        msgContent.setCur_act_inst_name(processInputModel.getWf_curActInstName());
        msgContent.setCur_act_def_id(processInputModel.getWf_curActDefId());
        msgContent.setCur_act_def_type(processInputModel.getWf_curActDefType());
        msgContent.setCur_act_def_name(processInputModel.getWf_curActDefName());
        msgContent.setCur_act_inst_id(processInputModel.getWf_curActInstId());
        msgContent.setCur_act_inst_name(processInputModel.getWf_curActInstName());
        msgContent.setNext_act_def_id(processInputModel.getWf_nextActDefId());
        msgContent.setNext_act_def_type(processInputModel.getWf_nextActDefType());
        msgContent.setSend_user_id(processInputModel.getWf_sendUserId());
        msgContent.setSend_user_name(processInputModel.getWf_sendUserName());
        msgContent.setSend_user_org_id(user.getOrgId());
        msgContent.setSend_user_org_name(user.getOrgName());
        return msgContent;
    }

    public MsgContent appendData(MsgContent msgContent, JSONObject data) {
        msgContent.setData(data);
        return msgContent;
    }

    public MsgContent deepClone() {
        return JSON.parseObject(JSON.toJSONString(this), MsgContent.class);
    }
}
