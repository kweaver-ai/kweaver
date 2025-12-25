package com.aishu.doc.audit.dao;

import org.apache.ibatis.annotations.Param;

import com.aishu.doc.audit.model.InternalGroupModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

public interface InternalGroupDao extends BaseMapper<InternalGroupModel>{

    int insertInternalGroup(InternalGroupModel internalGroupModel);

    void updateInternalGroup(@Param("apply_id")String apply_id, @Param("expired_at")long expired_at);

    InternalGroupModel selectInternalGroupByApplyID(@Param("apply_id")String apply_id);

    int deleteInternalGroupByapplyID(@Param("apply_id")String apply_id);
}
