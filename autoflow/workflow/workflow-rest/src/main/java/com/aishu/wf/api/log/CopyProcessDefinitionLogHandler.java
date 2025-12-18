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
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.thrift.eacplog.ncTDocOperType;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * @description 处理复制流程定义操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.COPY_PROCESS_DEFINITION_LOG)
public class CopyProcessDefinitionLogHandler extends AbstractLogHandler implements LogHandler {

    private final static String exMsgTemplate = "";

    @Autowired
    private RoleService roleService;

    @Autowired
    private I18nController i18n;


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
        System.out.println(args[3]);
        if(CommonConstants.TENANT_AS_WORKFLOW.equals(args[3])){
            log.setOpType(this.getOpType());
            log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
        }else{
            log.setOpType(ncTDocOperType.NCT_DOT_AUDIT_MGM.getValue());
            log.setLogType(ncTLogType.NCT_LT_OPEARTION);
        }
        LogBaseDTO logBaseDTO = (LogBaseDTO) args[9];
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
        return StrUtil.format(i18n.getMessage("copyWorkflow") + "”{}“", args[2]);
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
        List<DocShareStrategy> docShareStrategyList = (List<DocShareStrategy>) args[4];
        if (!docShareStrategyList.isEmpty()) {
            for (DocShareStrategy docShareStrategy : docShareStrategyList) {
                builder.append(i18n.getMessage("copiedLinkName") + "“").append(docShareStrategy.getActDefName()).append("”，");
                String auditorNames = "";
                int level = 1;
                for (DocShareStrategyAuditor auditor : docShareStrategy.getAuditorList()) {
                    if(StrUtil.isBlank(auditorNames)){
                        auditorNames = WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(docShareStrategy.getAuditModel()) ? "（" + level + i18n.getMessage("level")+ "）" + auditor.getUserName() : auditor.getUserName();
                    }else{
                        auditorNames += "，" + (WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(docShareStrategy.getAuditModel()) ? "（" + level + i18n.getMessage("level") + "）" + auditor.getUserName() : auditor.getUserName());
                    }
                    level++;
                }
                if(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue().equals(docShareStrategy.getStrategyType())){
                    builder.append(String.format(i18n.getMessage("mode")+"“%s”，"+i18n.getMessage("approverMode")+"“%s”，"+i18n.getMessage("approver")+"“%s”；", WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel()),
                            WorkflowConstants.STRATEGY_TYPE.getName(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue()), auditorNames));
                } else{
                    Role rule = roleService.getRoleById(docShareStrategy.getRuleId());
                    String ruleName = null != rule ? rule.getRoleName() : "";
                    WorkflowConstants.LEVEL_TYPE levelItem = WorkflowConstants.LEVEL_TYPE.getLevelType(docShareStrategy.getLevelType());
                    String levelName = null != levelItem ? levelItem.getName() : "";
                    String noAuditorType = WorkflowConstants.AUTO_PASS.equals(docShareStrategy.getNoAuditorType()) ? i18n.getMessage("approve") : i18n.getMessage("reject");
                    builder.append(String.format(i18n.getMessage("approverMode")+"“%s”，"+i18n.getMessage("deptApproverRule")+"“%s”，"+i18n.getMessage("continueUntil1")+"“%s”，"+i18n.getMessage("matchTheDepartmentAuditor")+"“%s”，" + i18n.getMessage("multipleTheDepartmentAuditor") + "“%s”；", WorkflowConstants.STRATEGY_TYPE.getName(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue()),
                            ruleName, levelName, noAuditorType, WorkflowConstants.AUDIT_MODEL.getName(docShareStrategy.getAuditModel())));
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

}
