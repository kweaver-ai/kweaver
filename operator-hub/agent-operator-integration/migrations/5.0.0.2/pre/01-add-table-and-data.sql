USE dip_data_operator_hub;

CREATE TABLE IF NOT EXISTS `t_mcp_tool` (
    `f_id` bigint AUTO_INCREMENT NOT NULL COMMENT '自增主键',
    `f_mcp_tool_id` varchar(40) NOT NULL COMMENT 'mcp_tool_id',
    `f_mcp_id` varchar(40) NOT NULL COMMENT 'mcp_id',
    `f_mcp_version` int(20) NOT NULL COMMENT 'mcp版本',
    `f_box_id` varchar(40) NOT NULL COMMENT '工具箱ID',
    `f_box_name` varchar(50) COMMENT '工具箱名称',
    `f_tool_id` varchar(40) NOT NULL COMMENT '工具ID',
    `f_name` varchar(256)  COMMENT '工具名称',
    `f_description` longtext  COMMENT '工具描述',
    `f_use_rule` longtext  COMMENT '使用规则',
    `f_create_user` varchar(50) NOT NULL COMMENT '创建者',
    `f_create_time` bigint(20) NOT NULL COMMENT '创建时间',
    `f_update_user` varchar(50) NOT NULL COMMENT '编辑者',
    `f_update_time` bigint(20) NOT NULL COMMENT '编辑时间',
    PRIMARY KEY (`f_id`),
    UNIQUE KEY uk_mcp_tool_id (f_mcp_tool_id) USING BTREE,
    KEY idx_mcp_id_version (f_mcp_id, f_mcp_version) USING BTREE,
    KEY idx_name_update (f_name, f_update_time) USING BTREE
) ENGINE = InnoDB COMMENT = 'MCP工具表';