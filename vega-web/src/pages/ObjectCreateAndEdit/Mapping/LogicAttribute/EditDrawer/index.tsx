import { useCallback, useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { MinusCircleFilled } from '@ant-design/icons';
import { Button, Col, Form, Input, InputNumber, Row, Select, Table, TableColumnProps } from 'antd';
import classnames from 'classnames';
import _, { groupBy } from 'lodash';
import { nanoid } from 'nanoid';
import { getInputParamsFromToolOpenAPISpec } from '@/components/ToolParamsTable/utils';
import { isEmptyExceptZero } from '@/utils/common';
import ActionType from '@/services/action/type';
import objectApi from '@/services/object';
import OntologyObjectType from '@/services/object/type';
import HOOKS from '@/hooks';
import { IconFont, Drawer } from '@/web-library/common';
import styles from './index.module.less';

const extractLeafParams = (data: any[]): any[] => {
  const leafParams: any[] = [];

  const traverse = (items: any[]) => {
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      } else {
        leafParams.push(item);
      }
    });
  };

  traverse(data);

  return leafParams;
};

interface SettingItem extends OntologyObjectType.Parameter {
  error?: Record<string, string>;
  children?: SettingItem[];
}

const EditDrawer: React.FC<{
  allData?: OntologyObjectType.ViewField[];
  logicFields?: OntologyObjectType.LogicProperty[];
  attrInfo: OntologyObjectType.LogicProperty;
  title?: string;
  open: boolean;
  onClose: () => void;
  onOk: (data: OntologyObjectType.LogicProperty) => void;
}> = ({ allData = [], logicFields = [], attrInfo, title = '', open, onClose, onOk }) => {
  const [nameOptions, setNameOptions] = useState<any[]>([]);
  const [settingList, setSettingList] = useState<SettingItem[]>([]);
  const [dimensionFields, setDimensionFields] = useState<{ label: string; value: string; type: string }[]>([]);
  const [metricModelList, setMetricModelList] = useState<any[]>([]);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);
  const id = Form.useWatch('id', form);

  const { message } = HOOKS.useGlobalContext();
  const { VALUE_FROM_OPTIONS, LOGIC_ATTR_TYPE_OPTIONS, OPERATOR_TYPE_OPTIONS, FIELD_TYPE_INPUT } = HOOKS.useConstants();

  useEffect(() => {
    if (open) {
      if (attrInfo?.data_source?.id) {
        form.setFieldValue('type', attrInfo.data_source.type);
        form.setFieldValue('id', attrInfo.data_source.id);
        form.setFieldValue('name', attrInfo.name);
        form.setFieldValue('display_name', attrInfo.display_name);
      }
      if (attrInfo?.parameters?.length) {
        if (attrInfo?.data_source?.type === OntologyObjectType.LogicAttributeType.METRIC) {
          setSettingList(attrInfo?.parameters?.map((item) => ({ ...item, id: item.id || nanoid() })) || []);
        }
      }
    } else {
      form.setFieldValue('type', undefined);
      form.setFieldValue('id', undefined);
      setSettingList([]);
    }
  }, [open, attrInfo]);

  useEffect(() => {
    if (type === OntologyObjectType.LogicAttributeType.METRIC) {
      getMetricModelList();
    } else if (type === OntologyObjectType.LogicAttributeType.OPERATOR) {
      getOperatorList();
    }
  }, [type]);

  useEffect(() => {
    if (type === OntologyObjectType.LogicAttributeType.OPERATOR) {
      const api_spec = nameOptions.find((item) => item.value === id)?.api_spec;
      handleOperatorDetail(api_spec);
    } else if (type === OntologyObjectType.LogicAttributeType.METRIC) {
      getMetricModelFields(id);
    }
  }, [id, type, nameOptions]);

  const propertyOptions = useMemo(() => {
    const propertyNames = logicFields.map((item) => item.name);
    return allData.map((item) => ({
      label: item.name,
      value: item.name,
      type: item.type,
      disabled: propertyNames.includes(item.name) || item.name === attrInfo.name,
    }));
  }, [allData, attrInfo, logicFields]);

  // 处理算子详情
  const handleOperatorDetail = (api_spec: any) => {
    if (!api_spec) {
      return;
    }
    // 获取算子的输入参数
    const inputParams: any[] = getInputParamsFromToolOpenAPISpec(api_spec);

    const params = attrInfo?.parameters || [];
    const valueMapByName = _.keyBy(params || [], 'name');

    const processNode = (item: any): any => {
      const matchedParam = valueMapByName[item.key];
      // 处理子节点
      const children = item.children?.length ? item.children.map(processNode) : undefined;
      return {
        id: nanoid(),
        key: item.key,
        name: item.key,
        description: item.description,
        type: item.type,
        source: item.source,
        value_from: matchedParam?.value_from || ActionType.ValueFrom.Input,
        value: matchedParam?.value || '',
        children,
      };
    };

    setSettingList(inputParams.map(processNode));
  };

  // 获取算子列表
  const getOperatorList = async () => {
    const res = await objectApi.getOperatorList({
      page: 1,
      page_size: -1,
      execution_mode: 'sync',
    });
    const data = res?.data || [];
    setNameOptions(data.map((item: any) => ({ label: item.name, value: item.operator_id, api_spec: item.metadata?.api_spec })));
  };

  // 获取指标模型列表
  const getMetricModelList = async () => {
    const res = await objectApi.getMetricModelList({
      limit: -1,
      offset: 0,
      sort: 'update_time',
      direction: 'desc',
    });

    setMetricModelList(res?.entries || []);

    const groupedData = groupBy(res?.entries || [], 'group_name');
    const options = Object.keys(groupedData).map((key) => {
      return {
        label: key || intl.get('Global.ungrouped'),
        title: key || intl.get('Global.ungrouped'),
        options: groupedData?.[key].map((item) => {
          const { name, id, analysis_dimensions } = item;
          return { name, value: id, label: name, analysis_dimensions };
        }),
      };
    });
    setNameOptions(options);
  };

  // 获取指标模型维度字段
  const getMetricModelFields = async (id: string) => {
    if (!id) {
      return;
    }
    const res = await objectApi.getMetricModelFields(id);
    setDimensionFields(res?.map((item) => ({ label: item.display_name, value: item.name, type: item.type })) || []);
  };

  // 数据处理函数
  const updateSettingData = useCallback((id: string, updateValue: Record<string, any>) => {
    const processNode = (item: any): any => {
      if (item?.id === id) {
        if (item) return { ...item, ...updateValue, error: {} };
      }
      if (item.children?.length) {
        return {
          ...item,
          children: item.children.map(processNode),
        };
      }
      return item;
    };
    setSettingList((prev) => prev.map(processNode));
  }, []);

  const handleAddRow = () => {
    setSettingList((prev) => [...prev, { id: nanoid(), name: '', value_from: ActionType.ValueFrom.Property, operation: '==' }]);
  };
  const handleDeleteRow = (id: string) => {
    setSettingList((prev) => prev.filter((item) => item.id !== id));
  };

  const onNameOptionsChange = (value: any) => {
    if (type === OntologyObjectType.LogicAttributeType.METRIC && value) {
      setSettingList([{ id: nanoid(), name: '', value_from: ActionType.ValueFrom.Property, operation: '==' }]);
    } else {
      setSettingList([]);
    }
  };

  const validateParams = () => {
    let hasError = false;
    if (settingList.length === 0) {
      hasError = true;
    }

    // 递归校验子节点
    const validateNode = (node: any) => {
      if (node.children?.length) {
        node.children = node.children.map(validateNode);
      }
      if (!node.name || (node.value_from !== 'input' && isEmptyExceptZero(node.value))) {
        hasError = true;
      }
      console.log(node.value, '1111', !node.value);
      return {
        ...node,
        error: {
          name: !node.name ? intl.get('Global.valueCannotBeNull') : '',
          value: isEmptyExceptZero(node.value) ? intl.get('Global.valueCannotBeNull') : '',
        },
      };
    };

    setSettingList((prev) => prev.map(validateNode));

    return hasError;
  };

  const onSubmit = async () => {
    await form.validateFields();
    const hasError = validateParams();
    if (hasError) {
      message.error(intl.get('Object.pleaseFillInCompleteParameters'));
      return;
    }

    const name =
      type === OntologyObjectType.LogicAttributeType.METRIC
        ? metricModelList.find((item) => item.id === id)?.name
        : nameOptions.find((item) => item.value === id)?.label;

    const flattenSettingList = (list: any[]) => {
      return list.reduce((acc: any[], item: any) => {
        acc.push(item);
        if (item.children?.length) {
          acc.push(...flattenSettingList(item.children));
        }
        return acc;
      }, []);
    };

    const parameters = extractLeafParams(settingList);

    const data = {
      name: attrInfo.name,
      display_name: attrInfo.display_name,
      type: attrInfo.type,
      comment: attrInfo.comment,
      data_source: {
        type,
        id,
        name,
      },
      parameters,
    };
    onOk(data);
  };

  const columns: TableColumnProps<SettingItem>[] = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
      width: 240,
      ellipsis: true,
      render: (value, record) => (
        <div className="g-ellipsis-1">
          <div className="g-c-title g-ellipsis-1" title={value}>
            {value}
          </div>
          <div className={classnames('g-c-text-sub g-ellipsis-1', styles['description'])} title={record.description}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: intl.get('Global.type'),
      width: 100,
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: intl.get('Object.parameterSource'),
      width: 100,
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: intl.get('Global.value'),
      dataIndex: 'value_from',
      key: 'value_from',
      width: 156,
      render: (_, record) =>
        record?.children ? (
          <div />
        ) : (
          <Select
            style={{ width: '100%' }}
            placeholder={intl.get('Global.pleaseSelect')}
            options={VALUE_FROM_OPTIONS}
            value={record.value_from}
            onChange={(value_from) => {
              updateSettingData(record.id, { value_from, value: undefined });
            }}
          />
        ),
    },
    {
      title: intl.get('Global.value'),
      dataIndex: 'value',
      key: 'value',
      width: 278,
      render: (_, record) => {
        if (record?.children) return <div />;

        switch (record.value_from) {
          case ActionType.ValueFrom.Input:
            return <Input style={{ width: '100%' }} disabled />;
          case ActionType.ValueFrom.Const:
            return (
              <Input
                style={{ width: '100%' }}
                value={record.value}
                placeholder={intl.get('Global.placeholder')}
                onChange={(e) => {
                  updateSettingData(record.id, { value: e.target.value });
                }}
                status={record?.error?.['value'] ? 'error' : ''}
              />
            );
          case ActionType.ValueFrom.Property:
            return (
              <Select
                style={{ width: '100%' }}
                placeholder={intl.get('Global.pleaseSelect')}
                options={propertyOptions}
                value={record.value || undefined}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                onChange={(value) => {
                  updateSettingData(record.id, { value });
                }}
                status={record?.error?.['value'] ? 'error' : ''}
              />
            );
          default:
            return null;
        }
      },
    },
  ];

  const footer = (
    <div className={styles.footer}>
      <Button type="primary" onClick={onSubmit}>
        {intl.get('Global.ok')}
      </Button>
      <Button onClick={onClose}>{intl.get('Global.cancel')}</Button>
    </div>
  );

  return (
    <Drawer className={styles.drawerBox} width={900} title={title} onClose={onClose} open={open} footer={footer}>
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={intl.get('Global.attributeName')} name="name" rules={[{ required: true }]} initialValue={attrInfo.name}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('Global.attributeDisplayName')} name="display_name" rules={[{ required: true }]} initialValue={attrInfo.display_name}>
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={intl.get('Global.type')} name="type" rules={[{ required: true }]}>
              <Select
                options={LOGIC_ATTR_TYPE_OPTIONS}
                placeholder={intl.get('Global.pleaseSelect')}
                onChange={() => {
                  setSettingList([]);
                  form.setFieldValue('id', undefined);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('Global.name')} name="id" rules={[{ required: true }]}>
              <Select
                allowClear
                showSearch
                options={nameOptions}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                placeholder={intl.get('Global.pleaseSelect')}
                onChange={(value) => {
                  onNameOptionsChange(value);
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {settingList.length > 0 && <div className={styles.settingTitle}>{intl.get('Global.setting')}</div>}

      {type === OntologyObjectType.LogicAttributeType.OPERATOR && (
        <Table dataSource={settingList} columns={columns} pagination={false} expandable={{ defaultExpandAllRows: true }} />
      )}

      {type === OntologyObjectType.LogicAttributeType.METRIC && (
        <>
          <div>
            {settingList.map((item) => (
              <div className={styles.metricRow} key={item.id}>
                <div style={{ width: 24 }}>
                  {!item?.if_system_generate && <MinusCircleFilled style={{ color: 'rgba(0, 0, 0, 0.25)' }} onClick={() => handleDeleteRow(item.id)} />}
                </div>
                <Select
                  style={{ width: 156 }}
                  placeholder={intl.get('Global.pleaseSelect')}
                  options={dimensionFields}
                  value={item.name || undefined}
                  onChange={(e) => {
                    const type = dimensionFields.find((item) => item.value === e)?.type;
                    updateSettingData(item?.id, { name: e, type, value: undefined });
                  }}
                  status={item?.error?.['name'] ? 'error' : ''}
                  disabled={item?.if_system_generate}
                />
                <Select
                  style={{ width: 120 }}
                  placeholder={intl.get('Global.pleaseSelect')}
                  value={item.operation}
                  options={OPERATOR_TYPE_OPTIONS}
                  onChange={(e) => {
                    updateSettingData(item?.id, { operation: e });
                  }}
                  disabled={item?.if_system_generate}
                />
                <Select
                  style={{ width: 120 }}
                  value={item.value_from || undefined}
                  onChange={(e) => {
                    updateSettingData(item?.id, { value_from: e, value: undefined });
                  }}
                  options={VALUE_FROM_OPTIONS}
                  disabled={item?.if_system_generate}
                />
                {item.value_from === ActionType.ValueFrom.Property && (
                  <Select
                    style={{ width: 256 }}
                    placeholder={intl.get('Global.pleaseSelect')}
                    options={propertyOptions}
                    value={item.value || undefined}
                    onChange={(e) => {
                      const type = propertyOptions.find((item) => item.value === e)?.type;
                      updateSettingData(item?.id, { value: e, type });
                    }}
                    status={item?.error?.['value'] ? 'error' : ''}
                  />
                )}
                {item.value_from === ActionType.ValueFrom.Const &&
                  (item.type && FIELD_TYPE_INPUT.number.includes(item.type) ? (
                    <InputNumber
                      style={{ width: 256 }}
                      placeholder={intl.get('Global.placeholder')}
                      value={item.value}
                      onChange={(value) => {
                        updateSettingData(item?.id, { value });
                      }}
                      status={item?.error?.['value'] ? 'error' : ''}
                    />
                  ) : item.type && FIELD_TYPE_INPUT.boolean.includes(item.type) ? (
                    <Select
                      style={{ width: 256 }}
                      placeholder={intl.get('Global.pleaseSelect')}
                      options={[
                        { label: intl.get('Global.yes'), value: true },
                        { label: intl.get('Global.no'), value: false },
                      ]}
                      value={item.value || undefined}
                      onChange={(e) => {
                        const type = propertyOptions.find((item) => item.value === e)?.type;
                        updateSettingData(item?.id, { value: e, type });
                      }}
                      status={item?.error?.['value'] ? 'error' : ''}
                    />
                  ) : (
                    <Input
                      style={{ width: 256 }}
                      placeholder={intl.get('Global.placeholder')}
                      value={item.value}
                      onChange={(e) => {
                        updateSettingData(item?.id, { value: e.target.value });
                      }}
                      status={item?.error?.['value'] ? 'error' : ''}
                    />
                  ))}
                {item.value_from === ActionType.ValueFrom.Input && <Input style={{ width: 256 }} disabled />}
              </div>
            ))}
          </div>

          {dimensionFields.length > 0 && settingList.length > 0 && (
            <div className={styles.addRow} onClick={handleAddRow}>
              <IconFont type="icon-dip-jia" />
              <span>{intl.get('Global.add')}</span>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

export default EditDrawer;
