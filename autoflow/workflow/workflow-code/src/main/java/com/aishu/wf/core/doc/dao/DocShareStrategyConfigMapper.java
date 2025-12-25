package com.aishu.wf.core.doc.dao;


import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * @description 文档共享审核策略高级配置 Mapper 接口
 * @author siyu.chen
 */
public interface DocShareStrategyConfigMapper extends BaseMapper<DocShareStrategyConfig> {

    List<DocShareStrategyConfig> listDocShareStrategyConfig(@Param("name") String name);

    void deleteDocShareStrategyConfig(@Param("procDefId") String procDefId, @Param("actDefId") String actDefId);
}
