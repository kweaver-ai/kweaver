// package com.aishu.doc.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import springfox.documentation.builders.ApiInfoBuilder;
// import springfox.documentation.builders.PathSelectors;
// import springfox.documentation.builders.RequestHandlerSelectors;
// import springfox.documentation.service.Contact;
// import springfox.documentation.spi.DocumentationType;
// import springfox.documentation.spring.web.plugins.Docket;
// import springfox.documentation.swagger2.annotations.EnableSwagger2;

// /**
//  * @description API接口文件配置类
//  * @author ouandyang
//  */
// @Configuration
// @EnableSwagger2
// public class Knife4jConfiguration {

//     /**
//      * @description 初始化OpenApi配置
//      * @author ouandyang
//      * @updateTime 2021/5/13
//      */
//     @Bean
//     public Docket openApi3() {
//         return new Docket(DocumentationType.SWAGGER_2)
//                 .apiInfo(new ApiInfoBuilder()
//                         .title("文档审核接口文档")
//                         .description("文档审核rest对外接口文档")
//                         .contact(new Contact("ouandyang", "", "309026159@qq.com"))
//                         .termsOfServiceUrl("https://www.rzdata.net/")
//                         .version("1.0")
//                         .build())
//                 .select()
//                 //这里指定Controller扫描包路径
//                 .apis(RequestHandlerSelectors.basePackage("com.aishu.doc.audit.rest"))
//                 .paths(PathSelectors.any())
//                 .build();
//     }
// }
