package com.aishu.wf.core.anyshare.thrift.service;

import com.aishu.wf.core.anyshare.thrift.pool.ThriftPoolFactory;
import com.aishu.wf.core.thrift.exception.ncTException;
import com.aishu.wf.core.thrift.evfs.ncTEVFS.Client;
import lombok.extern.slf4j.Slf4j;
import org.apache.thrift.TException;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.transport.TTransport;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

/**
 * @description 文档thrift远程RPC服务
 * @author hanj
 */
@Slf4j
@Service
public class DocumentThriftService {

    @Resource(name = "documentPoolFactory")
    private ThriftPoolFactory thriftPoolFactory;

    /**
     * @description 获取文档密级
     * @author ouandyang
     * @param  isDir 是否为文件夹
     * @param  docId 文档ID
     * @updateTime 2021/7/28
     */
    public Integer getDocCsfLevelByDocId(boolean isDir, String docId) {
        if (isDir) {
            return this.getDirCsfLevelByDirId(docId);
        } else {
            return this.getFileCsfLevelByDocId(docId);
        }
    }

    /**
     * 获取文件密级
     *
     * @param docId 文档ID
     * @return
     */
    private Integer getFileCsfLevelByDocId(String docId) {
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            int csfLevel = client.GetCSFLevel(docId);
            if (log.isDebugEnabled()) {
                log.debug("获取[{}]成功！！！服务端返回数据:{}", docId, csfLevel);
            }
            return csfLevel;
        } catch (ncTException e) {
            log.warn("获取文件密级失败，异常内容：{}，详情：{}", e.getExpMsg(), e.getErrDetail(), e);
        } catch (TException e) {
            log.warn("根据文件ID获取文件密级失败！文件ID：{}！", docId, e);
        } catch (Exception e) {
            log.warn("从连接池中获取tTransport失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
        return null;
    }

    /**
     * 获取目录密级
     *
     * @param dirId 目录ID
     * @return
     */
    private Integer getDirCsfLevelByDirId(String dirId) {
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            int csfLevel = client.GetDirCSFLevel(dirId);
            if (log.isDebugEnabled()) {
                log.debug("获取[{}]成功！！！服务端返回数据:{}", dirId, csfLevel);
            }
            return csfLevel;
        } catch (ncTException e) {
            log.warn("获取目录密级失败，异常内容：{}，详情：{}", e.getExpMsg(), e.getErrDetail(), e);
        } catch (TException e) {
            log.warn("根据目录ID获取目录密级失败！目录ID：{}！", dirId, e);
        } catch (Exception e) {
            log.warn("从连接池中获取tTransport失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
        return null;
    }

}
