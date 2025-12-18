package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.engine.core.model.dto.ThirdAuditConfigDTO;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.springframework.stereotype.Component;

/**
 * @description 处理第三方审核操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.THIRD_AUDIT_LOG)
public class ThirdAuditLogHandler extends AbstractLogHandler implements LogHandler {

    private final static String msgOpenTemplate = "开启 webhook 通知第三方审核";
    private final static String msgCloseTemplate = "关闭 webhook 通知第三方审核";
    private final static String exMsgTemplate = "webhook URL路径 “{}“";


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
    public String buildMsg(Object[] args) {
        StringBuilder builder = new StringBuilder();
        for (Object arg : args) {
            if (arg instanceof ThirdAuditConfigDTO) {
                ThirdAuditConfigDTO thirdAuditConfigRequest = (ThirdAuditConfigDTO) arg;
                if (thirdAuditConfigRequest.getIs_open()) {
                    builder.append(msgOpenTemplate);
                } else {
                    builder.append(msgCloseTemplate);
                }
            }
        }
        return builder.toString();
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildExMsg(Object[] args) {
        StringBuilder builder = new StringBuilder();
        for (Object arg : args) {
            if (arg instanceof ThirdAuditConfigDTO) {
                ThirdAuditConfigDTO thirdAuditConfigRequest = (ThirdAuditConfigDTO) arg;
                if (StrUtil.isNotBlank(thirdAuditConfigRequest.getWebhook_url())) {
                    builder.append(StrUtil.format(exMsgTemplate, thirdAuditConfigRequest.getWebhook_url()));
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
        return ncTManagementType.NCT_MNT_ADD.getValue();
    }

}
