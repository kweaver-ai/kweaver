// package com.aishu.wf.api.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import springfox.documentation.builders.ApiInfoBuilder;
// import springfox.documentation.builders.PathSelectors;
// import springfox.documentation.builders.RequestHandlerSelectors;
// import springfox.documentation.spi.DocumentationType;
// import springfox.documentation.spring.web.plugins.Docket;
// import springfox.documentation.swagger2.annotations.EnableSwagger2;

// /**
//  * @description API接口文件配置类
//  * @author hanj
//  */
// @Configuration
// @EnableSwagger2
// public class Knife4jConfiguration {

//     /**
//      * @description 初始化OpenApi配置
//      * @author hanj
//      * @updateTime 2021/5/13
//      */
//     @Bean
//     public Docket openApi3() {
//         return new Docket(DocumentationType.SWAGGER_2)
//                 .apiInfo(new ApiInfoBuilder()
//                         .title("Workflow")
//                         .description("API to access AnyShare\\r\\n\\r\\n如有任何疑问，可到开发者社区提问：https://developers.aishu.cn")
//                         .version("7.0.1")
//                         .build())
//                 .select()
//                 //这里指定Controller扫描包路径
//                 .apis(RequestHandlerSelectors.basePackage("com.aishu.wf.api.rest"))
//                 .paths(PathSelectors.any())
//                 .build();
//     }
// }
