package com.aishu.wf.core.common.sys.service;
/*
 * 该类主要负责系统主要业务逻辑的实现,如多表处理的事务操作、权限控制等
 * 该类根据具体的业务逻辑来调用该实体对应的Dao或者多个Dao来实现数据库操作
 * 实际的数据库操作在对应的Dao或其他Dao中实现
 */
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.sys.dao.SysLogDao;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SysLogService extends ServiceImpl<SysLogDao, SysLogBean> {

}
