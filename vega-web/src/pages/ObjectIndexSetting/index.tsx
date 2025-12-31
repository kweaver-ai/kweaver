import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { useParams, useHistory } from 'react-router-dom';
import { CheckCircleFilled, InfoCircleFilled, LeftOutlined } from '@ant-design/icons';
import { Divider, Empty } from 'antd';
import { nanoid } from 'nanoid';
import OntologyObjectType from '@/services/object/type';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Text, Table, Select, Button, IconFont } from '@/web-library/common';
import styles from './index.module.less';
import IndexSetting from './IndexSetting';
import { TYPE_OPTIONS } from '../ObjectCreateAndEdit/AttrDef';

const canSettingTypes = ['string', 'vector', 'text'];

const ObjectSetting = () => {
  const { id } = useParams<{ id: string }>();
  const knId = localStorage.getItem('KnowledgeNetwork.id')!;
  const { modal } = HOOKS.useGlobalContext();
  const history = useHistory();
  // 使用全局 Hook 获取国际化常量
  const { OBJECT_INDEX_STATE_OPTIONS } = HOOKS.useConstants();

  const { pagination, onUpdateState } = HOOKS.usePageStateNew();

  const [isLoading, setIsLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<any>({ name_pattern: '', type: '', state: '' });
  const [basicValue, setBasicValue] = useState<OntologyObjectType.BasicInfo>(); // 基本信息的值
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [indexSettingOpen, setIndexSettingOpen] = useState(false);
  const [indexSettingValues, setIndexSettingValues] = useState<any>({});

  useEffect(() => {
    getList();
  }, []);

  const goBack = () => {
    history.goBack();
  };

  /** 获取属性列表 */
  const getList = async () => {
    try {
      const result = await SERVICE.object.getDetail(knId, [id]);
      const data = result?.[0];
      if (!data) return;
      const { name, tags, comment, icon, color, data_properties, logic_properties = [], primary_keys = [], display_key = '' } = data;
      setBasicValue({ name, id, tags, comment, icon, color });
      const mergeData = data_properties.map((item: any) => ({
        ...item,
        id: nanoid(),
        primary_key: primary_keys.includes(item.name),
        display_key: item.name === display_key,
      }));

      const sortedData = mergeData.sort((a, b) => {
        const aCan = canSettingTypes.includes(a.type);
        const bCan = canSettingTypes.includes(b.type);
        if (aCan && !bCan) return -1;
        if (!aCan && bCan) return 1;
        return 0;
      });
      setDataSource(sortedData);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeFilter = (values: any) => {
    if (values.type === undefined) {
      values.type = '';
    }
    if (values.state === undefined) {
      values.state = '';
    }
    setFilterValues({ ...values });
  };

  const filterDataSource = useMemo(() => {
    const { name_pattern, type, state } = filterValues;
    return dataSource.filter((item) => {
      const nameMatch = name_pattern ? item.name.includes(name_pattern) : true;
      const stateMatch = state ? item.state === state : true;
      const typeMatch = type ? item.type === type : true;
      return nameMatch && stateMatch && typeMatch;
    });
  }, [dataSource, filterValues]);

  const onTableChange = (paginationParams: any) => {
    const { current, pageSize } = paginationParams;
    const state = { page: current, limit: pageSize };
    onUpdateState(state);
  };

  const checkIsSetting = (config: any) => {
    if (!config || typeof config !== 'object') return false;
    const { keyword_config, fulltext_config, vector_config } = config;
    return keyword_config.enabled || fulltext_config.enabled || vector_config.enabled;
  };

  const columns: any[] = [
    {
      title: intl.get('Global.attributeName'),
      dataIndex: 'name',
      width: 280,
      fixed: 'left',
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div className={styles.propertyTitle}>
          <div>{value}</div>
          {record.primary_key && <div className={styles.keyTag}>{intl.get('Global.primaryKey')}</div>}
          {record.display_key && <div className={styles.titleTag}>{intl.get('Global.title')}</div>}
        </div>
      ),
    },
    {
      title: intl.get('Global.attributeDisplayName'),
      dataIndex: 'display_name',
      width: 280,
      __selected: true,
    },
    {
      title: intl.get('Global.attributeType'),
      dataIndex: 'type',
      width: 160,
      __selected: true,
    },
    {
      title: intl.get('Global.isConfigured'),
      dataIndex: 'state',
      width: 160,
      __selected: true,
      render: (value: string, record: any) => {
        if (canSettingTypes.includes(record.type)) {
          if (checkIsSetting(record.index_config)) {
            return (
              <div className={styles.stateBox}>
                <CheckCircleFilled style={{ color: '#52C41A' }} />
                <div style={{ color: 'rgb(125, 125, 125)' }}>{intl.get('Global.configured')}</div>
              </div>
            );
          } else {
            return (
              <div className={styles.stateBox}>
                <InfoCircleFilled style={{ color: 'rgb(191, 191, 191)' }} />
                <div style={{ color: 'rgb(186, 186, 186)' }}>{intl.get('Global.notConfigured')}</div>
              </div>
            );
          }
        } else {
          return (
            <div className={styles.stateBox}>
              <div style={{ color: 'rgb(186, 186, 186)' }}>--</div>
            </div>
          );
        }
      },
    },
    {
      title: intl.get('Object.indexConfiguration'),
      dataIndex: 'index',
      width: 100,
      __selected: true,
      align: 'center',
      render: (_: any, record: any) => (
        <Button disabled={!canSettingTypes.includes(record.type)} type="link" onClick={() => handleSetting(record)}>
          {intl.get('Global.setting')}
        </Button>
      ),
    },
  ];

  const handleSetting = (record: any) => {
    setSelectedRows([record]);
    setSelectedRowKeys([record.name]);
    setIndexSettingValues({
      names: [record.name],
      index_config: record.index_config || {},
    });
    setIndexSettingOpen(true);
  };

  const rowSelection = {
    selectedRowKeys,
    rowKey: (record: any) => record.name,
    onChange: (rowKeys: any, rows: any): void => {
      setSelectedRowKeys(rowKeys);
      setSelectedRows(rows);
    },
    getCheckboxProps: (row: any): Record<string, any> => ({
      disabled: !canSettingTypes.includes(row.type),
    }),
  };

  const handleSubmit = async (values: any) => {
    const params = selectedRows.map((item: any) => {
      item.index_config = values;
      return item;
    });

    try {
      await SERVICE.object.updateObjectIndex(
        knId,
        id,
        selectedRows.map((item: any) => item.name),
        params
      );
      setIndexSettingOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className={styles.mainContainer}>
        <div className={styles.headerBox}>
          <div className="g-pointer g-flex-align-center" onClick={goBack}>
            <LeftOutlined style={{ marginTop: 2, marginRight: 6 }} />
            <Text>{intl.get('Global.exit')}</Text>
          </div>
          <Divider type="vertical" style={{ margin: '0 12px' }} />
          <div className={styles.headerInfo}>
            <div className={styles.headerInfoTitle}>{intl.get('Object.indexConfiguration')}:</div>
            <div className={styles.headerInfoIcon} style={{ backgroundColor: basicValue?.color }}>
              <IconFont type="icon-dip-kinship-full" />
            </div>
            <div className={styles.headerInfoContent}>{basicValue?.name || '-'}</div>
          </div>
        </div>
        <div className={styles.contentBox}>
          <div className={styles.contentBoxTitle}>
            <div>{intl.get('Object.attribute')}</div>
            <div className={styles.contentBoxTitleCount}>{filterDataSource?.length}</div>
          </div>
          <div className={styles.contentBoxContent}>
            <Table.PageTable
              canResize={false}
              name="objectIndex"
              rowKey="id"
              columns={columns}
              loading={isLoading}
              dataSource={filterDataSource}
              pagination={pagination}
              onChange={onTableChange}
              // rowSelection={rowSelection}
              locale={{
                emptyText:
                  filterValues.name_pattern || filterValues.type !== '' || filterValues.state !== '' ? (
                    <Empty image={noSearchResultImage} description={intl.get('Object.emptyNoAttribute')} />
                  ) : (
                    <Empty image={emptyImage} description={intl.get('Object.emptyNoAttributeData')} />
                  ),
              }}
            >
              <Table.Operation
                nameConfig={{ key: 'name_pattern', placeholder: intl.get('Global.searchName') }}
                initialFilter={filterValues}
                onChange={onChangeFilter}
                onRefresh={() => {
                  onUpdateState({ page: 1, limit: pagination.pageSize });
                  getList();
                }}
              >
                {/* <Button type="primary" icon={<SettingOutlined />}>
                                    <span>设置</span>
                                </Button> */}
                <Select.LabelSelect
                  key="type"
                  label={intl.get('Global.attributeType')}
                  style={{ width: 190 }}
                  options={[{ label: intl.get('Global.all'), value: '' }, ...TYPE_OPTIONS]}
                  allowClear
                />
                <Select.LabelSelect key="state" label={intl.get('Global.status')} style={{ width: 190 }} options={OBJECT_INDEX_STATE_OPTIONS} allowClear />
              </Table.Operation>
            </Table.PageTable>
          </div>
        </div>
      </div>
      <IndexSetting open={indexSettingOpen} values={indexSettingValues} onClose={() => setIndexSettingOpen(false)} onOK={handleSubmit} />
    </>
  );
};

export default ObjectSetting;
