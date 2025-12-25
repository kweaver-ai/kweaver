package com.aishu.wf.core.common.util;

import cn.hutool.json.JSON;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.sys.service.SysLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Date;

/**
 * 异常工具类
 * @author ouandyang
 * @date 2021年4月12日
 */
@Slf4j
@Component
public class SysLogUtils {
    public final static String API = "/api/";
    private static String CONTEXT_PATH;
    private static SysLogService sysLogService;

    @Autowired
    public void setSysLogService(SysLogService logService) {
        SysLogUtils.sysLogService = logService;
    }

    @Value("${server.servlet.context-path}")
    public void setContextPath(String contextPath) {
        SysLogUtils.CONTEXT_PATH = contextPath;
    }

    /**
     * 记录系统日志
     * @param sysLogType 日志类型
     * @param url 访问地址
     * @param e 异常
     * @param params 入参
     */
    public static void insertSysLog(String sysLogType, String msg, Exception e, Object... params) {
        try {
//            SysLogBean sysLogBean = SysLogBean.builder()
//                    .type(sysLogType)
//                    .systemName(CONTEXT_PATH.replaceFirst(API, ""))
//                    .userId(RequestUtils.getUserId())
//                    .msg(msg)
//                    .exMsg(String.format("[Params]：%s\n[Exception]：%s",
//                            JSONUtil.toJsonStr(params), getErrmessage(e)))
//                    .createTime(new Date()).build();
//            HttpServletRequest request = RequestUtils.getRequest();
//            if (request != null) {
//                sysLogBean.setUrl(request.getRequestURI());
//            }
//            sysLogService.save(sysLogBean);
        } catch (Exception ex) {
            log.error("Exception logging failed", ex);
        }
    }

    /**
     * 获取异常完整信息
     * @param t
     * @return
     */
    public static String getErrmessage(Throwable t){
        StringWriter stringWriter=new StringWriter();
        t.printStackTrace(new PrintWriter(stringWriter,true));
        return stringWriter.getBuffer().toString();
    }

}
