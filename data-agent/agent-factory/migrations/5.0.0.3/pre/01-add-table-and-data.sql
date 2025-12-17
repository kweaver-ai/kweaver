USE dip_data_agent;

-- 业务域与agent关联表
create table if not exists t_biz_domain_agent_rel
(
    f_id            bigint      not null auto_increment comment '自增ID',
    f_biz_domain_id varchar(40) not null comment '业务域ID',
    f_agent_id      varchar(40) not null comment 'agent ID，对应t_data_agent_config表的f_id',
    f_created_at    bigint      not null default 0 comment '创建时间',
    primary key (f_id),
    unique key uk_biz_domain_id_agent_id (f_biz_domain_id, f_agent_id),
    index idx_agent_id (f_agent_id)
) engine = innodb comment '业务域与agent关联表';

-- 业务域与agent模板关联表
create table if not exists t_biz_domain_agent_tpl_rel
(
    f_id            bigint      not null auto_increment comment '自增ID',
    f_biz_domain_id varchar(40) not null comment '业务域ID',
    f_agent_tpl_id  bigint      not null comment 'agent模板ID，对应t_data_agent_config_tpl表的f_id',
    f_created_at    bigint      not null default 0 comment '创建时间',
    primary key (f_id),
    unique key uk_biz_domain_id_agent_tpl_id (f_biz_domain_id, f_agent_tpl_id),
    index idx_agent_tpl_id (f_agent_tpl_id)
) engine = innodb comment '业务域与agent模板关联表';
