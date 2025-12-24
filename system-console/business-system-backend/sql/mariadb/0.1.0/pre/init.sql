USE model_management;

create table if not exists t_business_domain (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_bd_name varchar(50) not null,
    f_bd_description varchar(1000) null,
    f_bd_creator varchar(50) not null,
    f_bd_icon varchar(1000) null,
    f_bd_status int(11) not null default 1,
    f_bd_resource_count int(11) not null default 0,
    f_bd_member_count int(11) not null default 0,
    primary key (id),
    unique key uk_bd_id (f_bd_id),
    unique key uk_bd_name (f_bd_name)
);

create table if not exists t_bd_resource_r (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_resource_id varchar(50) not null,
    f_resource_type varchar(50) not null,
    f_create_by varchar(50) not null,
    primary key (id),
    unique key uk_resource (f_resource_id, f_resource_type)
);

create table if not exists t_bd_product_r (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_product_id varchar(50) not null,
    f_create_by varchar(50) not null,
    primary key (id),
    unique key uk_bd_product (f_bd_id, f_create_by)
);