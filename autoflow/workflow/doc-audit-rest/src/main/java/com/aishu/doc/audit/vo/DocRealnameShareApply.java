package com.aishu.doc.audit.vo;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.audit.model.DocShareModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;

import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * @description 共享给指定用户的申请-消息实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="共享给指定用户的申请-消息实体")
public class DocRealnameShareApply {

	@ApiModelProperty(value = "作废申请ID", example = "12c29bd7-9c09-468e-80a2-1af606f25cpl")
	private String conflict_apply_id;
	
	@NotBlank(message = "apply_id不能为空")
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String apply_id;
	
	@ApiModelProperty(value = "创建人", hidden = true)
	private String user_id;

	@NotBlank(message = "type不能为空")
	@ArrayValuable(values = { DocConstants.SHARED_LINK_PERM, DocConstants.SHARED_LINK_HTTP, DocConstants.CHANGE_OWNER, DocConstants.CHANGE_CSF_LEVEL, DocConstants.CHANGE_INHERIT}, message = "申请类型不正确")
	@ApiModelProperty(value = "申请类型 perm表示共享申请 anonymous表示外链申请 owner表示所有者申请 security表示更改密级申请 inherit表示更改继承申请", example = "perm", required = true)
	private String type;
	
	// @NotBlank
	@ArrayValuable(values = {"create", "modify", "delete"}, message = "权限操作类型不正确")
	@ApiModelProperty(value = "权限操作类型 create表示新增 modify表示编辑 delete表示删除", example = "create", required = true)
	private String operation;
	
	// @NotBlank
	@ApiModelProperty(value = "截止时间；永久有效为-1", example = "2021-01-01 00:00", required = true)
	private String expires_at;


	@ApiModelProperty(value = "是否继承权限 true表示恢复继承权限 false表示禁用继承权限", example = "false")
	private Boolean inherit;

	@Valid
	@ApiModelProperty(value = "文档对象")
	private DocShareApplyDoc doc;

	@Valid
	@ApiModelProperty(value = "访问者对象")
	private DocRealnameShareApplyAccessor accessor;

	@Valid
	@ApiModelProperty(value = "权限")
	private DocRealnameShareApplyPerm perm;

