package com.aishu.wf.api.log;

import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;

import cn.hutool.core.util.StrUtil;

/**
 * @description 增加免审核部门操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.ADD_FREE_AUDIT_DEPT_LOG)
public class AddFreeAuditDeptLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    DictService dictService;

    @Autowired
    private I18nController i18n;

    private final static String exMsgTemplate = "{}；{}";

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
        return log;
    }

    /**
     * @description 构建操作描述
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    protected String buildMsg(Object[] args) {
        FreeAuditModel freeAuditModel = (FreeAuditModel) args[0];
        return StrUtil.format(isSecret() ? i18n.getMessage("secretCreateAutomaticApproval") : i18n.getMessage("createAutomaticApproval"), freeAuditModel.getDepartmentName());
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    protected String buildExMsg(Object[] args) {
        Dict dict = dictService.findDictByCode(DocConstants.FREE_AUDIT_SECRET_LEVEL);
        FreeAuditModel freeAuditModel = (FreeAuditModel) args[0];
        return StrUtil.format(exMsgTemplate,
                freeAuditModel.getDepartmentName(), (dict == null ? null : dict.getDictName()));
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
