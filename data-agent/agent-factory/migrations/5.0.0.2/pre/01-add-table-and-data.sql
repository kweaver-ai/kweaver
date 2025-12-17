USE dip_data_agent;

-- 新增产品
insert into t_product (f_name, f_profile, f_key, f_created_by, f_created_at, f_updated_by, f_updated_at, f_deleted_by,
                       f_deleted_at)
select 'ChatBI',
       'ChatBI',
       'chatbi',
       '',
       unix_timestamp() * 1000,
       '',
       0,
       '',
       0
from dual
where not exists (select 1 from t_product where f_key = 'chatbi');