	/**
	 * @description 构建文档审核实体对象
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	public DocAuditApplyModel builderDocAuditApplyModel(){
		this.customVaild();
		DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
				.conflictApplyId(this.getConflict_apply_id())
				.bizId(this.getApply_id())
				.applyUserId(this.getUser_id())
				.applyType(this.getType())
				.docId(this.getDoc().getId())
				.docPath(this.getDoc().getPath())
				.docType(this.getDoc().getType())
				.bizType(DocConstants.BIZ_TYPE_REALNAME_SHARE)
				.procDefKey(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY)
				.build();
		JSONObject detail = JSONUtil.createObj();
		detail.set("docLibType", this.getDoc().getDoc_lib_type());
		if (this.getDoc().getCsf_level() != null) {
			docAuditApplyModel.setCsfLevel(this.getDoc().getCsf_level());
		} else {
			docAuditApplyModel.setCsfLevel(this.getDoc().getMax_csf_level());
		}
		if (this.getAccessor() != null) {
			if (StrUtil.isNotBlank(this.getAccessor().getId())) {
				detail.set("accessorId", this.getAccessor().getId());
			}
			if (StrUtil.isNotBlank(this.getAccessor().getName())) {
				detail.set("accessorName", this.getAccessor().getName());
			}
			if (StrUtil.isNotBlank(this.getAccessor().getType())) {
				detail.set("accessorType", this.getAccessor().getType());
			}
		}
		if (this.getPerm() != null) {
			if (this.getPerm().getAllow() != null) {
				detail.set("allowValue", ArrayUtil.join(this.getPerm().getAllow(), ","));
			}
			if (this.getPerm().getDeny() != null) {
				detail.set("denyValue", ArrayUtil.join(this.getPerm().getDeny(), ","));
			}
		}
		if (this.getInherit() != null) {
			detail.set("inherit", this.getInherit());
		}
		if (StrUtil.isNotBlank(this.getExpires_at())) {
			detail.set("expiresAt", this.getExpires_at());
		}
		if (StrUtil.isNotBlank(this.getOperation())) {
			detail.set("opType", this.getOperation());
		}
		List<DocAuditDetailModel> docAuditDetailModelList = new ArrayList<DocAuditDetailModel>();
		DocShareApplyDoc doc = this.getDoc();
		docAuditDetailModelList.add(DocAuditDetailModel.builder()
					.docId(doc.getId())
					.docPath(doc.getPath())
					.docType(doc.getType())
					.csfLevel(doc.getCsf_level())
					.build());
		docAuditApplyModel.setDocNames(DocUtils.getDocNameByPath(doc.getPath()));
		docAuditApplyModel.setDocAuditDetailModels(docAuditDetailModelList);
		docAuditApplyModel.setApplyDetail(detail.toString());
		return docAuditApplyModel;
	}

	/**
	 * @description 构建文档共享实体对象
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	public DocShareModel builderDocShareModel(){
		this.customVaild();
		DocShareModel docShareModel = DocShareModel.builder()
				.applyId(this.getApply_id())
				.createUserId(this.getUser_id())
				.type(this.getType())
				.docId(this.getDoc().getId())
				.docName(this.getDoc().getPath())
				.docType(this.getDoc().getType())
				.docLibType(this.getDoc().getDoc_lib_type())
				.csfLevel(this.getDoc().getCsf_level())
				.build();
		JSONObject detail = JSONUtil.createObj();
		if (this.getAccessor() != null) {
			if (StrUtil.isNotBlank(this.getAccessor().getId())) {
				detail.set("accessorId", this.getAccessor().getId());
			}
			if (StrUtil.isNotBlank(this.getAccessor().getName())) {
				detail.set("accessorName", this.getAccessor().getName());
			}
			if (StrUtil.isNotBlank(this.getAccessor().getType())) {
				detail.set("accessorType", this.getAccessor().getType());
			}
		}
		if (this.getPerm() != null) {
			if (this.getPerm().getAllow().length > 0) {
				detail.set("allowValue", ArrayUtil.join(this.getPerm().getAllow(), ","));
			}
			if (this.getPerm().getDeny().length > 0) {
				detail.set("denyValue", ArrayUtil.join(this.getPerm().getDeny(), ","));
			}
		}
		if (this.getInherit() != null) {
			detail.set("inherit", this.getInherit());
		}
		if (StrUtil.isNotBlank(this.getExpires_at())) {
			detail.set("expiresAt", this.getExpires_at());
		}
		if (StrUtil.isNotBlank(this.getOperation())) {
			detail.set("opType", this.getOperation());
		}
		docShareModel.setDetail(detail.toString());
		return docShareModel;
	}

	/**
	 * @description 自定义参数校验
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	private void customVaild() {
//		if (StrUtil.isBlank(this.getUser_id())) {
//			throw new IllegalArgumentException("user_id不能为空");
//		}
		if (DocConstants.DOC_TYPE_FILE.equals(this.getDoc().getType()) && this.getDoc().getCsf_level() == null) {
			throw new IllegalArgumentException("csf_level不能为空");
		}
		if (DocConstants.DOC_TYPE_FOLDER.equals(this.getDoc().getType()) && this.getDoc().getMax_csf_level() == null) {
			throw new IllegalArgumentException("max_csf_level不能为空");
		}
		if (DocConstants.CHANGE_INHERIT.equals(this.getType()) && this.getInherit() == null) {
			throw new IllegalArgumentException("inherit不能为空");
		}
		if (!DocConstants.CHANGE_INHERIT.equals(this.getType()) && this.getExpires_at() == null) {
			throw new IllegalArgumentException("expires_at不能为空");
		}
		if (DocConstants.SHARED_LINK_PERM.equals(this.getType()) || DocConstants.CHANGE_OWNER.equals(this.getType())) {
			if (StrUtil.isBlank(this.getOperation())) {
				throw new IllegalArgumentException("operation不能为空");
			}
			if (this.getAccessor() == null) {
				throw new IllegalArgumentException("accessor不能为空");
			}
			if (StrUtil.isBlank(this.getAccessor().getId())) {
				throw new IllegalArgumentException("accessor.id不能为空");
			}
			if (StrUtil.isBlank(this.getAccessor().getName())) {
				throw new IllegalArgumentException("accessor.name不能为空");
			}
			if (StrUtil.isBlank(this.getAccessor().getType())) {
				throw new IllegalArgumentException("accessor.type不能为空");
			}
		}
		if (DocConstants.SHARED_LINK_PERM.equals(this.getType())) {
			if (this.getPerm() == null) {
				throw new IllegalArgumentException("perm不能为空");
			}
			if (this.getPerm().getAllow() == null) {
				throw new IllegalArgumentException("perm.allow不能为空");
			}
			if (this.getPerm().getDeny() == null) {
				throw new IllegalArgumentException("perm.deny不能为空");
			}
			if (this.getPerm().getAllow().length == 0 && this.getPerm().getDeny().length == 0) {
				throw new IllegalArgumentException("perm明细不能为空");
			}
		}
	}
}
