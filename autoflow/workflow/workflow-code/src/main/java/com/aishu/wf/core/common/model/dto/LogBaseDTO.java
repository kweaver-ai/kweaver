package com.aishu.wf.core.common.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作日志数据传输对象
 *
 * @author Liuchu
 * @since 2021-3-31 17:28:13
 */
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class LogBaseDTO {
    private String userId;
    private String ip;
    private String userAgent;
}
