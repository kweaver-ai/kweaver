import { useState, useMemo, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { Tag, Table, Divider, Dropdown, Segmented, Input, TableColumnProps, Form, Switch } from 'antd';
import _ from 'lodash';
import ObjectIcon from '@/components/ObjectIcon';
import { formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import formatFileSize from '@/utils/formatFileSize';
import { listObjects } from '@/services/ontology-query';
import OntologyQuery from '@/services/ontology-query/type';
import HOOKS from '@/hooks';
import { ObjectType } from '@/services';
import { Text, Title, Button, IconFont, Drawer } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import styles from './index.module.less';

const INIT_FILTER = { field: undefined, value: null, operation: '==', value_from: 'const' };

interface TObjectItem {
  value: string;
  icon: string;
  color: string;
}
const ObjectItem = (props: TObjectItem) => {
  const { value, icon, color } = props;
  return (
    <div className="g-flex-align-center" title={value}>
      {icon && <ObjectIcon icon={icon} color={color} />}
      <div>
        <Text className="g-ellipsis-1">{value}</Text>
      </div>
    </div>
  );
};

interface TDetailProps {
  open: boolean;
  sourceData: ObjectType.Detail;
  onClose: () => void;
  onDeleteConfirm: (items: ObjectType.Detail[], isBatch?: boolean, callBack?: () => void) => void;
  goToCreateAndEditPage: (id: string) => void;
  isPermission: boolean;
}

const Detail = (props: TDetailProps) => {
  const { open, sourceData: source, onClose, onDeleteConfirm, goToCreateAndEditPage, isPermission } = props;
  const { id, tags, comment, kn_id, data_source, status } = source;
  const [form] = Form.useForm();
  // 使用全局 Hook 获取国际化常量
  const { OBJECT_PROPERTY_TYPES, OBJECT_PROPERTY_TYPE_OPTIONS } = HOOKS.useConstants();
  const [type, setType] = useState(OBJECT_PROPERTY_TYPES.DATA_PROPERTY);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<OntologyQuery.ObjectDataResponse['datas']>([]);
  const [dataColumns, setDataColumns] = useState<TableColumnProps<OntologyQuery.ObjectDataResponse['object_type']>[]>([]);
  const [switchFilter, setSwitchFilter] = useState<boolean>(false);
  const dataFilterRef = useRef<any>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value, 'valu');
    setSearchText(e.target.value);
  };

  const fetchData = async (filters?: any) => {
    if (!id || !data_source?.id) return;
    const params: OntologyQuery.ListObjectsRequest = {
      knId: sessionStorage.getItem('knId') || kn_id,
      otId: id || '',
      includeTypeInfo: true,
      includeLogicParams: false,
      body: { ...filters, limit: 100 },
    };
    const res = await listObjects(params);
    if (res) {
      setData(res.datas || []);
      setDataColumns(
        res.object_type?.data_properties.map((item) => ({
          title: item.name,
          dataIndex: item.name,
          key: item.name,
          width: 150,
          ellipsis: true,
        })) || []
      );
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  // 当抽屉打开时重置过滤状态
  useEffect(() => {
    if (!open) {
      setSwitchFilter(false);
      form.setFieldValue('dataFilter', INIT_FILTER);
    }
  }, [open]);

  // 处理过滤搜索
  const handleFilterSearch = () => {
    if (switchFilter && dataFilterRef.current) {
      const filters = switchFilter ? form.getFieldValue('dataFilter') : {};
      const validate = dataFilterRef.current?.validate();
      if (!validate) {
        fetchData({ condition: formatKeyOfObjectToLine(filters) });
      }
    } else {
      fetchData();
    }
  };

  // const [source, setSource] = useState(sourceData);

  // useEffect(() => {
  //     if (!id) return;
  //     getDetail();
  // }, [id]);

  // const getDetail = async () => {
  //     const result = await SERVICE.object.getDetail(knId, [id]);
  //     if (result[0]) setSource(result[0]);
  // };

  /** 下来菜单变更 */
  const onChange = (data: any) => {
    if (data.key === 'delete') {
      onDeleteConfirm([source], false, () => onClose());
    }
  };

  /** 基础数据 */
  const baseInfo = [
    { label: 'ID', value: id },
    { label: intl.get('Global.tag'), value: Array.isArray(tags) && tags.length ? _.map(tags, (i) => <Tag key={i}>{i}</Tag>) : '--' },
    {
      label: intl.get('Global.index'),
      value: intl.get('Object.indexInfo', { docCount: status?.doc_count || 0, storageSize: formatFileSize(status?.storage_size || 0) || '0 B' }),
    },
    { label: intl.get('Global.comment'), value: comment || '--' },
  ];

  const columns = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record: any) => (
        <div className={styles.propertyTitle}>
          <div>{value}</div>
          {record.primary_key && <div className={styles.keyTag}>{intl.get('Global.primaryKey')}</div>}
          {record.display_key && <div className={styles.titleTag}>{intl.get('Global.title')}</div>}
        </div>
      ),
    },
    {
      title: intl.get('Global.displayName'),
      dataIndex: 'display_name',
      key: 'display_name',
      ellipsis: true,
    },
    {
      title: intl.get('Global.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
  ];

  const dataSource: ObjectType.Field[] = useMemo(() => {
    const { primary_keys = [], display_key = '' } = source || {};
    const dataPropertite =
      source?.data_properties?.map((item) => ({ ...item, primary_key: primary_keys.includes(item.name), display_key: item.name === display_key })) || [];
    const logicPropertite =
      source?.logic_properties?.map((item) => ({ ...item, primary_key: primary_keys.includes(item.name), display_key: item.name === display_key })) || [];
    const data: any = type === OBJECT_PROPERTY_TYPES.DATA_PROPERTY ? dataPropertite : logicPropertite;
    return data.filter((val: { name: string }) => val.name.includes(searchText));
  }, [type, source, searchText, OBJECT_PROPERTY_TYPES]);

  const fieldList = useMemo(() => {
    if (!source?.data_properties?.length) return [];
    return source?.data_properties?.map((item) => ({
      displayName: item.display_name || item.name,
      name: item.name,
      type: item.type || '',
    }));
  }, [source?.data_properties]);

  return (
    <Drawer open={open} className={styles['object-root-drawer']} width={1100} title={intl.get('Object.objectDetail')} onClose={onClose} maskClosable={true}>
      <div className={styles['object-root-drawer-content']}>
        <div className="g-flex-space-between">
          <ObjectItem value={source.name} icon={source.icon} color={source.color} />
          <div className="g-flex-align-center">
            {isPermission && (
              <Button className="g-mr-2" icon={<IconFont type="icon-dip-bianji" />} onClick={() => goToCreateAndEditPage(source.id)}>
                {intl.get('Global.edit')}
              </Button>
            )}
            {isPermission && (
              <Dropdown trigger={['click']} menu={{ items: [{ key: 'delete', label: intl.get('Global.delete') }], onClick: onChange }}>
                <Button icon={<IconFont type="icon-dip-gengduo" />} />
              </Dropdown>
            )}
          </div>
        </div>
        <Divider className="g-mt-4 g-mb-4" />
        <div>
          {_.map(baseInfo, (item) => {
            const { label, value } = item;
            return (
              <div key={label} className={styles['object-root-drawer-base-info']}>
                <div className={styles['object-root-drawer-base-info-label']}>{label}</div>
                <div className="g-ellipsis-1">{value}</div>
              </div>
            );
          })}
        </div>
        <Divider className="g-mt-4 g-mb-4" />
        <div className="g-flex-space-between g-mb-4">
          <Segmented<string>
            options={OBJECT_PROPERTY_TYPE_OPTIONS}
            onChange={(value) => {
              setType(value); // string
            }}
          />
          <Input.Search
            placeholder={intl.get('Global.searchProperty')}
            size="middle"
            value={searchText}
            style={{ width: 280 }}
            allowClear
            onChange={handleSearch}
          />
        </div>
        <Table size="small" rowKey="id" columns={columns} scroll={{ y: 400 }} dataSource={dataSource} />
        {/* <Divider className="g-mb-4" /> */}
        {data_source?.id && (
          <div className="g-mb-12">
            <Title>{intl.get('Global.data')}</Title>
            <div className="g-flex-space-between g-mb-4">
              <div className="g-flex-align-center">
                <div className="g-mr-2">{intl.get('Global.dataFilter')}</div>
                <Switch
                  size="small"
                  value={switchFilter}
                  onChange={(e) => {
                    setSwitchFilter(e);
                  }}
                />
              </div>
              <Button type="primary" onClick={handleFilterSearch}>
                {intl.get('Global.search')}
              </Button>
            </div>
            {switchFilter && (
              <div style={{ marginBottom: 12 }}>
                <Form form={form}>
                  <Form.Item name="dataFilter">
                    <DataFilter
                      ref={dataFilterRef}
                      fieldList={fieldList}
                      required={true}
                      defaultValue={INIT_FILTER}
                      maxCount={[10, 10, 10]}
                      level={3}
                      isFirst
                    />
                  </Form.Item>
                </Form>
              </div>
            )}
            <Table size="small" rowKey="id" columns={dataColumns} scroll={{ y: 400, x: '100%' }} dataSource={data as any[]} />
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default (props: any) => {
  if (!props.open) return null;
  return <Detail {...props} />;
};
