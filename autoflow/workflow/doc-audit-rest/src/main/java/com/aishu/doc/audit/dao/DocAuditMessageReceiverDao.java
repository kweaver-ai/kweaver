package com.aishu.doc.audit.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.aishu.doc.audit.model.DocAuditMessageReceiverModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

public interface DocAuditMessageReceiverDao extends BaseMapper<DocAuditMessageReceiverModel> {
    List<DocAuditMessageReceiverModel> selectUnhandledReceiversByProcInstId(
            @Param("procInstId") String procInstId);
}
