package com.aishu.wf.core.common.interceptor;

import java.io.IOException;
import java.util.*;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.aishu.wf.core.common.util.CommonConstants;

@Component
public class MultiPortFilter implements Filter {
    private static final String prefix = "/api/workflow-rest";

    private static final String[] CHECKROLEPATHS = {
            prefix + CommonConstants.API_VERSION_V1 + "/secret-config",
            prefix + CommonConstants.API_VERSION_V1 + "/email-switch",
            prefix + CommonConstants.API_VERSION_V1 + "/process-model-internal",
            prefix + CommonConstants.API_VERSION_V1 + "/doc-share-strategy-internal"
    };

    @Value("${server.additionalPorts}")
    private String additionalPorts;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        String localPort = String.valueOf(servletRequest.getLocalPort());
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String requestURI = request.getRequestURI();
        List<String> ports = Arrays.asList(additionalPorts.split(","));
        List<String> paths = Arrays.asList(CHECKROLEPATHS);
        if (!ports.contains(localPort) && !paths.contains(requestURI)) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }
        if (ports.contains(localPort) && checkPrefix(paths, requestURI)) {
            filterChain.doFilter(servletRequest, servletResponse);
        } else {
            HttpServletResponse response = (HttpServletResponse) servletResponse;
            response.setContentType("text/html;charset=utf-8");
            response.getWriter().write("404 page not found");
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    public void destroy() {
    }

    private Boolean checkPrefix(List<String> paths, String requestURI) {
        for (String path : paths) {
            if (requestURI.startsWith(path)) {
                return true;
            }
        }
        return false;
    }
}
