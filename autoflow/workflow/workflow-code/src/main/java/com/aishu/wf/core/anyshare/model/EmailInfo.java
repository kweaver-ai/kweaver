package com.aishu.wf.core.anyshare.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * @description 邮箱明细对象
 * @author ouandyang
 */
@Setter
@Getter
public class EmailInfo {

    /**
     * 用户ID/部门ID
     */
    private String id;

    /**
     * 用户邮箱地址/部门邮箱地址
     */
    private String email;

}
