package com.aishu.wf.api.config;

import javax.annotation.Resource;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.aishu.wf.core.common.config.CustomConfig;
/**
 * @description 请求跨域配置类
 * @author hanj
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

	@Resource
    private CustomConfig customConfig;

    /**
     * @description 增加跨域配置-解决跨域问题
     * @author hanj
     * @param registry 跨域注册
     * @updateTime 2021/5/13
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (customConfig.getCrossOriginSwitch()) {
            registry.addMapping("/**")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .allowedOriginPatterns("*")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .maxAge(3600);
        }
    }

}