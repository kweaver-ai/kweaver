USE dip_data_agent;
-- 新增 用户最近访问Agent历史记录表
create table if not exists t_data_agent_visit_history 
(
    f_id               varchar(40)  not null comment 'id',
    f_agent_id         varchar(40) not null comment 'agent_id',
    f_agent_version    varchar(32)  not null comment 'agent版本',
    f_visit_count      int not null default 1 comment '访问次数',
    f_create_time      bigint  not null default 0 comment '创建时间（首次访问时间）',
    f_update_time      bigint  not null default 0 comment '最后修改时间（最近访问时间）',
    f_create_by        varchar(40)  not null default '' comment '创建者',
    f_update_by        varchar(40)  not null default '' comment '最后修改者',
    primary key (f_id),
    unique key uniq_user_agent (f_create_by, f_agent_id,f_agent_version)
) engine = innodb comment '用户最近访问Agent历史记录表';
