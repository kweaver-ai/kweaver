import { useMemo, useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Table } from 'antd';
import _ from 'lodash';
import ObjectIcon from '@/components/ObjectIcon';
import SERVICE from '@/services';
import { Text, Title, IconFont, Button, Select } from '@/web-library/common';

const uniqueIdPrefix = 'mappingRules';
const MappingRules = (props: any) => {
  const { value, onChange } = props;
  const knId = localStorage?.getItem('KnowledgeNetwork.id') || '';

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

  useEffect(() => {
    if (!knId) return;
    getObjectList();
  }, [knId]);

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

  /** 起点对象变更 */
  const onChangeSourceObject = (value: string) => {
    const newValue = _.cloneDeep(props.value);
    newValue.source_object_type_id = value;
    newValue.mapping_rules = _.map(newValue.mapping_rules, (item) => {
      item.source_property.name = undefined;
      return item;
    });
    onChange(newValue);
  };
  /** 终点对象变更 */
  const onChangeTargetObject = (value: string) => {
    const newValue = _.cloneDeep(props.value);
    newValue.target_object_type_id = value;
    newValue.mapping_rules = _.map(newValue.mapping_rules, (item) => {
      item.target_property.name = undefined;
      return item;
    });
    onChange(newValue);
  };

  /** 起点属性变更 */
  const onChangeSourceProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.mapping_rules = _.map(newValue.mapping_rules, (item, index) => {
      if (index === data.id) item.source_property.name = value;
      return item;
    });
    onChange(newValue);
  };
  /** 终点属性变更 */
  const onChangeTargetProperty = (value: string, data: any) => {
    const newValue = _.cloneDeep(props.value);
    newValue.mapping_rules = _.map(newValue.mapping_rules, (item, index) => {
      if (index === data.id) item.target_property.name = value;
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
      newValue.mapping_rules = _.map(newValue.mapping_rules, (item) => {
        item.source_property.name = undefined;
        item.target_property.name = undefined;
        return item;
      });
    } else {
      if (newValue.mapping_rules.length === 1) {
        newValue.mapping_rules = _.map(newValue.mapping_rules, (item, index) => {
          if (index === data.id) {
            item.source_property.name = undefined;
            item.target_property.name = undefined;
          }
          return item;
        });
      } else {
        newValue.mapping_rules = _.filter(newValue.mapping_rules, (_item, index) => index !== data.id);
      }
    }
    onChange(newValue);
  };

  /** 添加数据属性 */
  const onAddDataProperty = () => {
    const newValue = _.cloneDeep(props.value);
    newValue.mapping_rules.push({
      source_property: { name: undefined, display_name: undefined },
      target_property: { name: undefined, display_name: undefined },
    });
    onChange(newValue);
  };

  /** 通过value构建 table表格数据 */
  const dataSource = useMemo(() => {
    const data = _.cloneDeep(value);
    const result = [
      {
        id: _.uniqueId(uniqueIdPrefix),
        name: intl.get('Global.objectClass'),
        type: 'object',
        source: data?.source_object_type_id,
        target: data?.target_object_type_id,
      },
    ];
    _.forEach(data?.mapping_rules, (item, index) => {
      result.push({
        id: index,
        name: intl.get('Global.dataProperty'),
        type: 'property',
        source: item?.source_property?.name,
        target: item?.target_property?.name,
      });
    });
    return result;
  }, [value]);
  const columns: any = [
    { dataIndex: 'name', width: 100, render: (value: string) => <Title>{value}</Title> },
    {
      title: intl.get('Edge.detailSourcePoint'),
      dataIndex: 'source',
      width: 415,
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
      title: intl.get('Edge.detailTargetPoint'),
      dataIndex: 'target',
      width: 415,
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
    <div>
      <Table bordered size="small" rowKey="id" pagination={false} columns={columns} dataSource={dataSource} />
      <Button.Link className="g-mt-2" icon={<IconFont type="icon-dip-add" />} onClick={onAddDataProperty}>
        {intl.get('Edge.addDataProperty')}
      </Button.Link>
    </div>
  );
};

export default MappingRules;
