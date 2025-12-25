package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/5/25 19:37
 */
@Component(value = OperationLogConstants.UPDATE_SHARE_STRATEGY_LOG)
public class UpdateShareStrategyLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    private I18nController i18n;

    @Autowired
    DictService dictService;

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
        log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
        log.setOpType(this.getOpType());

        LogBaseDTO logBaseDTO = (LogBaseDTO) args[1];
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
        DocShareStrategy shareStrategy = (DocShareStrategy) args[0];
        String procDefKey = shareStrategy.getProcDefId().substring(0, shareStrategy.getProcDefId().indexOf(":"));
        if(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY.equals(procDefKey)){
            return StrUtil.format(i18n.getMessage("editDocumentLibrary")+"”{}“{}"+i18n.getMessage("approvalPolicy"), shareStrategy.getDocName(), i18n.getMessage("shareWithAnyone"));
        }
        return StrUtil.format(i18n.getMessage("editDocumentLibrary")+"”{}“{}"+i18n.getMessage("approvalPolicy"),
                shareStrategy.getDocName(),isSecret() ? i18n.getMessage("secretShareWithUsers") : i18n.getMessage("shareWithUsers"));
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildExMsg(Object[] args) {
        DocShareStrategy shareStrategy = (DocShareStrategy) args[0];
        String auditorNames = "";
        String auditModel = shareStrategy.getAuditModel();
        int level = 1;
        for (DocShareStrategyAuditor auditor : shareStrategy.getAuditorList()) {
            if(StrUtil.isBlank(auditorNames)){
                auditorNames = WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(auditModel) ? "（" + level + i18n.getMessage("level") +  "）" + auditor.getUserName() : auditor.getUserName();
            }else{
                auditorNames += "，" + (WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(auditModel) ? "（" + level + i18n.getMessage("level") +  "）" + auditor.getUserName() : auditor.getUserName());
            }
            level++;
        }
        return StrUtil.format(i18n.getMessage("documentLibrary")+" “{}”；"+i18n.getMessage("approver1")+"“{}”；"+i18n.getMessage("mode1") + "“{}”", shareStrategy.getDocName(), auditorNames, WorkflowConstants.AUDIT_MODEL.getName(shareStrategy.getAuditModel()));
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
