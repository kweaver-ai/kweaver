package com.aishu.wf.core.doc.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.aishu.wf.core.doc.model.OutBoxModel;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

public interface OutBoxDao extends BaseMapper<OutBoxModel> {
    
    void batchInsertMessage(@Param("boxs") List<OutBoxModel> boxs);
}
