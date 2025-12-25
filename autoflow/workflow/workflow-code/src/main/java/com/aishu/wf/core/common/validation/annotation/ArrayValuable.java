package com.aishu.wf.core.common.validation.annotation;

import com.aishu.wf.core.common.validation.validator.ArrayValidator;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.*;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable.List;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({METHOD, FIELD,ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE})
@Retention(RUNTIME)
@Repeatable(List.class)
@Documented
@Constraint(validatedBy = ArrayValidator.class)
public @interface ArrayValuable {
    String[] values();

    String message() default "{com.aishu.wf.core.common.validation.annotation.ArrayValuable.message}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };

    /**
     * Defines several {@link ArrayValuable} annotations on the same element.
     *
     * @see javax.validation.constraints.NotNull
     */
    @Target({ METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE })
    @Retention(RUNTIME)
    @Documented
    @interface List {

        ArrayValuable[] value();
    }
}
