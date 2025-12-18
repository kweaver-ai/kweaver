package com.aishu.wf.core.common.model;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.exception.ErrorInfo;
import com.aishu.wf.core.common.util.CommonConstants;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import javax.servlet.http.HttpServletRequest;

/**
 * 基础rest类
 * @author ouandyang
 * @date 2021年3月31日
 */
@ApiResponses({
        @ApiResponse(code = 200, message = "接口调用成功"),
        @ApiResponse(code = 400, message = "非法请求", response = ErrorInfo.class),
        @ApiResponse(code = 401, message = "未授权", response = ErrorInfo.class),
        @ApiResponse(code = 403, message = "无法执行此操作", response = ErrorInfo.class),
        @ApiResponse(code = 404, message = "资源错误", response = ErrorInfo.class),
        @ApiResponse(code = 500, message = "内部错误", response = ErrorInfo.class)
})
public abstract class BaseRest {

    /**
     * 获取当前登录用户
     * @return 用户ID
     */
    protected String getUserId() {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        Object userId = null;
        if (request != null) {
            userId = request.getAttribute(CommonConstants.USER_ID, RequestAttributes.SCOPE_REQUEST);
        }
        if (userId != null) {
            return userId.toString();
        }
        throw new RuntimeException("获取用户信息异常，请联系管理员。");
    }

    /**
     * 获取当前登录token
     * @return token
     */
    protected String getToken(HttpServletRequest request) {
        String token = "";
        String authorization = request.getHeader(CommonConstants.HEADER_AUTHORIZATION);
        if (StrUtil.isNotBlank(authorization) && authorization.startsWith(CommonConstants.HEADER_BEARER)) {
            try {
                token = authorization.replace(CommonConstants.HEADER_BEARER, "");
            } catch (Exception ignore) {
            }
        }
        return token;
    }
}
