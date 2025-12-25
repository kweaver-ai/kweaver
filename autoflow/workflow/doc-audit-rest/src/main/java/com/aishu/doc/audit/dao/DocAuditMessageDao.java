package com.aishu.doc.audit.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.aishu.doc.audit.model.DocAuditMessageModel;
import com.aishu.doc.audit.model.dto.DocAuditMessageWithReceiversDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

public interface DocAuditMessageDao extends BaseMapper<DocAuditMessageModel> {
    List<DocAuditMessageWithReceiversDTO> selectRemindAuditorMessages(@Param("procInstId") String procInstId,
            @Param("auditorIds") List<String> auditorIds);
}
