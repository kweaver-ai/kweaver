package com.aishu.wf.core.common.model.dto;

import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

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
public class OperationLogDTO {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("obj_id")
    private String objId;

    @JsonProperty("additional_info")
    private String additionInfo;

    @JsonIgnore
    private ncTLogType logType;

    private ncTLogLevel level;

    @JsonProperty("op_type")
    private Integer opType;

    private Long date;

    private String ip;

    private String mac;

    private String msg;

    @JsonProperty("ex_msg")
    private String exMsg;

    @JsonProperty("user_agent")
    private String userAgent;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("out_biz_id")
    private String outBizId;

    @JsonProperty("user_type")
    private String userType;

    @JsonProperty("dept_paths")
    private String ParentDeps;
}
