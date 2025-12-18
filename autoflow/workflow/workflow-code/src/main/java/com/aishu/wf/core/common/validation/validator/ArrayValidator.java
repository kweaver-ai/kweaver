package com.aishu.wf.core.common.validation.validator;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public class ArrayValidator implements ConstraintValidator<ArrayValuable, String> {

    /**
     * 值数组
     */
    private Set<String> values;

    @Override
    public void initialize(ArrayValuable constraintAnnotation) {
        this.values = Arrays.stream(constraintAnnotation.values()).collect(Collectors.toSet());
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if(StrUtil.isEmpty(value) || values.contains(value)){
            return true;
        }
        /*// <2.2.1>校验不通过，自定义提示语句（因为，注解上的 value 是枚举类，无法获得枚举类的实际值）
        context.disableDefaultConstraintViolation(); // 禁用默认的 message 的值
        // 重新添加错误提示语句
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate()
                .replaceAll("\\{value}", values.toString())).addConstraintViolation();*/
        return false;
    }
}
