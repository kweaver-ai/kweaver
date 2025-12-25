package com.aishu.doc.audit.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.dto.DirListDTO;
import com.aishu.doc.audit.model.dto.DocumentDTO;
import com.aishu.doc.audit.vo.*;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.anyshare.client.*;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.thrift.service.DocumentThriftService;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @description 文件服务（供爱数客户端）
 * @author hanj
 */
@Slf4j
@Service
public class DocumentService {

    @Resource
    private AnyShareConfig anyShareConfig;

    @Autowired
    private ProcessInstanceService processInstanceService;

    @Autowired
    UserService userService;

    @Autowired
    TaskService taskService;

    @Autowired
    DocAuditHistoryService docAuditHistoryService;

    @Autowired
    DocumentThriftService documentThriftService;

    EfastApi efastApi;

    DocsetApi docsetApi;

    DocumentApi documentApi;

    DocShareApi docShareApi;

    public static final String MASTER_DOCUMENT = "master_document";
    public static final String SUB_DOCUMENT = "sub_document";
    public static final String NO_POLICY = "no_policy";

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        efastApi = anyShareClient.getEfastApi();
        docsetApi = anyShareClient.getDocsetApi();
        documentApi = anyShareClient.getDocumentApi();
        docShareApi = anyShareClient.getDocShareApi();
    }

    /**
     * @description 获取文件下载地址
     * @author hanj
     * @param  documentDTO
     * @param  auditor
     * @param  readAs
     * @updateTime 2021/6/2
     */
    public JSONObject osDownloadManage(DocumentDTO documentDTO, String auditor, String token, String readAs){
//        // 检查是否有审核权限
        this.checkAuditRole(documentDTO.getType(), documentDTO.getProc_inst_id(), documentDTO.getDoc_id(), auditor);
        Integer docCsfLevel = null;
        if(documentDTO.getType().equals("task") && !StrUtil.isEmpty(documentDTO.getId())){
            DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getById(documentDTO.getId());
            docCsfLevel = docAuditHistoryModel.getCsfLevel();
            cn.hutool.json.JSONObject json = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
            if(docAuditHistoryModel.getBizType().equals(DocConstants.BIZ_TYPE_FLOW) && json.containsKey("docList")){
                JSONArray docList = JSON.parseArray(json.get("docList").toString());
                if(DocConstants.DOC_TYPE_FILE.equals(docAuditHistoryModel.getDocType()) ){
                    documentDTO.setRev(JSONUtil.parseObj(docList.get(0)).get("version").toString());
                }else{
                    for (int i =0 ;i < docList.size() ; i++){
                        if(documentDTO.getDoc_id().equals(JSONUtil.parseObj(docList.get(i)).get("id"))){
                            documentDTO.setRev(JSONUtil.parseObj(docList.get(i)).get("version").toString());
                            break;
                        }
                    }
                }


            }
        }
        // 检查文件密级是否满足条件
        this.checkCsfLevel(false, documentDTO.getDoc_id(), auditor,docCsfLevel);
        JSONObject downloadResult = new JSONObject();
        if(SUB_DOCUMENT.equals(readAs)){
            downloadResult = this.getDownloadAddressSub(documentDTO, token);
        } else if(MASTER_DOCUMENT.equals(readAs) || NO_POLICY.equals(readAs)
            || StrUtil.isBlank(readAs)) {
            downloadResult = this.getDownloadAddressMaster(documentDTO);
        }
        return downloadResult;
    }

    /**
     * @description 获取文件的读取策略
     * @author hanj
     * @param documentDTO documentDTO
     * @updateTime 2021/6/8
     */
    public String readPolicy(DocumentDTO documentDTO, String token){
        String readAs = "";
        JSONObject policyResult = new JSONObject();
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString("");
        builder.queryParam("doc_id", documentDTO.getDoc_id())
                .queryParam("doc_lib_type", documentDTO.getDoc_lib_type())
                .queryParam("accessed_by", "accessed_by_users");
        String queryString = builder.toUriString();
        try {
            policyResult = docShareApi.readPolicy(queryString, token);
            JSONObject readPolicy = JSON.parseObject(policyResult.getString("result"));
            JSONObject download = readPolicy.getJSONObject("download");
            readAs = download.getString("read_as");
        } catch (Exception e) {
            log.warn("获取文件的读取策略失败！postData：{}；policyResult：{}", queryString, policyResult.toJSONString(), e);
        }
        return readAs;
    }

    /**
     * @description 获取主文档的下载地址
     * @author hanj
     * @param  documentDTO
     * @updateTime 2021/6/2
     */
    private JSONObject getDownloadAddressMaster(DocumentDTO documentDTO){
        JSONObject downloadResult = new JSONObject();
        try {
            String postData = JSON.toJSONString(DocumentDTO.builder(documentDTO));

            downloadResult = efastApi.osdownload(postData);
        } catch (Exception e) {
            log.warn("获取主文档的下载地址失败！documentDTO：{}；downloadResult：{}", documentDTO, downloadResult.toJSONString(), e);
        }
        return downloadResult;
    }

    /**
     * @description 获取副文档的下载地址
     * @author hanj
     * @param documentDTO
     * @updateTime 2021/6/2
     */
    private JSONObject getDownloadAddressSub(DocumentDTO documentDTO, String token){
        JSONObject downloadResult = new JSONObject();
        try {
            String docId = documentDTO.getDoc_id();
            downloadResult = docsetApi.docsetDownload(DocUtils.convertDocId(docId), documentDTO.getRev(), token);
            log.info("downloadResult:", downloadResult.toJSONString());
            if(!downloadResult.containsKey("code")){
                return downloadResult;
            }
            if(downloadResult.getString("code").equals("503008001")){
                for(int i = 1; i <= 10; i++){
                    Thread.sleep(2000);
                    downloadResult = docsetApi.docsetDownload(DocUtils.convertDocId(docId),documentDTO.getRev(), token);
                    if(downloadResult.containsKey("url")){
                        return downloadResult;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("获取副文档的下载地址失败！documentDTO：{}；downloadResult：{}", documentDTO, downloadResult.toJSONString(), e);
        }
        return downloadResult;
    }

    /**
     * @description 浏览目录协议
     * @author ouandyang
     * @param  dirListDTO
     * @updateTime 2021/6/2
     */
    public DirListVO selectDirList(DirListDTO dirListDTO, String userId){
        // 检查是否有审核权限
        this.checkAuditRole(dirListDTO.getType(), dirListDTO.getProc_inst_id(), dirListDTO.getDoc_id(), userId);
        // 查找下级文件
        return JSONUtil.toBean(getDirList(dirListDTO), DirListVO.class);
    }

    /**
     * @description 浏览目录协议
     * @author ouandyang
     * @param  dirListDTO
     * @updateTime 2021/6/2
     */
    public DirListVO selectAllDirList(DirListDTO dirListDTO, String userId){
        // 检查是否有审核权限
        DocAuditHistoryModel auditApply = this.checkAuditRole(dirListDTO.getType(), dirListDTO.getProc_inst_id(),
                dirListDTO.getDoc_id(), userId);
        // 递归查找下级文件
        DirListVO result = new DirListVO();
        result.setDirs(new ArrayList<>());
        result.setFiles(new ArrayList<>());
        this.recursiveGetDirList(dirListDTO, result, "");
        // 排除黑名单文件
        result.setFiles(filterBlacklist(auditApply, result.getFiles()));
        return result;
    }

    /**
     * @description 过滤文件黑名单
     * @author ouandyang
     * @param  auditApply 申请数据
     * @param  fileList 文件集合
     * @updateTime 2021/8/24
     */
    private List<DirListFile> filterBlacklist(DocAuditHistoryModel auditApply, List<DirListFile> fileList) {
        JSONObject detail = JSONObject.parseObject(auditApply.getApplyDetail());
        if (detail.get("docBlacklist") != null) {
            List<String> docBlacklist = detail.getJSONArray("docBlacklist").toJavaList(String.class);
            return fileList.stream().filter(item ->
                    !docBlacklist.contains(item.getDocid())).collect(Collectors.toList());
        }
        return fileList;
    }

    /**
     * @description 查找文件夹下载所需对象
     * @author hanj
     * @param dirListDTO dirListDTO
     * @param userId userId
     * @updateTime 2021/7/8
     */
    public FolderDownloadVO selectFolderDownload(DirListDTO dirListDTO, String userId, String token){
        // 检查是否有审核权限
        this.checkAuditRole(dirListDTO.getType(), dirListDTO.getProc_inst_id(), dirListDTO.getDoc_id(), userId);

        // 检查是否有审核权限
        this.checkCsfLevel(true, dirListDTO.getDoc_id(), userId,null);

        // 递归查找下级文件
        FolderDownloadVO result = new FolderDownloadVO();
        this.recursiveFolderDownloadUrl(dirListDTO, result, userId, "", token);
        return result;
    }

    /**
     * @description 递归查找所有目录及目录下文件的下载地址
     * @author hanj
     * @param dirListDTO dirListDTO
     * @param folderDownloadVOList folderDownloadVOList
     * @param userId userId
     * @param folderName folderName
     * @updateTime 2021/7/8
     */
    private void recursiveFolderDownloadUrl(DirListDTO dirListDTO, FolderDownloadVO folderDownloadVOList,
                                            String userId, String folderName, String token) {
        DirListVO result = JSONUtil.toBean(getDirList(dirListDTO), DirListVO.class);
        FolderVO folderVO = new FolderVO();
        List<FolderFileVO> fileDownloadUrlList = new ArrayList<>();
        for (DirListFile file : result.getFiles()){
            String doc_id = file.getDocid();
            FolderFileVO folderFile = new FolderFileVO();
            DocumentDTO documentDTO = new DocumentDTO();
            documentDTO.setDoc_id(doc_id);
            documentDTO.setDoc_lib_type(dirListDTO.getDoc_lib_type());
            documentDTO.setProc_inst_id(dirListDTO.getProc_inst_id());
            documentDTO.setType(dirListDTO.getType());
            String readAs = this.readPolicy(documentDTO, token);
            JSONObject downloadResult = new JSONObject();
            if(SUB_DOCUMENT.equals(readAs)){
                downloadResult = this.getDownloadAddressSub(documentDTO, token);
            } else {
                downloadResult = this.getDownloadAddressMaster(documentDTO);
            }
            DocumentVO documentVO = DocumentVO.builder(readAs, downloadResult);
            String downloadUrl = "";
            if (SUB_DOCUMENT.equals(readAs)) {
                downloadUrl = documentVO.getSubResult().getUrl();
            } else {
                downloadUrl = documentVO.getMasterResult().getAuthrequest().get(1);
            }
            //folderFile.setDownload_url(downloadUrl.indexOf("?") != -1 ? downloadUrl.substring(0, downloadUrl.indexOf("?")) : downloadUrl);
            folderFile.setDownload_url(downloadUrl);
            folderFile.setDoc_id(file.getDocid());
            folderFile.setName(file.getName());
            fileDownloadUrlList.add(folderFile);
        }
        for (DirListFile dir : result.getDirs()) {
            dirListDTO.setDoc_id(dir.getDocid());
            this.recursiveFolderDownloadUrl(dirListDTO, folderDownloadVOList, userId, dir.getName(), token);
        }
        folderVO.setFolder_name(folderName);
        folderVO.setDownload_file_list(fileDownloadUrlList);
        folderDownloadVOList.getFolder_download_list().add(folderVO);
        folderDownloadVOList.setFolder_total(folderDownloadVOList.getFolder_total() + fileDownloadUrlList.size());
    }


    /**
     * @description 递归查找下级文件
     * @author ouandyang
     * @param  dirListDTO
     * @param  dirList
     * @updateTime 2021/7/7
     */
    private void recursiveGetDirList(DirListDTO dirListDTO, DirListVO dirList, String path) {
        DirListVO result = JSONUtil.toBean(getDirList(dirListDTO), DirListVO.class);
        for (DirListFile dir : result.getDirs()) {
            dir.setPath(path + "/" + dir.getName());
            dirList.getDirs().add(dir);
        }
        for (DirListFile file : result.getFiles()) {
            file.setPath(path + "/" + file.getName());
            dirList.getFiles().add(file);
        }
        for (DirListFile dir : result.getDirs()) {
            dirListDTO.setDoc_id(dir.getDocid());
            this.recursiveGetDirList(dirListDTO, dirList, path + "/" + dir.getName());
        }
    }

    /**
     * @description 查找下级文件
     * @author ouandyang
     * @param  dirListDTO
     * @updateTime 2021/7/7
     */
    private String getDirList(DirListDTO dirListDTO) {
        String data = "";
        try {
            data = efastApi.dirList(dirListDTO.getRequestData());
        } catch (Exception e) {
            log.warn("调用浏览目录协议异常！dirListDTO：{}，resultData：{}", JSONUtil.toJsonStr(dirListDTO), data, e);
            throw new RestException(BizExceptionCodeEnum.A500001000.getCode(),
                    BizExceptionCodeEnum.A500001000.getMessage());
        }
        JSONObject json = JSONObject.parseObject(data);
        if (json.containsKey("code") && json.containsKey("message")) {
            throw new RestException(Integer.valueOf(json.getString("code")),
                    json.getString("message"));
        }
        return data;
    }


    /**
     * @description 检查是否有审核权限
     * @author ouandyang
     * @param  type 类型
     * @param  proInstId 流程实例ID
     * @param  userId 用户ID
     * @param  docId 文档ID
     * @updateTime 2021/7/5
     */
    private DocAuditHistoryModel checkAuditRole(String type, String proInstId, String docId, String userId) {
        DocAuditHistoryModel auditApply = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>()
                .eq(DocAuditHistoryModel::getProcInstId, proInstId));
        if(auditApply == null){
            throw new IllegalArgumentException("未找到申请业务数据。");
        }
        boolean isAuthority = processInstanceService.checkAuditAuth(type, proInstId,
                userId, auditApply.getCsfLevel());
        if(!isAuthority){
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        return auditApply;
    }

    /**
     * @description 检查文件密级是否满足条件
     * @author hanj
     * @param isDir isDir
     * @param docId docId
     * @updateTime 2021/7/29
     */
    private void checkCsfLevel(boolean isDir, String docId, String userId,Integer docCsfLevel) {
        User user = userService.getUserById(userId);
        // 获取文档密级
        if(docCsfLevel == null){
            docCsfLevel = documentThriftService.getDocCsfLevelByDocId(isDir, docId);
        }
        if( docCsfLevel == null){
            throw new RestException(BizExceptionCodeEnum.A50001101.getCode(),
                    BizExceptionCodeEnum.A50001101.getMessage());
        }
        if (user.getCsfLevel() == null || user.getCsfLevel() < docCsfLevel) {
            throw new RestException(BizExceptionCodeEnum.A401001102.getCode(),
                    BizExceptionCodeEnum.A401001102.getMessage());
        }
    }

    /**
     * @description 根据文档ID获取文档信息
     * @author ouandyang
     * @param  docId 文档ID
     * @updateTime 2021/8/9
     */
    public JSONObject getDocInfo(String docId) {
        JSONObject result = new JSONObject();
        try {
            String str = efastApi.docInfo(docId);
            result = JSON.parseObject(str);
            if(!result.containsKey("code")){
                return result;
            }
        } catch (Exception e) {
            log.warn("efast===根据文档ID获取文档信息异常==={}", docId, e);
        }
        return result;
    }

    /**
     * @description 根据文档ID获取文档库类型
     * @author ouandyang
     * @param  docId 文档ID
     * @updateTime 2021/8/9
     */
    public String getDocLibType(String docId) {
        try {
            String str = documentApi.docLibInfo(DocUtils.getDocLibIdByDocId(docId));
            JSONObject json = JSON.parseObject(str);
            if(!json.containsKey("code")){
                JSONObject docLib = json.getJSONObject("doc_lib");
                return docLib.getString("type");
            } else {
                throw new RestException(Integer.valueOf(json.getString("code")),
                        json.getString("message"));
            }
        } catch (Exception e) {
            log.warn("document===根据文档ID获取文档库类型异常==={}", docId, e);
        }
        return null;
    }

}
