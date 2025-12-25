package com.aishu.wf.api.log;

import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.dao.FreeAuditDao;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.util.StrUtil;

/**
 * @description 增加免审核部门操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.DELETE_FREE_AUDIT_DEPT_LOG)
public class DeleteFreeAuditDeptLogHandler extends AbstractLogHandler implements LogHandler {

    @Autowired
    DictService dictService;

    @Autowired
    FreeAuditDao freeAuditDeptdao;

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
        FreeAuditModel freeAuditModel = freeAuditDeptdao.selectOne(new LambdaQueryWrapper<FreeAuditModel>()
                .eq(FreeAuditModel::getId, args[0]));
        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(this.buildMsg(freeAuditModel, args));
        log.setExMsg(this.buildExMsg(freeAuditModel, args));
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
    protected String buildMsg(FreeAuditModel freeAuditModel, Object[] args) {
    	if(StringUtils.isEmpty((String)args[0])) {
    		return null;
    	}
        if(freeAuditModel==null) {
    		return null;
    	}
        return StrUtil.format(i18n.getMessage("deleteDepartment") + "“{}”" + (isSecret() ? i18n.getMessage("secretAutomaticApprovalPolicy") : i18n.getMessage("automaticApprovalPolicy")) , freeAuditModel.getDepartmentName());
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    protected String buildExMsg(FreeAuditModel freeAuditModel, Object[] args) {
    	if(StringUtils.isEmpty((String)args[0])) {
    		return null;
    	}
        if(freeAuditModel==null) {
    		return null;
    	}
        String secretLevel = "";
        Dict dict = dictService.findDictByCode(DocConstants.FREE_AUDIT_SECRET_LEVEL);
        if(null != dict) {
            secretLevel = dict.getDictName();
    	}
        return StrUtil.format(exMsgTemplate, freeAuditModel.getDepartmentName(), secretLevel);
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
