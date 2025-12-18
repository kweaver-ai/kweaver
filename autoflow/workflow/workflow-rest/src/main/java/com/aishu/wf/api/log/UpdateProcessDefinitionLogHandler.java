package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.service.impl.ProcessModelServiceImpl;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @description 处理修改流程定义操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.UPDATE_PROCESS_DEFINITION_LOG)
public class UpdateProcessDefinitionLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    private ProcessModelServiceImpl processModelService;

    @Autowired
    private RoleService roleService;

    @Autowired
    DictService dictService;

    @Autowired
    private I18nController i18n;

    private final static String exMsgTemplate = "";


    /**
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(this.buildMsg(args));
        log.setExMsg(this.buildExMsg(args));
        if(args[10].equals(CommonConstants.TENANT_AS_WORKFLOW)){
            log.setOpType(this.getOpType());
            log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
        }else{
            log.setOpType(ncTDocOperType.NCT_DOT_AUDIT_MGM.getValue());
            log.setLogType(ncTLogType.NCT_LT_OPEARTION);
        }
        LogBaseDTO logBaseDTO = (LogBaseDTO) args[8];
        log.setIp(logBaseDTO.getIp());
        log.setUserId(logBaseDTO.getUserId());
        log.setUserAgent(logBaseDTO.getUserAgent());
        log.setLevel(ncTLogLevel.NCT_LL_INFO);
        return log;
    }

    /**
     * @description 构建操作描述
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildMsg(Object[] args) {
        ProcDefModel model = processModelService.getProcessDefModelByProcDefId((String) args[1]);
        if(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY.equals(model.getKey()) && isSecret()){
            return StrUtil.format(i18n.getMessage("editWorkflow"),  "内部授权审核工作流");
        }
        return StrUtil.format(i18n.getMessage("editWorkflow"),  (model != null ? model.getName() : args[1]));
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildExMsg(Object[] args) {
        String exMsg = StrUtil.format(exMsgTemplate);
        StringBuilder builder = new StringBuilder(exMsg);
        List<DocShareStrategy> docShareStrategyList = (List<DocShareStrategy>) args[3];
        String procDefKey = (String) args[9];
        if (!docShareStrategyList.isEmpty()) {
            if(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY.equals(procDefKey) || WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY.equals(procDefKey) ){
                Map<String, List<DocShareStrategy>> collect = docShareStrategyList.stream()
                        .collect(Collectors.groupingBy(DocShareStrategy::getActDefId));
                collect.forEach((k, v) -> {
                    builder.append(i18n.getMessage("linkName")+"“").append(v.get(0).getActDefName()).append("”；");
                });
            } else {
                for (DocShareStrategy docShareStrategy : docShareStrategyList) {
                    builder.append(i18n.getMessage("linkName")+"“").append(docShareStrategy.getActDefName()).append("”，");
                    String auditorNames = "";
                    int level = 1;
                    for (DocShareStrategyAuditor auditor : docShareStrategy.getAuditorList()) {
                        if(StrUtil.isBlank(auditorNames)){
                            auditorNames = WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(docShareStrategy.getAuditModel()) ? "（" + level + i18n.getMessage("level") +  "）" + auditor.getUserName() : auditor.getUserName();
                        }else{
                            auditorNames += "，" + (WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(docShareStrategy.getAuditModel()) ? "（" + level + i18n.getMessage("level") +  "）" + auditor.getUserName() : auditor.getUserName());
                        }
                        level++;
                    }
                    if(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue().equals(docShareStrategy.getStrategyType())){
                        builder.append(String.format(i18n.getMessage("mode")+"“%s”，"+i18n.getMessage("approverMode")+"“%s”，"+i18n.getMessage("approver")+"“%s”；", WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel()),
                                WorkflowConstants.STRATEGY_TYPE.getName(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue()), auditorNames));
                    } else if (WorkflowConstants.STRATEGY_TYPE.PREDEFINED_AUDITOR.getValue()
                            .equals(docShareStrategy.getStrategyType())) {
                        builder.append(
                                String.format(
                                        i18n.getMessage("mode") + "“%s”，" + i18n.getMessage("approverMode") + "“%s”；",
                                        WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel()),
                                        "仓库管理员"));
                    } else {
                        Role rule = roleService.getRoleById(docShareStrategy.getRuleId());
                        String ruleName = null != rule ? rule.getRoleName() : "";
                        WorkflowConstants.LEVEL_TYPE levelItem = WorkflowConstants.LEVEL_TYPE.getLevelType(docShareStrategy.getLevelType());
                        String levelName = null != levelItem ? levelItem.getName() : "";
                        String noAuditorType = WorkflowConstants.AUTO_PASS.equals(docShareStrategy.getNoAuditorType()) ?  i18n.getMessage("approve") : i18n.getMessage("reject");
                        if(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(docShareStrategy.getStrategyType())){
                            builder.append(String.format(i18n.getMessage("approverMode")+"“%s”，"+i18n.getMessage("deptApproverRule")+"“%s”，"+i18n.getMessage("matchFrom") + i18n.getMessage("continueUntil1")+"“%s”，"+i18n.getMessage("noApprover")+"“%s”，"+i18n.getMessage("sameDepartment")+"“%s”；", WorkflowConstants.STRATEGY_TYPE.getName(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue()),
                                    ruleName, levelName, noAuditorType, WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel())));

                        } else if(WorkflowConstants.STRATEGY_TYPE.MULTILEVEL.getValue().equals(docShareStrategy.getStrategyType())){
                            builder.append(String.format(i18n.getMessage("approverMode")+"“%s”，"+i18n.getMessage("deptApproverRule")+"“%s”，"+i18n.getMessage("matchFrom") + i18n.getMessage("continuousDepartments") + i18n.getMessage("end")+"“%s”，"+i18n.getMessage("isNotMatched")+"“%s”，"+i18n.getMessage("sameDepartment")+"“%s”；", WorkflowConstants.STRATEGY_TYPE.getName(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue()),
                                    ruleName, levelName, noAuditorType, WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel())));
                        }
                    }
                }
            }
        }
        return builder.toString();
    }

    /**
     * @description 获取当前操作的类型
     * @author hanj
     * @param
     * @updateTime 2021/4/30
     */
    protected Integer getOpType() {
        return ncTManagementType.NCT_MNT_AUDIT_MGM.getValue();
    }

    /**
     * @description 获取涉密模式状态
     * @author hanj
     * @updateTime 2022/11/4
     */
    private boolean isSecret() {
        Dict secretDict = dictService.findDictByCode(SecretDTO.DICT_SECRET_SWITCH);
        return null != secretDict && "y".equals(secretDict.getDictName()) ? true : false;
    }

}
