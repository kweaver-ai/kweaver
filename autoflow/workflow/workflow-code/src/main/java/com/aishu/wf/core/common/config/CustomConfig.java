package com.aishu.wf.core.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @description 自定义配置
 * @author hanj
 */
@Data
@Component
@ConfigurationProperties(prefix = "my")
public class CustomConfig {

    /**
     * 跨域配置开关，默认为允许跨域
     **/
    private Boolean crossOriginSwitch = Boolean.TRUE;

    /**
     * 流程租户ID
     */
    private String tenantId;

    /**
     * 共享审核员过滤自己发起的流程
     */
    private Boolean shareAuditorFilteringInitiatedBySelf;

    /**
     * 审核员过滤自己发起的流程
     */
    private Boolean auditorFilteringInitiatedBySelf;

}
