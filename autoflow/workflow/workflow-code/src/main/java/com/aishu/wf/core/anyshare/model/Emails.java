package com.aishu.wf.core.anyshare.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * @description 爱数邮箱数据对象
 * @author ouandyang
 */
@Setter
@Getter
public class Emails {

    /**
     * 用户邮箱
     */
    private List<EmailInfo> user_emails;

    /**
     * 部门邮箱
     */
    private List<EmailInfo> department_emails;

}
