package com.aishu.doc.audit.rest;

import com.aishu.doc.audit.model.dto.DirListDTO;
import com.aishu.doc.audit.model.dto.DocumentDTO;
import com.aishu.doc.audit.service.DocumentService;
import com.aishu.doc.audit.vo.DirListVO;
import com.aishu.doc.audit.vo.DocumentVO;
import com.aishu.doc.audit.vo.FolderDownloadVO;
import com.aishu.wf.core.common.model.BaseRest;
import com.alibaba.fastjson.JSONObject;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

/**
 * @description 文档预览下载
 * @author hanj
 */
@Slf4j
@Api(tags = "文档服务")
@RestController
@RequestMapping(value = "/document")
public class DocumentRest extends BaseRest {

    @Autowired
    DocumentService documentService;


    @ApiOperation(value = "文件下载", notes = "包含审核员权限判断，1.当类型为我的申请时，判断当前用户是否为申请者  \\n 2.当类型为我的待办时，判断当前用户是否为审核员且用户密级大于文档密级")
    @PostMapping(value = "/download", produces = "application/json; charset=UTF-8")
    public DocumentVO osDownload(@ApiParam(name = "documentDTO", value = "文件下载查询对象")@RequestBody DocumentDTO documentDTO, HttpServletRequest request) {
        String readAs = documentService.readPolicy(documentDTO, this.getToken(request));
        JSONObject downloadResult = documentService.osDownloadManage(documentDTO, this.getUserId(), this.getToken(request), readAs);
        return DocumentVO.builder(readAs, downloadResult);
    }

    @ApiOperation(value = "浏览目录协议", notes = "包含审核员权限判断，1.当类型为我的申请时，判断当前用户是否为申请者  \\n 2.当类型为我的待办时，判断当前用户是否为审核员且用户密级大于文档密级")
    @PostMapping(value = "/dir/list", produces = "application/json; charset=UTF-8")
    public DirListVO dirList(@ApiParam(name = "dirListDTO", value = "文件下载查询对象")
                                  @RequestBody DirListDTO dirListDTO) {
        return documentService.selectDirList(dirListDTO, this.getUserId());
    }

    @ApiOperation(value = "递归浏览目录协议", notes = "包含审核员权限判断，1.当类型为我的申请时，判断当前用户是否为申请者  \\n 2.当类型为我的待办时，判断当前用户是否为审核员且用户密级大于文档密级")
    @PostMapping(value = "/dirs/list", produces = "application/json; charset=UTF-8")
    public DirListVO dirsList(@ApiParam(name = "dirListDTO", value = "文件下载查询对象")
                             @RequestBody DirListDTO dirListDTO) {
        return documentService.selectAllDirList(dirListDTO, this.getUserId());
    }

    @ApiOperation(value = "文件夹下载", notes = "")
    @PostMapping(value = "/folder/download", produces = "application/json; charset=UTF-8")
    public FolderDownloadVO folderDownload(@ApiParam(name = "dirListDTO", value = "文件下载查询对象")
                              @RequestBody DirListDTO dirListDTO, HttpServletRequest request) {
        FolderDownloadVO folderDownloadVO = documentService.selectFolderDownload(dirListDTO, this.getUserId(), this.getToken(request));
        return folderDownloadVO;
    }

}
