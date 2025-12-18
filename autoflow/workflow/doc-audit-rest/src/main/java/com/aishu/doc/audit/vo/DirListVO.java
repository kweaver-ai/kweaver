package com.aishu.doc.audit.vo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

/**
 * @description 浏览目录协议返回信息
 * @author ouandyang
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "浏览目录协议对象")
public class DirListVO {

    @ApiModelProperty(value = "文件夹信息")
    private List<DirListFile> dirs;

    @ApiModelProperty(value = "文件信息")
    private List<DirListFile> files;

}
