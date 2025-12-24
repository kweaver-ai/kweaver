SET SCHEMA model_management;

CREATE TABLE if not exists t_business_domain (
    id BIGINT  not null IDENTITY(1, 1),
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id VARCHAR(50 CHAR) not null,
    f_bd_name VARCHAR(50 CHAR) not null,
    f_bd_description VARCHAR(1000 CHAR) null,
    f_bd_creator VARCHAR(50 CHAR) not null,
    f_bd_icon VARCHAR(1000 CHAR) null,
    f_bd_status INT not null default 1,
    f_bd_resource_count INT not null default 0,
    f_bd_member_count INT not null default 0,
    CLUSTER PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_business_domain_uk_bd_id ON t_business_domain(f_bd_id);
CREATE UNIQUE INDEX IF NOT EXISTS t_business_domain_uk_bd_name ON t_business_domain(f_bd_name);



CREATE TABLE if not exists t_bd_resource_r (
    id BIGINT  not null IDENTITY(1, 1),
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id VARCHAR(50 CHAR) not null,
    f_resource_id VARCHAR(50 CHAR) not null,
    f_resource_type VARCHAR(50 CHAR) not null,
    f_create_by VARCHAR(50 CHAR) not null,
    CLUSTER PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_bd_resource_r_uk_resource ON t_bd_resource_r(f_resource_id, f_resource_type);



CREATE TABLE if not exists t_bd_product_r (
    id BIGINT  not null IDENTITY(1, 1),
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id VARCHAR(50 CHAR) not null,
    f_product_id VARCHAR(50 CHAR) not null,
    f_create_by VARCHAR(50 CHAR) not null,
    CLUSTER PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_bd_product_r_uk_bd_product ON t_bd_product_r(f_bd_id, f_create_by);

