package com.aishu.wf.core.common.interceptor;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpStatus;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.exception.ErrorInfo;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.CommonConstants;
import com.alibaba.fastjson.JSON;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.file.AccessDeniedException;

/**
 * @description token校验拦截器
 * @author hanj
 */
public class AccessTokenVerificationInterceptor implements HandlerInterceptor {

    private UserManagementOperation userManagementOperation;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
       if (userManagementOperation == null) {
            AnyShareConfig anyShareConfig = (AnyShareConfig) ApplicationContextHolder.getBean("anyShareConfig");
           userManagementOperation = new AnyShareClient(anyShareConfig).getHydraApi();
        }
        if (RequestMethod.OPTIONS.name().equals(request.getMethod())) {
            return true;
        }
        String authorization = request.getHeader(CommonConstants.HEADER_AUTHORIZATION);
        if (StrUtil.isNotBlank(authorization) && authorization.startsWith(CommonConstants.HEADER_BEARER)) {
            try {
                String token = authorization.replace(CommonConstants.HEADER_BEARER, "");
                String userId = userManagementOperation.getUserIdByToken(token);
                if (StrUtil.isBlank(userId)) {
                    throw new AccessDeniedException("token无效");
                }
                request.setAttribute(CommonConstants.USER_ID, userId);
                return true;
            } catch (Exception ignore) {
            }
        }
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=utf-8");
        response.setStatus(HttpStatus.HTTP_UNAUTHORIZED);
        response.getWriter().append(
                JSON.toJSONString(ErrorInfo.result(401000000, "Not authorized.", "token无效")));
        response.flushBuffer();
        return false;
    }

}
