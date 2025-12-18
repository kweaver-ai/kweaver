package com.aishu.wf.core.doc.dao;


import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * @description 文档共享审核策略 Mapper 接口
 * @author hanj
 */
public interface DocShareStrategyMapper extends BaseMapper<DocShareStrategy> {

    IPage<DocShareStrategy> findDocShareStrategyPage(IPage<DocShareStrategy> page, @Param("proc_def_id") String proc_def_id,
                                           @Param("doc_names") String[] doc_names, @Param("doc_type") String doc_type, @Param("auditors") String[] auditors);

    List<Map<String, String>> findDocShareStrategyDocId(@Param("procDefId") String procDefId);

    void deleteDocShareStrategyAuditor(@Param("procDefId") String procDefId);

}
