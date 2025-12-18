package com.aishu.wf.core.anyshare.thrift.pool;

import lombok.extern.slf4j.Slf4j;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.apache.thrift.transport.TTransportException;

/**
 * @description 文档管理thrift连接池
 * @author hanj
 */
@Slf4j
public class ThriftPoolFactory {
	private final String ip;
	private final int port;
    private final int socketTimeout=10000;

	public ThriftPoolFactory(String ip, int port) {
		this.ip = ip;
		this.port = port;
	}

    /**
     * 从池里获取一个Transport对象
     */
    public TTransport getConnection() throws Exception {
		TSocket transport = null;
		try {
			transport = new TSocket(ip, port);
			transport.setTimeout(socketTimeout);
			if (!transport.isOpen()) {
				transport.open();
			}
		} catch (TTransportException e) {
			log.warn("获取一个Transport对象失败！", e);
		}
		return transport;
    }

	/**
	 * 把一个Transport对象归还到池里
	 */
	public void releaseConnection(TTransport transport) {
		if (transport == null) {
			return;
		}
		transport.close();
	}

}