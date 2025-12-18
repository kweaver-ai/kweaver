package com.aishu.wf.core.anyshare.thrift.service;

import com.aishu.wf.core.anyshare.thrift.pool.ThriftPoolFactory;
import com.aishu.wf.core.thrift.eacplog.ncTEACPLog.Client;
import com.aishu.wf.core.thrift.eacplog.ncTLogItem;
import lombok.extern.slf4j.Slf4j;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.transport.TTransport;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

/**
 * @description 日志thrift远程RPC服务
 * @author hanj
 */
@Slf4j
@Service
public class EacplogThriftService {

    @Resource(name = "eacpLogPoolFactory")
    private ThriftPoolFactory thriftPoolFactory;

    /**
     * 保存日志
     *
     * @param
     * @return
     */
    public void saveEacpLog(ncTLogItem logItem) {
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            client.Log(logItem);
            if (log.isDebugEnabled()) {
                log.debug("保存日志成功！！！");
            }
        } catch (Exception e) {
            log.warn("远程调用爱数thrift接口保存日志失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
    }

}
