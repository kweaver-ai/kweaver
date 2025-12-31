import { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Input, Popover, Radio, RadioChangeEvent, Select, Table, Tooltip, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { DataViewQueryType } from '@/components/CustomDataViewSource';
import { getObjectArrayIntersectionByKeys, nanoId } from '@/utils/dataView';
import HOOKS from '@/hooks';
import { IconFont } from '@/web-library/common';
import FormHeader from '../FormHeader';
import styles from './index.module.less';
import { useDataViewContext } from '../../../context';

enum OutType {
  DISTINCT = 'distinct',
  ALL = 'all',
}

const FiledMerge = () => {
  const { dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView } = useDataViewContext();
  const [outType, setOutType] = useState<OutType>(OutType.ALL);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [nodeList, setNodeList] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const tableBoxRef = useRef<HTMLDivElement>(null);
  const tableBoxSize = HOOKS.useSize(tableBoxRef);
  const tableScrollY = tableBoxSize?.height ? tableBoxSize.height - 54 : 500;

  const { updateDataViewNode } = HOOKS.useDataView({
    dataViewTotalInfo,
    setDataViewTotalInfo,
    setSelectedDataView,
  });

  useEffect(() => {
    const inputNodeList = dataViewTotalInfo?.data_scope?.filter((item: any) => selectedDataView?.input_nodes?.includes(item.id));
    setNodeList(inputNodeList);
    if (dataViewTotalInfo?.query_type === DataViewQueryType.SQL) {
      const unionFields = selectedDataView?.config?.union_fields || [];
      const outputFields = selectedDataView?.output_fields || [];
      const dataSource: any = [];
      if (outputFields.length > 0) {
        outputFields.forEach((item: any, index: number) => {
          const dataSourceItem: any = { rowId: nanoId(), outputName: item.name, type: item.type };
          inputNodeList.forEach((nodeItem: any, nodeIndex: number) => {
            dataSourceItem[nodeItem.id] = unionFields[nodeIndex][index]?.field || undefined;
          });
          dataSource.push(dataSourceItem);
        });
      } else {
        const inputFiledArr: any[] = [];
        inputNodeList.forEach((nodeItem: any) => {
          inputFiledArr.push(nodeItem.output_fields);
        });
        // 获取inputFiledArr中的交集
        const intersectionFields = getObjectArrayIntersectionByKeys(inputFiledArr, ['name', 'type']);

        intersectionFields.forEach((item: any) => {
          const dataSourceItem: any = { rowId: nanoId(), outputName: item.name, type: item.type };
          inputNodeList.forEach((nodeItem: any) => {
            dataSourceItem[nodeItem.id] = item.name;
            handleFieldSelect(nodeItem.id, item.name, dataSourceItem);
          });
          dataSource.push(dataSourceItem);
        });
      }
      setDataSource(dataSource);
    } else {
      const outputFieldsMerge: any[] = [];
      inputNodeList.forEach((nodeItem: any, nodeIndex: number) => {
        nodeItem.output_fields.forEach((fieldItem: any) => {
          let error = false;
          const sameNameFieldsIndex = outputFieldsMerge.findIndex((item) => item.name === fieldItem.name);
          if (sameNameFieldsIndex !== -1) {
            if (outputFieldsMerge[sameNameFieldsIndex].type === fieldItem.type) {
              return;
            } else {
              // 如果名称相同，类型不同，则提示错误
              error = true;
              outputFieldsMerge[sameNameFieldsIndex].error = true;
            }
          }

          outputFieldsMerge.push({
            name: fieldItem.name,
            type: fieldItem.type,
            original_name: fieldItem.original_name,
            display_name: fieldItem.display_name,
            comment: fieldItem.comment,
            error,
          });
        });
      });
      setDataSource(outputFieldsMerge);
    }
  }, [dataViewTotalInfo, selectedDataView]);

  const handleOutTypeChange = (e: RadioChangeEvent) => {
    setOutType(e.target.value);
  };

  const handleAddRow = () => {
    setDataSource((prev) => [{ rowId: nanoId() }, ...prev]);
  };

  const handleDeleteRow = (rowId: string) => {
    setDataSource((prev) => prev.filter((item: any) => item.rowId !== rowId));
  };

  const handleFieldSelect = (nodeId: string, value: string, record: any) => {
    if (!value) {
      setSelectedFields((prev) => prev.filter((item) => !(item.rowId === record.rowId && item.nodeId === nodeId)));
    } else {
      record[`${nodeId}`] = value;
      // 获取字段类型
      record['type'] = record.type || nodeList.find((item: any) => item.id === nodeId)?.output_fields?.find((field: any) => field.name === value)?.type || '';

      setSelectedFields((prev) => [
        ...prev.filter((item) => !(item.rowId === record.rowId && item.nodeId === nodeId)),
        { rowId: record.rowId, nodeId, fieldName: value },
      ]);
    }
    setDataSource((prev) => prev.map((item) => (item.rowId === record.rowId ? record : item)));
  };

  const radioOptions = [
    {
      label: (
        <div className={styles.radioItem}>
          <span>{intl.get('CustomDataView.FieldMerge.keepAllRows')}</span>
          <Tooltip title={intl.get('CustomDataView.FieldMerge.keepAllRowsTooltip')}>
            <IconFont type="icon-dip-tishi" />
          </Tooltip>
        </div>
      ),
      value: OutType.ALL,
    },
    {
      label: (
        <div className={styles.radioItem}>
          <span>{intl.get('CustomDataView.FieldMerge.removeDuplicates')}</span>
          <Tooltip title={intl.get('CustomDataView.FieldMerge.removeDuplicatesTooltip')}>
            <IconFont type="icon-dip-tishi" />
          </Tooltip>
        </div>
      ),
      value: OutType.DISTINCT,
    },
  ];

  const validateParams = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    // 校验每个字段合并规则
    dataSource.forEach((record, index) => {
      if (!record.outputName || record.outputName.trim() === '') {
        newErrors[`${record.rowId}_outputName`] = intl.get('CustomDataView.FieldMerge.outputFieldNameRequired');
        valid = false;
      }

      // 校验每个节点选择的字段
      nodeList.forEach((node) => {
        const fieldName = record[node.id];
        if (!fieldName || fieldName.trim() === '') {
          newErrors[`${record.rowId}_${node.id}`] = intl.get('CustomDataView.FieldMerge.nodeFieldRequired');
          valid = false;
        }
      });
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = () => {
    if (dataViewTotalInfo?.query_type === DataViewQueryType.SQL) {
      if (dataSource.length === 0) {
        message.error(intl.get('CustomDataView.FieldMerge.addMergeRule'));
        return;
      }
      const valid = validateParams();

      if (!valid) {
        message.error(intl.get('CustomDataView.FieldMerge.completeMergeConfig'));
        return;
      }

      const union_fields: any[] = [];

      nodeList.forEach((node, index) => {
        union_fields[index] = [];
        dataSource.forEach((record) => {
          if (record[node.id]) {
            union_fields[index].push({ field: record[node.id], value_from: 'field' });
          }
        });
      });

      const outputFields: any[] = dataSource.map((record) => ({
        name: record.outputName,
        original_name: record.outputName,
        display_name: record.outputName,
        type: record.type,
      }));

      const newNodeData = {
        ...selectedDataView,
        config: {
          ...selectedDataView?.config,
          union_type: outType,
          union_fields: union_fields,
        },
        output_fields: outputFields,
        node_status: 'success',
      };
      setLoading(true);
      updateDataViewNode(newNodeData, selectedDataView.id).finally(() => {
        setLoading(false);
      });
    } else {
      const newNodeData = {
        ...selectedDataView,
        config: {
          ...selectedDataView?.config,
          union_type: outType,
        },
        output_fields: dataSource.filter((item) => !item.error),
        node_status: 'success',
      };
      setLoading(true);
      updateDataViewNode(newNodeData, selectedDataView.id).finally(() => {
        setLoading(false);
      });
    }
  };

  const columns: ColumnsType<any> = useMemo(() => {
    if (dataViewTotalInfo?.query_type === DataViewQueryType.SQL) {
      return [
        {
          title: intl.get('CustomDataView.FieldMerge.outputFieldName'),
          dataIndex: 'outputName',
          key: 'outputName',
          fixed: 'left',
          width: 280,
          render: (text, record: any, index) => {
            return (
              <div className={styles.resultItem}>
                <Input
                  placeholder={intl.get('CustomDataView.FieldMerge.outputFieldNamePlaceholder')}
                  maxLength={255}
                  style={{ width: '100%' }}
                  defaultValue={record.outputName}
                  value={record.outputName}
                  onChange={(e) => {
                    record.outputName = e.target.value;
                    setDataSource((prev) => prev.map((item) => (item.rowId === record.rowId ? record : item)));
                  }}
                  status={errors[`${record.rowId}_outputName`] ? 'error' : undefined}
                />
                <div className={styles.rowNameSplit} />
              </div>
            );
          },
        },
        ...nodeList.map((nodeItem, nodeIndex) => ({
          title: (
            <div>
              <IconFont type="icon-dip-color-zuzhijiegou2" style={{ marginRight: 4 }} />
              {nodeItem.title}
            </div>
          ),
          dataIndex: `${nodeItem.id}`,
          key: `${nodeItem.id}`,
          ellipsis: true,
          width: 280,
          render: (_: any, record: any, index: any) => {
            return (
              <div className={styles.resultItem}>
                <Select
                  value={record[`${nodeItem.id}`]}
                  onChange={(value) => {
                    handleFieldSelect(nodeItem.id, value, record);
                  }}
                  style={{ width: '100%' }}
                  placeholder={intl.get('CustomDataView.FieldMerge.selectFieldName')}
                  allowClear
                  showSearch
                  options={
                    nodeItem?.output_fields?.map((item: any) => ({
                      label: (
                        <>
                          <span>{item.name}</span>
                          <span style={{ color: '#999', marginLeft: 4 }}>({item.type})</span>
                        </>
                      ),
                      value: item.name,
                      disabled: selectedFields.some((field) => field.nodeId === nodeItem.id && field.fieldName === item.name),
                    })) || []
                  }
                  status={errors[`${record.rowId}_${nodeItem.id}`] ? 'error' : undefined}
                  getPopupContainer={(): HTMLElement => mainContainerRef.current as HTMLElement}
                />
                <div className={styles.rowSelectRightSplit} hidden={nodeIndex === nodeList.length - 1} />
              </div>
            );
          },
        })),
        {
          title: '',
          fixed: 'right',
          key: 'action',
          width: 60,
          render: (text, record, index) => {
            return (
              <div className={styles.actionBox}>
                <IconFont type="icon-dip-trash" onClick={() => handleDeleteRow(record.rowId)} />
                <IconFont type="icon-dip-add" onClick={() => handleAddRow()} />
              </div>
            );
          },
        },
      ];
    } else {
      return [
        {
          title: intl.get('Global.fieldName'),
          dataIndex: 'name',
          key: 'name',
          ellipsis: true,
          render: (text: string, record: any) => {
            return (
              <div>
                {record.error ? (
                  <div className={styles.errorBox}>
                    <span>{text}</span>
                    <Popover
                      placement="topRight"
                      getPopupContainer={() => mainContainerRef.current as HTMLElement}
                      title={intl.get('Global.tipTitle')}
                      content={intl.get('CustomDataView.FieldMerge.fieldTypeConflictTip')}
                    >
                      <ExclamationCircleOutlined />
                    </Popover>
                  </div>
                ) : (
                  <span>{text}</span>
                )}
              </div>
            );
          },
        },
        {
          title: intl.get('Global.fieldDisplayName'),
          dataIndex: 'display_name',
          key: 'display_name',
        },
        {
          title: intl.get('Global.fieldType'),
          dataIndex: 'type',
          key: 'type',
        },
      ];
    }
  }, [dataViewTotalInfo, nodeList, selectedFields]);

  return (
    <div className={styles.mainBox} ref={mainContainerRef}>
      <FormHeader
        title={intl.get('CustomDataView.OperateBox.dataMerge')}
        icon="icon-dip-color-shujuhebingsuanzi"
        onSubmit={handleSubmit}
        onCancel={() => setSelectedDataView(null)}
        loading={loading}
      />
      <div className={styles.contentBox}>
        {dataViewTotalInfo?.query_type === DataViewQueryType.SQL && (
          <div className={styles.topBox}>
            <div className={styles.addItemBtn}>
              <div className={styles.addItemBtnContent} onClick={handleAddRow}>
                <IconFont type="icon-dip-add" />
                <span>{intl.get('CustomDataView.FieldMerge.addMergeRule')}</span>
              </div>
              <div className={styles.tipBox}>
                <IconFont type="icon-dip-color-guizetishi" />
                <span>{intl.get('CustomDataView.FieldMerge.sameTypeFieldsOnly')}</span>
              </div>
            </div>
            <div className={styles.outTypeBox}>
              <span>{intl.get('CustomDataView.FieldMerge.mergeOutputType')}：</span>
              <Radio.Group className={styles.radioGroup} onChange={handleOutTypeChange} value={outType} options={radioOptions}></Radio.Group>
            </div>
          </div>
        )}

        <div className={styles.mergeTableBox} ref={tableBoxRef}>
          {dataSource?.length > 0 ? (
            <Table rowKey="rowId" columns={columns} scroll={{ y: tableScrollY }} dataSource={dataSource} pagination={false} />
          ) : (
            <div className={styles.emptyText}>{intl.get('CustomDataView.FieldMerge.noMergeRules')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiledMerge;
