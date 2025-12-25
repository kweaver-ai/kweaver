package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User2role;
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
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/5/25 19:37
 */
@Component(value = OperationLogConstants.DELETE_DEPT_AUDITOR_RULE_LOG)
public class DeleteDeptAuditorRuleLogHandler extends AbstractLogHandler implements LogHandler {

    private final static String msgTemplate = "删除审核员匹配规则“{}”";
    private final static String exMsgTemplate = "";

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
        Role role = (Role) args[0];
        System.out.println(role);
        if(role!=null && !CommonConstants.TENANT_AS_WORKFLOW.equals(role.getRoleAppId())){
            log.setOpType(ncTDocOperType.NCT_DOT_AUDIT_MGM.getValue());
            log.setLogType(ncTLogType.NCT_LT_OPEARTION);
        }else{
            log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
            log.setOpType(this.getOpType());

        }

        LogBaseDTO logBaseDTO = (LogBaseDTO) args[1];
        log.setIp(logBaseDTO.getIp());
        log.setUserId(logBaseDTO.getUserId());
        log.setUserAgent(logBaseDTO.getUserAgent());
        log.setLevel(ncTLogLevel.NCT_LL_WARN);
        return log;
    }

    /**
     * @description 构建操作描述
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildMsg(Object[] args) {
        Role role = (Role) args[0];
        return StrUtil.format(i18n.getMessage("deleteRule"), role.getRoleName());
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
        Role role = (Role) args[0];
        List<User2role> user2roleList = role.getAuditorList();
        Map<String, List<User2role>> belongUpUserMap = user2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
        for (String orgId : belongUpUserMap.keySet()) {
            List<User2role> auditorList = belongUpUserMap.get(orgId);
            String orgName = "";
            String auditorNames = "";
            for (User2role auditor : auditorList) {
                if(StrUtil.isBlank(auditorNames)){
                    auditorNames = auditor.getUserName();
                }else{
                    auditorNames += "，" + auditor.getUserName();
                }
                orgName = auditor.getOrgName();
            }
            builder.append(i18n.getMessage("deptName") + "“").append(orgName).append("”，").append(i18n.getMessage("approver") + "“").append(auditorNames).append("”；");
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
