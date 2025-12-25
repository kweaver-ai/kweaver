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

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @description 浏览目录协议返回信息-文件
 * @author ouandyang
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "文件/夹对象")
public class DirListFile {

    @ApiModelProperty(value = "目录中文件/目录的gns路径")
    private String docid;

    @ApiModelProperty(value = "目录中文件/目录的名称，UTF8编码")
    private String name;

    @ApiModelProperty(value = "目录中文件/目录的路径，UTF8编码")
    private String path;

    @ApiModelProperty(value = "目录中文件版本号或目录数据变化标识")
    private String rev;

    @ApiModelProperty(value = "目录中文件的大小，目录大小为-1")
    private Integer size;

    @ApiModelProperty(value = "目录/文件创建的服务端时间")
    private Integer create_time;

    @ApiModelProperty(value = "目录/文件创建者")
    private String creator;

    @ApiModelProperty(value = "目录修改时间/文件上传时间，UTC时间，此为文件上传到服务器时间")
    private Integer modified;

    @ApiModelProperty(value = "目录修改者/文件编辑者")
    private String editor;

    @ApiModelProperty(value = "文件密级，0：默认值，创建文件时文件密级设为创建者密级，覆盖版本时不改 5~15：正常密级 0x7FFF：空密级")
    private Integer csflevel;

    @ApiModelProperty(value = "文件到期提醒时间")
    private Integer duedate;

    @ApiModelProperty(value = "如果是文件，返回由客户端设置的文件本地修改时间 若未设置，返回modified的值")
    private Integer client_mtime;

}
