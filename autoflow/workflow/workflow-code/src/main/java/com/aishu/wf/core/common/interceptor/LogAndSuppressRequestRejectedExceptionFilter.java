package com.aishu.wf.core.common.interceptor;

import com.alibaba.fastjson.JSON;
import com.aishu.wf.core.common.exception.ErrorInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.security.web.firewall.RequestRejectedException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @description 记录和处理别拒绝的请求
 * @author hanj
 */
@Component
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LogAndSuppressRequestRejectedExceptionFilter extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        try {
            chain.doFilter(req, res);
        } catch (RequestRejectedException e) {
            HttpServletRequest request = (HttpServletRequest) req;
            HttpServletResponse response = (HttpServletResponse) res;
            log.warn("request_rejected: remote={}, user_agent={}, request_url={}, message={}", request.getRemoteHost(),
                    request.getHeader(HttpHeaders.USER_AGENT), request.getRequestURL(), e.getMessage(), e);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json; charset=utf-8");
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().append(JSON.toJSONString(
                    ErrorInfo.result(HttpServletResponse.SC_NOT_FOUND, e.getMessage(), "url地址错误"))
            );
            response.flushBuffer();
        }
    }
}