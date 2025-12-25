package com.aishu.wf.core.common.config;

import com.aishu.wf.core.common.interceptor.AccessTokenVerificationInterceptor;
import com.aishu.wf.core.common.util.CommonConstants;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @description Token校验拦截器路径配置
 * @author hanj
 */
@Configuration
public class AccessTokenConfig implements WebMvcConfigurer {

    private static final String[] PATHS = {
            CommonConstants.API_VERSION_V1 + "/process-definition/**",
            CommonConstants.API_VERSION_V1 + "/process-instance/**",
            CommonConstants.API_VERSION_V1 + "/process-model/**",
            CommonConstants.API_VERSION_V1 + "/process-create/**",
            CommonConstants.API_VERSION_V1 + "/task/**",
            CommonConstants.API_VERSION_V1 + "/third-audit/**",
            CommonConstants.API_VERSION_V1 + "/staff/**",
            CommonConstants.API_VERSION_V1 + "/org/**",
            CommonConstants.API_VERSION_V1 + "/doc-flow/**",
            CommonConstants.API_VERSION_V1 + "/doc-share/**",
            CommonConstants.API_VERSION_V1 + "/doc-security/**",
            CommonConstants.API_VERSION_V1 + "/doc-sync/**",
            CommonConstants.API_VERSION_V1 + "/free-audit/**",
            CommonConstants.API_VERSION_V1 + "/document/**",
            CommonConstants.API_VERSION_V1 + "/doc-audit/**",
            CommonConstants.API_VERSION_V1 + "/doc-share-strategy/**",
            CommonConstants.API_VERSION_V1 + "/dept-auditor-rule/**"
    };

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
      registry.addInterceptor(new AccessTokenVerificationInterceptor()).addPathPatterns(PATHS);
    }

}