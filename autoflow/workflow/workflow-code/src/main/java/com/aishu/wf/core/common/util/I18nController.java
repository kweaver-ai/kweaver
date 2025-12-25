package com.aishu.wf.core.common.util;

import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.stereotype.Controller;

import java.util.Locale;

/**
 * @program: workflow
 * @description: 国际化工具类
 * @author: xiashenghui
 * @create: 2022-09-29 10:49
 **/
@Controller
public class I18nController {
    private static final Logger LOGGER = LoggerFactory
            .getLogger(I18nController.class);

    private MessageSource messageSource;

    @Autowired
    protected AnyShareConfig anyShareConfig;

    /**
     * @description: 设置国际化参数
     * @author: xiashenghui
     * @create: 2022-09-29 10:49
     **/
    private MessageSource initMessageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        // 设置国际化配置文件相对路径
        messageSource.setBasename("internationalization/message");
        // 设置字符集
        messageSource.setDefaultEncoding("UTF-8");
        // 设置缓存时间
        messageSource.setCacheSeconds(3600);
        return messageSource;
    }

    /**
     * 设置当前的返回信息
     * @param code
     * @return
     */
    public String getMessage(String code) {
        if (messageSource == null) {
            messageSource = initMessageSource();
        }
        String language = anyShareConfig.getLanguage();
        //默认没有就是请求地区的语言
        Locale locale = null;
        if (language.indexOf("en_US") != -1) {
            locale = Locale.ENGLISH;
        } else if (language.indexOf("zh_CN") != -1) {
            locale = Locale.CHINA;
        }else if (language.indexOf("zh_TW") != -1) {
            locale = Locale.TAIWAN;
        }
        //其余的不正确的默认就是本地的语言
        else {
            locale = Locale.CHINA;
        }
        String result = null;
        try {
            result = messageSource.getMessage(code, null, locale);
        } catch (NoSuchMessageException e) {
            LOGGER.warn(e.getMessage());
        }
        if (result == null) {
            return code;
        }
        return result;
    }
}
