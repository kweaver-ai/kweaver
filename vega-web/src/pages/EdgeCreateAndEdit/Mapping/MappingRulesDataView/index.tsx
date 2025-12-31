import { useMemo, useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { DownOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import _ from 'lodash';
import { DataViewSource } from '@/components/DataViewSource';
import ObjectIcon from '@/components/ObjectIcon';
import ENUMS from '@/enums';
import SERVICE from '@/services';
import { Text, IconFont, Button, Select } from '@/web-library/common';
import styles from './index.module.less';

const uniqueIdPrefix = 'mappingRulesDataViewM';
const MappingRulesDataView = (props: any) => {
  const { value, onChange } = props;
  const knId = localStorage?.getItem('KnowledgeNetwork.id') || '';

  const [openDataView, setOpenDataView] = useState(false);
  const [objectOptions, setObjectOptions] = useState<any[]>([]); // 对象类的选择列表
  const objectOptionsKV = useMemo(() => _.keyBy(objectOptions, 'value'), [objectOptions]); // 对象类以id为key的键值对
  /** 起点对象数据属性 */
  const sourceOptions = useMemo(() => {
    if (!value?.source_object_type_id || !objectOptionsKV[value?.source_object_type_id]) return [];
    return _.map(objectOptionsKV?.[value.source_object_type_id]?.data_properties, (item) => {
      const { name, type, display_name } = item;
      return { value: name, label: display_name || name, type, name };
    });
  }, [objectOptionsKV, value?.source_object_type_id]);
  /** 终点对象数据属性 */
  const targetOptions = useMemo(() => {
    if (!value?.target_object_type_id || !objectOptionsKV[value?.target_object_type_id]) return [];
    return _.map(objectOptionsKV?.[value.target_object_type_id]?.data_properties, (item) => {
      const { name, type, display_name } = item;
      return { value: name, label: display_name || name, type, name };
    });
  }, [objectOptionsKV, value?.target_object_type_id]);

  const [viewData, setViewData] = useState<any>({}); // 数据视图详情
  /** 数据视图属性 */
  const viewDataOptions = useMemo(() => {
    return _.map(viewData?.fields, (item) => {
      const { name, type, display_name } = item;
      return { value: name, label: display_name || name, type, name };
    });
  }, [viewData]);

  useEffect(() => {
    if (!knId) return;
    getObjectList();
  }, [knId]);
  useEffect(() => {
    if (!value?.backing_data_source?.id) return;
    getDataViewDetail();
  }, [value?.backing_data_source?.id]);

  /** 获取对象列表 */
  const getObjectList = async () => {
    try {
      const result = await SERVICE.object.objectGet(knId, { offset: 0, limit: -1 });
      const objectOptions = _.map(result?.entries, (item) => {
        const { id, name, icon, color, data_properties } = item;
        return {
          value: id,
          name,
          data_properties,
          label: (
            <div className="g-flex-align-center" title={name}>
              <ObjectIcon icon={icon} color={color} />
              <div>
                <Text className="g-ellipsis-1">{name}</Text>
              </div>
            </div>
          ),
        };
      });
      setObjectOptions(objectOptions);
    } catch (error) {
      console.log('getObjectList error: ', error);
    }
  };

  /** 获取数据视图详情 */
  const getDataViewDetail = async () => {
    try {
      const result = await SERVICE.dataView.dataViewGetDetail(value?.backing_data_source?.id);
      setViewData(result?.[0]);
    } catch (event) {
      console.log('getDataViewDetail event: ', event);
    }
  };

  /** 起点对象变更 */
  const onChangeSourceObject = (value: string) => {
    const newValue = _.cloneDeep(props.value);
    newValue.source_object_type_id = value;
    newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item) => {
      item.source_property.name = undefined;
      return item;
    });
    onChange(newValue);
  };
  /** 终点对象变更 */
  const onChangeTargetObject = (value: string) => {
    const newValue = _.cloneDeep(props.value);
    newValue.target_object_type_id = value;
    newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item) => {
      item.target_property.name = undefined;
      return item;
    });
    onChange(newValue);
  };

  /** 起点属性变更 */
  const onChangeSourceProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item, index) => {
      if (index === data.id) item.source_property.name = value;
      return item;
    });
    onChange(newValue);
  };
  /** 终点属性变更 */
  const onChangeTargetProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item, index) => {
      if (index === data.id) item.target_property.name = value;
      return item;
    });
    onChange(newValue);
  };

  /** 数据视图变更 */
  const onChangeViewData = (value: string) => {
    const newValue = _.cloneDeep(props.value);
    newValue.backing_data_source.id = value;
    newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item) => {
      item.target_property.name = undefined;
      return item;
    });
    newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item) => {
      item.source_property.name = undefined;
      return item;
    });
    onChange(newValue);
  };
  /** 数据视图起点属性变更 */
  const onChangeDataViewSourceProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item, index) => {
      if (index === data.id) item.target_property.name = value;
      return item;
    });
    onChange(newValue);
  };
  /** 数据视图终点属性变更 */
  const onChangeDataViewTargetProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item, index) => {
      if (index === data.id) item.source_property.name = value;
      return item;
    });
    onChange(newValue);
  };

  /** 删除一行数据 */
  const onDeleteLine = (data: any) => {
    const newValue = _.cloneDeep(props.value);
    if (data.type === 'object') {
      newValue.target_object_type_id = undefined;
      newValue.source_object_type_id = undefined;
      newValue.backing_data_source = { type: ENUMS.EDGE.TYPE_DIRECT, id: undefined };
      newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item) => {
        item.source_property.name = undefined;
        item.target_property.name = undefined;
        return item;
      });
      newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item) => {
        item.source_property.name = undefined;
        item.target_property.name = undefined;
        return item;
      });
    } else {
      if (newValue.source_mapping_rules.length === 1) {
        newValue.source_mapping_rules = _.map(newValue.source_mapping_rules, (item, index) => {
          if (index === data.id) {
            item.source_property.name = undefined;
            item.target_property.name = undefined;
          }
          return item;
        });
        newValue.target_mapping_rules = _.map(newValue.target_mapping_rules, (item, index) => {
          if (index === data.id) {
            item.source_property.name = undefined;
            item.target_property.name = undefined;
          }
          return item;
        });
      } else {
        newValue.source_mapping_rules = _.filter(newValue.source_mapping_rules, (_item, index) => index !== data.id);
        newValue.target_mapping_rules = _.filter(newValue.target_mapping_rules, (_item, index) => index !== data.id);
      }
    }
    onChange(newValue);
  };

  /** 添加数据属性 */
  const onAddDataProperty = () => {
    const newValue = _.cloneDeep(props.value);
    newValue.source_mapping_rules.push({
      source_property: { name: undefined },
      target_property: { name: undefined },
    });
    newValue.target_mapping_rules.push({
      source_property: { name: undefined },
      target_property: { name: undefined },
    });
    onChange(newValue);
  };

  /** 数据视图变更 */
  const onOkDataView = (checkedList: any) => {
    const data = checkedList[0];
    onChangeViewData(data?.id);
    setOpenDataView(false);
  };

  /** 通过value构建table表格数据 */
  const dataSource = useMemo(() => {
    const data = _.cloneDeep(value);
    const result: any = [
      {
        id: _.uniqueId(uniqueIdPrefix),
        type: 'object',
        source: data?.source_object_type_id,
        target: data?.target_object_type_id,
        dataView: data?.backing_data_source?.id,
      },
    ];
    _.forEach(data?.source_mapping_rules, (item, index) => {
      const targetMapping = data?.target_mapping_rules?.[index];
      result.push({
        id: index,
        type: 'property',
        source: item?.source_property?.name,
        target: targetMapping?.target_property?.name,
        dataView: {
          source: item?.target_property?.name,
          target: targetMapping?.source_property?.name,
        },
      });
    });
    return result;
  }, [value]);
  const columns: any = [
    {
      title: intl.get('Edge.detailSourcePoint'),
      dataIndex: 'source',
      width: 215,
      render: (value: string, data: any) => {
        return (
          <Select
            allowClear
            showSearch
            value={value}
            placeholder={data?.type === 'object' ? intl.get('Edge.selectSourcePoint') : intl.get('Edge.selectSourceProperty')}
            options={data?.type === 'object' ? objectOptions : sourceOptions}
            filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={data?.type === 'object' ? onChangeSourceObject : (value) => onChangeSourceProperty(value, data)}
          />
        );
      },
    },
    {
      title: intl.get('Global.dataView'),
      dataIndex: 'dataView',
      width: 400,
      render: (value: any, data: any) => {
        if (data?.type === 'object') {
          return (
            <div className={styles['data-view-button']} onClick={() => setOpenDataView(true)}>
              {value ? <Text>{viewData?.name || value}</Text> : <span className="g-c-disabled">{intl.get('Edge.selectDataView')}</span>}
              <DownOutlined style={{ color: '#d9d9d9' }} />
            </div>
          );
        } else {
          const { source, target } = value;
          return (
            <div className="g-flex-align-center">
              <Select
                className="g-mr-4"
                allowClear
                showSearch
                value={source}
                placeholder={intl.get('Edge.selectDataViewSource')}
                options={viewDataOptions}
                filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
                labelRender={(props: any) => {
                  return (
                    <div className="g-flex-align-center" title={props?.label}>
                      <div className={styles['view-data-option-label']}>{intl.get('Edge.detailDataViewSource')}</div>
                      <Text className="g-ellipsis-1">{props?.label}</Text>
                    </div>
                  );
                }}
                onChange={(value) => onChangeDataViewSourceProperty(value, data)}
              />
              <Select
                allowClear
                showSearch
                value={target}
                placeholder={intl.get('Edge.selectDataViewTarget')}
                options={viewDataOptions}
                filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
                labelRender={(props: any) => {
                  return (
                    <div className="g-flex-align-center" title={props?.label}>
                      <div className={styles['view-data-option-label']} style={{ background: '#000' }}>
                        {intl.get('Edge.detailDataViewTarget')}
                      </div>
                      <Text className="g-ellipsis-1">{props?.label}</Text>
                    </div>
                  );
                }}
                onChange={(value) => onChangeDataViewTargetProperty(value, data)}
              />
            </div>
          );
        }
      },
    },
    {
      title: intl.get('Edge.detailTargetPoint'),
      dataIndex: 'target',
      width: 215,
      render: (value: string, data: any) => {
        return (
          <Select
            allowClear
            showSearch
            value={value}
            placeholder={data?.type === 'object' ? intl.get('Edge.selectTargetPoint') : intl.get('Edge.selectTargetProperty')}
            options={data?.type === 'object' ? objectOptions : targetOptions}
            filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={data?.type === 'object' ? onChangeTargetObject : (value) => onChangeTargetProperty(value, data)}
          />
        );
      },
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      width: 70,
      align: 'center',
      render: (_value: string, data: any) => <Button.Icon icon={<IconFont type="icon-dip-trash" />} onClick={() => onDeleteLine(data)} />,
    },
  ];

  return (
    <div className={styles['mapping-rules-data-view-root']}>
      <Table bordered size="small" rowKey="id" pagination={false} columns={columns} dataSource={dataSource} />
      <Button.Link className="g-mt-2" icon={<IconFont type="icon-dip-add" />} onClick={onAddDataProperty}>
        {intl.get('Edge.addDataProperty')}
      </Button.Link>
      <DataViewSource open={openDataView} maxCheckedCount={1} onOk={onOkDataView} onCancel={() => setOpenDataView(false)} />
    </div>
  );
};

export default MappingRulesDataView;
