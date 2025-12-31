import { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Button, Input, Form, Switch, Table } from 'antd';
import { arNotification } from '@/components/ARNotification';
import { DataViewQueryType } from '@/components/CustomDataViewSource';
import { INIT_FILTER } from '@/hooks/useConstants';
import api from '@/services/customDataView/index';
import HOOKS from '@/hooks';
import { IconFont } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';
import { useDataViewContext } from '../../../context';
import FormHeader from '../FormHeader';

const isEmptyObject = (obj: any) => {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return Object.keys(obj).length === 0;
};

const FiledSetting = () => {
  const { dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView, setPreviewNode } = useDataViewContext();
  const [form] = Form.useForm();
  const dataFilterRef = useRef<any>(null);
  const [editingKey, setEditingKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [filedList, setFiledList] = useState<any>([]);
  const [switchFilter, setSwitchFilter] = useState<boolean>(false);
  const [switchSelect, setSwitchSelect] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { updateDataViewNode, getNodePreview } = HOOKS.useDataView({
    dataViewTotalInfo,
    setDataViewTotalInfo,
    setSelectedDataView,
    setPreviewNode,
  });

  useEffect(() => {
    if (selectedDataView?.config?.view_id) {
      const viewIds = [selectedDataView?.config?.view_id];
      const outputFields = selectedDataView?.output_fields.map((item: any) => ({ ...item, selected: true })) || [];
      const selectedFields = selectedDataView?.output_fields?.map((item: any) => item.original_name) || [];
      api.getCustomDataViewDetails(viewIds, true).then((viewDetailList: any) => {
        if (viewDetailList?.length > 0) {
          const viewDetail = viewDetailList[0];
          const noSelectedFields = viewDetail?.fields?.filter((item: any) => !selectedFields.includes(item.original_name)) || [];
          setTableData([...outputFields, ...noSelectedFields]);
        }
      });
    }
  }, [selectedDataView?.config?.view_id]);

  useEffect(() => {
    setSwitchFilter(false);

    setTimeout(() => {
      const hasFilters = !isEmptyObject(selectedDataView?.config?.filters);
      setSwitchFilter(hasFilters);
      const filterValue = hasFilters ? selectedDataView?.config.filters : INIT_FILTER;
      form.setFieldValue('dataFilter', filterValue);
    }, 0);

    if (selectedDataView?.output_fields?.length > 0) {
      setFiledList(selectedDataView?.output_fields.map((item: any) => ({ name: item.original_name, type: item.type })) || []);
    }

    if (selectedDataView?.config?.distinct?.enable) {
      setSwitchSelect(true);
    } else {
      setSwitchSelect(false);
    }
  }, [selectedDataView]);

  useEffect(() => {
    if (!switchSelect) {
      setTableData(tableData.map((item: any) => ({ ...item, selected: true })) || []);
    }
  }, [switchSelect]);

  const handleInputSave = (record: any, field: string) => {
    if (!editValue) {
      setEditingKey('');
      return;
    }
    // 字段名重复校验
    if (selectedDataView?.output_fields?.some((item: any) => item.original_name !== record.original_name && item[field] === editValue)) {
      arNotification.error(intl.get('Global.fieldNameCannotRepeat'));
      setEditingKey('');
      return;
    }
    record[field] = editValue;
    setSelectedDataView({
      ...selectedDataView,
      output_fields: selectedDataView?.output_fields?.map((item: any) => (item.original_name === record.original_name ? record : item)) || [],
    });
    setEditingKey('');
  };

  const handleSubmit = () => {
    const filters = switchFilter ? form.getFieldValue('dataFilter') : {};
    const validate = dataFilterRef.current?.validate();
    if (validate) {
      arNotification.error(intl.get('CustomDataView.FieldSetting.pleaseValidateDataFilter'));
      return;
    }

    const selectedFields = tableData.filter((item: any) => item.selected).map((item: any) => item.name || []);

    if (!selectedFields?.length) {
      arNotification.error(intl.get('Global.pleaseSelectAtLeastOneField'));
      return;
    }

    const outputFields = tableData.filter((item: any) => item.selected);

    const newNodeData = {
      ...selectedDataView,
      config: {
        ...selectedDataView?.config,
        filters,
        distinct: { enable: switchSelect, fields: selectedFields },
      },
      output_fields: outputFields,
      node_status: 'success',
    };
    setLoading(true);
    updateDataViewNode(newNodeData, selectedDataView.id).finally(() => {
      setLoading(false);
    });
  };

  const handleNodePreview = async () => {
    if (!selectedDataView) {
      return;
    }
    getNodePreview(selectedDataView, true);
  };

  const filteredDataSource = useMemo(() => {
    if (!searchKeyword) return tableData;

    const keyword = searchKeyword.toLowerCase();
    return tableData.filter((item: any) => item.display_name?.toLowerCase().includes(keyword) || item.name?.toLowerCase().includes(keyword));
  }, [tableData, searchKeyword]);

  const columns = [
    {
      title: intl.get('Global.fieldDisplayName'),
      dataIndex: 'display_name',
      key: 'display_name',
      render: (_: any, record: any) => {
        if (editingKey === record.original_name) {
          return (
            <Input
              defaultValue={record.display_name}
              onBlur={() => handleInputSave(record, 'display_name')}
              onChange={(e) => {
                setEditValue(e.target.value);
              }}
            />
          );
        }
        return <span onClick={() => setEditingKey(record.original_name)}>{record.display_name}</span>;
      },
    },
    {
      title: intl.get('Global.fieldName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: intl.get('Global.fieldType'),
      dataIndex: 'type',
      key: 'type',
    },
  ];

  const rowSelection: any = {
    selectedRowKeys: tableData?.filter((item: any) => item.selected).map((item: any) => item.original_name),
    onChange: (selectedRowKeys: React.Key[]) => {
      setTableData(
        tableData?.map((item: any) => ({
          ...item,
          selected: selectedRowKeys.includes(item.original_name),
        })) || []
      );
    },
  };

  return (
    <div className={styles['setting-form-box']}>
      <FormHeader
        title={intl.get('CustomDataView.OperateBox.viewReference')}
        icon="icon-dip-color-shitusuanzi"
        onSubmit={handleSubmit}
        onCancel={() => setSelectedDataView(null)}
        loading={loading}
      />
      <div className={styles['content-box']}>
        <div className={styles['sub-title']}>{intl.get('Global.viewName')}</div>
        <div className={styles['view-name-box']}>
          <IconFont type="icon-dip-color-shitusuanzi" style={{ fontSize: '20px' }} />
          <div className={styles['view-name']}>{selectedDataView?.title || ''}</div>
          <Button type="link" className={styles['preview-button']} onClick={() => handleNodePreview()}>
            {intl.get('Global.preview')}
          </Button>
        </div>
        <div className={styles['sub-title']}>{intl.get('CustomDataView.dataViewSetting')}</div>
        <div className={styles['config-title-box']}>
          <div className={styles['config-title']}>{intl.get('Global.dataFilter')}</div>
          <Switch
            size="small"
            value={switchFilter}
            onChange={(e) => {
              setSwitchFilter(e);
            }}
          />
          <div className={styles['config-desc']}>{intl.get('CustomDataView.FieldSetting.dataFilterDescription')}</div>
        </div>
        {switchFilter && (
          <Form form={form}>
            <Form.Item name="dataFilter">
              <DataFilter
                ref={dataFilterRef}
                fieldList={filedList}
                required={true}
                transformType={UTILS.formatType}
                maxCount={[10, 10, 10]}
                level={3}
                isFirst
              />
            </Form.Item>
          </Form>
        )}
        {dataViewTotalInfo?.query_type === DataViewQueryType.SQL && (
          <div className={styles['config-title-wrapper']}>
            <div className={styles['config-title-box']}>
              <div className={styles['config-title']}>{intl.get('CustomDataView.FieldSetting.dataDeduplication')}</div>
              <Switch
                size="small"
                value={switchSelect}
                onChange={(e) => {
                  setSwitchSelect(e);
                }}
              />
              <div className={styles['config-desc']}>{intl.get('CustomDataView.FieldSetting.dataDeduplicationDescription')}</div>
            </div>
            {switchSelect && (
              <Input.Search
                style={{ width: '272px' }}
                placeholder={intl.get('Global.searchFieldPlaceholder')}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={setSearchKeyword}
                allowClear
              />
            )}
          </div>
        )}
        {dataViewTotalInfo?.query_type === DataViewQueryType.SQL && switchSelect && (
          <Table
            rowKey={(record) => `${record.original_name}`}
            rowSelection={rowSelection}
            dataSource={filteredDataSource}
            columns={columns}
            pagination={false}
          />
        )}
      </div>
    </div>
  );
};

export default FiledSetting;
