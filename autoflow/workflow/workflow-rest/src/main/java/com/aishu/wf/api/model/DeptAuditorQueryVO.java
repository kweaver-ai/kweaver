package com.aishu.wf.api.model;

import lombok.Data;

import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/7/27 17:41
 */
@Data
public class DeptAuditorQueryVO {

    String orgId;

    String orgName;

    String auditorNames;

    List<AsUserVO> asUserVOList;
}
