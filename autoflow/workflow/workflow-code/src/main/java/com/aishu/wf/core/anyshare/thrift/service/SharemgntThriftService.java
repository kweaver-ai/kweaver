package com.aishu.wf.core.anyshare.thrift.service;

import com.aishu.wf.core.anyshare.thrift.pool.ThriftPoolFactory;
import com.aishu.wf.core.thrift.sharemgnt.ncTUsrmDepartmentInfo;
import com.aishu.wf.core.thrift.sharemgnt.ncTUsrmGetUserInfo;
import com.aishu.wf.core.thrift.sharemgnt.sharemgnt.Client;
import lombok.extern.slf4j.Slf4j;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.transport.TTransport;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.nio.ByteBuffer;
import cn.hutool.core.codec.Base64;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.io.FileOutputStream;

/**
 * @description Sharemgnt-thrift远程RPC服务
 * @author ouandyang
 */
@Slf4j
@Service
public class SharemgntThriftService {

    @Resource(name = "sharemgntPoolFactory")
    private ThriftPoolFactory thriftPoolFactory;

    /**
     * @description 发送邮件
     * @author ouandyang
     * @param  toEmailList 目标邮件列表
     * @param  subject 邮件主题
     * @param  content 邮件内容
     * @updateTime 2021/7/14
     */
    public void sendEmail(List<String> toEmailList, String subject, String content) {
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            client.SMTP_SendEmail(toEmailList, subject, content);
            if (log.isDebugEnabled()) {
                log.debug("sendEmail==={toEmailList:{}, subject:{}, content:{}}",
                        toEmailList.toString(), subject, content);
            }
        } catch (Exception e) {
            log.warn("调用爱数thrift接口发送邮件失败！{toEmailList:{}, subject:{}}",toEmailList.toString(), subject, e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
    }

    /**
     * @description 发送带附件的邮件
     * @author yan.nan
     * @param  toEmailList 目标邮件列表
     * @param  subject 邮件主题
     * @param  content 邮件内容
     * @updateTime 2023/6/6
     */
    public void sendEmailWithImage(List<String> toEmailList, String subject, String content, String image) {
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            byte[] imageBytes = Base64.decode(image);
            ByteBuffer buffer = ByteBuffer.wrap(imageBytes);
            client.SMTP_SendEmailWithImage(toEmailList, subject, content, buffer);
            if (log.isDebugEnabled()) {
                log.debug("sendEmail==={toEmailList:{}, subject:{}, content:{}}",
                        toEmailList.toString(), subject, content);
            }
        } catch (Exception e) {
            log.warn("调用爱数thrift接口发送邮件失败！{toEmailList:{}, subject:{}}",toEmailList.toString(), subject, e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
    }

        /**
     * @description 发送带附件的邮件并抛出异常
     * @author siyu.chen
     * @param  toEmailList 目标邮件列表
     * @param  subject 邮件主题
     * @param  content 邮件内容
     * @updateTime 2023/6/6
     */
    public void sendEmailWithImageWithException(List<String> toEmailList, String subject, String content, String image) throws Exception{
        TTransport tTransport = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            byte[] imageBytes = Base64.decode(image);
            ByteBuffer buffer = ByteBuffer.wrap(imageBytes);
            client.SMTP_SendEmailWithImage(toEmailList, subject, content, buffer);
            if (log.isDebugEnabled()) {
                log.debug("sendEmail==={toEmailList:{}, subject:{}, content:{}}",
                        toEmailList.toString(), subject, content);
            }
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
    }

    /**
     * @description 获取三权分立开启状态
     * @author hanj
     * @updateTime 2021/8/23
     */
    public boolean getTriSystemStatus() {
        TTransport tTransport = null;
        boolean result = false;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            result = client.Usrm_GetTriSystemStatus();
            if (log.isDebugEnabled()) {
                log.debug("getTriSystemStatus==={result:{}}",
                        result);
            }
        } catch (Exception e) {
            log.warn("调用爱数thrift接口获取三权分立开启状态失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
        return result;
    }

    /**
     * @description 批量根据部门ID(组织ID)获取部门（组织）父路经
     * @author hanj
     * @updateTime 2021/8/23
     */
    public List<ncTUsrmDepartmentInfo> getDepartmentParentPath(List<String> departIds) {
        TTransport tTransport = null;
        List<ncTUsrmDepartmentInfo> result = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            result = client.Usrm_GetDepartmentParentPath(departIds);
            if (log.isDebugEnabled()) {
                log.debug("getDepartmentParentPath==={result:{}}",
                        result);
            }
        } catch (Exception e) {
            log.warn("调用爱数thrift接口批量根据部门ID(组织ID)获取部门（组织）父路经失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
        return result;
    }

    /**
     * @description 根据用户id获取详细信息
     * @author hanj
     * @updateTime 2021/8/23
     */
    public ncTUsrmGetUserInfo usrmGetUserInfo(String userId) {
        TTransport tTransport = null;
        ncTUsrmGetUserInfo result = null;
        try {
            tTransport = thriftPoolFactory.getConnection();
            Client client = new Client(new TBinaryProtocol(tTransport));
            result = client.Usrm_GetUserInfo(userId);
            if (log.isDebugEnabled()) {
                log.debug("usrmGetUserInfo==={result:{}}",
                        result);
            }
        } catch (Exception e) {
            log.warn("调用爱数thrift接口根据用户id获取详细信息失败！", e);
        } finally {
            thriftPoolFactory.releaseConnection(tTransport);
        }
        return result;
    }

}
