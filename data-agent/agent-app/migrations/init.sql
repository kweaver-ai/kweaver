USE dip_data_agent;


-- data agent 会话表
create table if not exists t_data_agent_conversation
(
    f_id                 varchar(40)  not null comment '会话 ID，会话唯一标识',
    f_agent_app_key      varchar(40)  not null comment 'agent app key',

    f_title              varchar(255) not null comment '会话标题，默认使用首次用户提问消息的前20个字符，支持修改标题',
    f_origin             varchar(40) not null default 'web_chat' comment '用于标记会话发起源：1. web_chat: 通过浏览器对话发起 2. api_call: api 调用发起（当前 API 暂不记录会话，只是预留未来扩展）',
    f_message_index      int not null default 0 comment '最新消息下标，会话消息下标从0开始，每产生一条新消息，下标 +1',
    f_read_message_index int not null default 0 comment '最新已读消息下标，用于实现未读消息提醒功能，当前已读会话消息下标 < 最新会话消息下标时，表示有未读的消息',
    f_ext                mediumtext not null  comment '预留扩展字段',

    f_create_time        bigint  not null default 0 comment '创建时间',
    f_update_time        bigint  not null default 0 comment '最后修改时间',
    f_create_by          varchar(40)  not null default '' comment '创建者',
    f_update_by          varchar(40)  not null default '' comment '最后修改者',
    f_is_deleted         tinyint not null default 0 comment '是否删除：0-否 1-是',
   
    primary key (f_id),
    index idx_agent_app_key (f_agent_app_key)
) engine = innodb comment ='data agent 会话表';

-- data agent 会话消息表
create table if not exists t_data_agent_conversation_message (
    f_id              varchar(40) not null comment '消息ID，消息唯一标识',
    f_agent_app_key   varchar(40)  not null comment 'agent app key',
    f_conversation_id varchar(40) not null default '' comment '会话ID，会话唯一标识',
    f_agent_id        varchar(40)  not null comment 'agent ID',
    f_agent_version   varchar(32)  not null comment 'agent版本',
    f_reply_id        varchar(40) not null default '' comment '回复消息ID，用于关联问答消息',

    f_index           int not null comment '消息下标，用于标记消息在整个会话中的位置、顺序，比如基于Index正序在前端按照时间线展示对话消息',
    f_role            varchar(255) not null comment '产生消息的角色，支持一下角色：User: 用户；Assistant: 助手',
    f_content         mediumtext  not null comment '消息内容，结构随角色类型变化。当角色为User时，用户输入包括文字和临时区文件（图片、文档、音视频）；当角色为Assistant时，包括最终返回结果和中间结果',
    f_content_type    varchar(32) comment '内容类型',
    f_status          varchar(32) comment '消息状态，随Role类型变化，Role为 User时：Received :  已接收(消息成功接收并持久化， 初始状态)Processed: 处理完成（成功触发后续的Agent Call）；Role为Assistant时：Processing： 生成中（消息正在生成中 ， 初始状态）Succeded： 生成成功（消息处理完成，返回成功）Failed： 生成失败（消息生成失败）Cancelled: 取消生成（用户、系统终止会话）',
    f_ext             mediumtext  not null  comment '预留扩展字段',

    f_create_time        bigint  not null default 0 comment '创建时间',
    f_update_time        bigint  not null default 0 comment '最后修改时间',
    f_create_by          varchar(40)  not null default '' comment '创建者',
    f_update_by          varchar(40)  not null default '' comment '最后修改者',
    f_is_deleted         tinyint not null default 0 comment '是否删除：0-否 1-是',

    primary key (f_id),
    index idx_agent_app_key (f_agent_app_key),
    index idx_conversation_id (f_conversation_id)
) engine = innodb comment = '会话消息表';