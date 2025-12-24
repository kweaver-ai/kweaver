
SET SEARCH_PATH TO model_management;


CREATE TABLE if not exists t_business_domain (
  id BIGSERIAL NOT NULL,
  created_at DATETIME(6) not null,
  updated_at DATETIME(6) not null,
  deleted_at DATETIME(6) DEFAULT null,
  f_bd_id VARCHAR(50) not null,
  f_bd_name VARCHAR(50) not null,
  f_bd_description VARCHAR(1000) null,
  f_bd_creator VARCHAR(50) not null,
  f_bd_icon VARCHAR(1000) null,
  f_bd_status INT(11) NOT NULL DEFAULT 1,
  f_bd_resource_count INT(11) NOT NULL DEFAULT 0,
  f_bd_member_count INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY `idx_t_business_domain_uk_bd_id` (f_bd_id),
  UNIQUE KEY `idx_t_business_domain_uk_bd_name` (f_bd_name)
);



CREATE TABLE if not exists t_bd_resource_r (
  id BIGSERIAL NOT NULL,
  created_at DATETIME(6) not null,
  updated_at DATETIME(6) not null,
  deleted_at DATETIME(6) DEFAULT null,
  f_bd_id VARCHAR(50) not null,
  f_resource_id VARCHAR(50) not null,
  f_resource_type VARCHAR(50) not null,
  f_create_by VARCHAR(50) not null,
  PRIMARY KEY (id),
  UNIQUE KEY `idx_t_bd_resource_r_uk_resource` (f_resource_id, f_resource_type)
);



CREATE TABLE if not exists t_bd_product_r (
  id BIGSERIAL NOT NULL,
  created_at DATETIME(6) not null,
  updated_at DATETIME(6) not null,
  deleted_at DATETIME(6) DEFAULT null,
  f_bd_id VARCHAR(50) not null,
  f_product_id VARCHAR(50) not null,
  f_create_by VARCHAR(50) not null,
  PRIMARY KEY (id),
  UNIQUE KEY `idx_t_bd_product_r_uk_bd_product` (f_bd_id, f_create_by)
);


