package com.aishu.wf.core.engine.core.model;

import com.aishu.wf.core.common.util.WorkflowConstants;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 流程审核员对象
 * @ClassName: FlowAuditor
 * @author: ouandyang
 * @date: 2021年3月11日 19:22:36
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProcessAuditor {
	
	private String id;

	private String name;

	private String account;

	private String status;

	private Long auditDate;

	private String countersign;

	public static List<ProcessAuditor> buildProcessAuditor(List<ProcessLogModel> logs) {
		List<ProcessAuditor> result = new ArrayList<ProcessAuditor>();
		for (ProcessLogModel item : logs) {
			String status = WorkflowConstants.AUDIT_STATUS_DSH;
			if (item.getComment() != null) {
				String comment = item.getComment().getDisplayArea();
				if ("同意".equals(comment)) {
					status = WorkflowConstants.AUDIT_RESULT_PASS;
				} else if ("退回".equals(comment)) {
					status = WorkflowConstants.AUDIT_RESULT_SENDBACK;
				} else {
					status = WorkflowConstants.AUDIT_RESULT_REJECT;
				}
			}
			result.add(ProcessAuditor.builder()
					.id(item.getReceiveUserId())
					.name(item.getReceiveUserName())
					.status(status)
					.auditDate(item.getEndTime().getTime())
					.build());
		}
		return result;
	}
}
