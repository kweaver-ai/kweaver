package com.aishu.doc.audit.dao;

import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;


/**
 * @description 文件审核明细
 * @author xiashenghui
 */
public interface DocAuditDetailDao extends BaseMapper<DocAuditDetailModel>{
    @Override
    List<DocAuditDetailModel> selectList(Wrapper<DocAuditDetailModel> queryWrapper);
}
