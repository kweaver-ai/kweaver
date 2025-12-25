package com.aishu.wf.core.common.util;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.model.dto.LogBaseDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import sun.net.util.IPAddressUtil;

import javax.servlet.http.HttpServletRequest;

/**
 * Request工具类
 *
 * @author Liuchu
 * @since 2021-3-31 14:58:09
 */
public class RequestUtils {

    private RequestUtils() {
    }

    public static HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest();
        }
        return null;
    }

    public static String getUserId() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return (String) attributes.getRequest().getAttribute(CommonConstants.USER_ID);
        }
        return null;
    }

    public static LogBaseDTO getLogBase() {
        LogBaseDTO logBaseDTO = new LogBaseDTO();
        String userId = RequestUtils.getUserId();
        HttpServletRequest request = RequestUtils.getRequest();
        if (request != null) {
            String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
            logBaseDTO.setUserAgent(userAgent);
            String ip = getIpAddress(request);
            logBaseDTO.setIp(ip);
        }
        logBaseDTO.setUserId(userId);

        return logBaseDTO;
    }

    public static String getIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String ip = request.getHeader("x-forwarded-for");
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("x-real-ip");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (StrUtil.isNotBlank(ip) && ip.contains(StrUtil.COMMA)) {
            for (String ipStr : StrUtil.split(ip, StrUtil.COMMA)) {
                if (IPAddressUtil.isIPv4LiteralAddress(ipStr)) {
                    ip = ipStr;
                    break;
                }
            }
        }
        return StrUtil.trim(ip);
    }

}
