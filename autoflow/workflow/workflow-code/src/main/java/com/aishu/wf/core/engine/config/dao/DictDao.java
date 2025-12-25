package com.aishu.wf.core.engine.config.dao;

import com.aishu.wf.core.engine.config.model.Dict;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

import java.io.Serializable;

@Mapper
public interface DictDao extends BaseMapper<Dict> {

    @Override
    Dict selectById(Serializable id);

}
