package com.aishu.wf.core.common.config;

import com.aishu.wf.core.common.util.CommonConstants;

import io.swagger.v3.oas.annotations.Hidden;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @description api接口配置
 * @author hanj
 */
@Configuration
public class ApiVersionPrefixConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix(CommonConstants.API_VERSION_V1, c ->
                c.isAnnotationPresent(RestController.class) && !c.isAnnotationPresent(Hidden.class));
    }

}
