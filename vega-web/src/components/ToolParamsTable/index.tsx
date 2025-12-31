import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback, useMemo } from 'react';
import { Select, Table, Empty, Space, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { extractParamsByToolList } from '@/utils/extractSchemaParams';
import ActionType from '@/services/action/type';
import objectApi from '@/services/object';
import toolApi from '@/services/tool';
import toolParamEmpty from '@/assets/images/action/action_type_tool_param_empty.svg';
import HOOKS from '@/hooks';
import styles from './index.module.less';
import { getInputParamsFromToolOpenAPISpec, getAllExpandableKeys, transformInput } from './utils';

interface ParamTableProps {
  boxId?: string;
  toolId?: string;
  onChange?: (params: any) => void;
  value?: any[];
  actionSource?: any;
  obId: string;
  knId: string;
  overflowYHeight?: number;
  disabled?: boolean;
}

interface TableDataItem {
  key: string;
  name: string;
  type: string;
  source: string;
  description?: string;
  value_from?: ActionType.ValueFrom;
  value?: any;
  children?: TableDataItem[];
  error?: Record<string, string>;
}

const TABLE_CONFIG = {
  COLUMNS: {
    NAME: { width: 'auto' },
    TYPE: { width: 100 },
    VALUE: { width: 320 },
  },
} as const;

const VALUE_FROM_OPTIONS = [
  { label: '固定值', value: ActionType.ValueFrom.Const },
  { label: '数据属性', value: ActionType.ValueFrom.Property },
  { label: '动态输入', value: ActionType.ValueFrom.Input },
];

const ToolParamsTable = forwardRef(({ onChange, value, actionSource, overflowYHeight, disabled, obId, knId }: ParamTableProps, ref) => {
  const { message } = HOOKS.useGlobalContext();

  const isMounted = useRef<boolean>(false);

  const [tableData, setTableData] = useState<any[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 错误处理函数
  const handleApiError = useCallback(
    (error: any) => {
      if (error?.description) {
        message.error(error.description);
      }
    },
    [message]
  );

  // 数据处理函数
  const updateTableValue = useCallback((key: string, updateValue: Record<string, any>) => {
    const processNode = (item: TableDataItem): TableDataItem => {
      if (item.key === key) {
        return { ...item, ...updateValue };
      }
      if (item.children?.length) {
        return {
          ...item,
          children: item.children.map(processNode),
        };
      }
      return item;
    };

    setTableData((prev) => prev.map(processNode));
  }, []);

  const extractLeafParams = useCallback((data: TableDataItem[]): any[] => {
    if (!data) return [];

    return data.reduce((params: any[], item: TableDataItem) => {
      if (item.children?.length) {
        return [...params, ...extractLeafParams(item.children)];
      }

      return [
        ...params,
        {
          name: item.key,
          value_from: item.value_from,
          value: item.value,
          type: item.type,
          source: item.source,
        },
      ];
    }, []);
  }, []);

  // 验证函数
  const validateParams = useCallback(() => {
    let hasError = false;
    setTableData((prev) =>
      prev.map((item) => {
        switch (item.value_from) {
          case ActionType.ValueFrom.Input:
            // 动态输入，不校验value
            return item;

          case ActionType.ValueFrom.Const:
          case ActionType.ValueFrom.Property:
            hasError = !item.value;
            return { ...item, error: hasError ? { 'col-2': '此项不能为空' } : undefined };

          default:
            hasError = true;
            return { ...item, error: { 'col-1': '此项不能为空' } };
        }
      })
    );

    return {
      isValid: !hasError,
    };
  }, []);

  // 处理参数的公共函数
  const processParams = useCallback(
    (inputParams: any[]) => {
      if (!disabled) {
        // 编辑：使用inputParams作为主数据，同时value作为辅助补充信息
        const valueMapByName = _.keyBy(value || [], 'name');

        const processNode = (item: any): any => {
          // 根据参数结构选择合适的键名
          const lookupKey = item.key || item.name;
          const matchedParam = valueMapByName[lookupKey];

          // 处理子节点
          const children = item.children?.length ? item.children.map(processNode) : undefined;

          return {
            ...item,
            value_from: matchedParam?.value_from || ActionType.ValueFrom.Input,
            value: matchedParam?.value,
            children,
          };
        };

        const newTableData = inputParams.map(processNode);
        setTableData(newTableData);
        setExpandedKeys(getAllExpandableKeys(newTableData));
      } else {
        // 查看：使用value作为主数据，同时inputParams作为辅助补充信息
        const formatInputParams: any[] = [];
        const loop = (item: any, parentKey: string = '') => {
          const key = parentKey ? `${parentKey}.${item.name}` : item.name;

          if (item.children?.length) {
            item.children.forEach((child: any) => loop(child, key));
          } else {
            formatInputParams.push({ ...item, key });
          }
        };
        inputParams.forEach((param) => loop(param));

        const inputParamsMapByName = _.keyBy(formatInputParams, 'key');

        const newTableData = transformInput(
          value?.map((item) => {
            const matchedParam = inputParamsMapByName[item.name];
            if (matchedParam) {
              return {
                ...item,
                description: matchedParam.description,
              };
            }
            return item;
          }) || []
        );
        setTableData(newTableData);
        setExpandedKeys(getAllExpandableKeys(newTableData));
      }
    },
    [disabled, value]
  );

  // 获取MCP的参数
  const fetchMcpParams = async ({ mcpId, tool_name }: { mcpId?: string; tool_name?: string }) => {
    if (!mcpId || !tool_name) {
      setTableData([]);
      return;
    }

    try {
      const { tools } = await toolApi.getMcpTools(mcpId, { page: 1, page_size: 100, status: 'enabled', all: true });
      // 获取工具的输入参数
      const inputParams = extractParamsByToolList(tools, tool_name);
      // 处理参数
      processParams(inputParams);
    } catch (error: any) {
      handleApiError(error);
    }
  };

  // API调用：获取工具的参数
  const fetchToolParams = async ({ boxId, toolId }: { boxId?: string; toolId?: string }) => {
    if (!boxId || !toolId) {
      setTableData([]);
      return;
    }

    try {
      // 请求工具的参数
      const toolResponse: any = await toolApi.getToolDetail(boxId, toolId);
      // 获取工具的输入参数
      const inputParams: any[] = getInputParamsFromToolOpenAPISpec(toolResponse.metadata?.api_spec);
      // 处理参数
      processParams(inputParams);
    } catch (error: any) {
      handleApiError(error);
    }
  };

  // API调用：获取对象类属性
  const fetchObjectTypeProperties = async (knId: string, obId: string) => {
    try {
      if (knId && !disabled) {
        const [detail] = await objectApi.getDetail(knId, [obId]);

        setPropertyOptions(detail.data_properties.map((item) => ({ label: item.display_name, value: item.name })));
      }
    } catch (error: any) {
      handleApiError(error);
    }
  };

  // 处理单个项展开/折叠
  const handleRowExpand = (expanded: boolean, record: any) => {
    setExpandedKeys((prev) => (expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)));
  };

  // 表格列配置
  const columns = useMemo(
    () => [
      {
        title: '参数名称',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record: any) => (
          <div className="g-ellipsis-1">
            <div className="g-c-title g-ellipsis-1" title={value}>
              {value}
            </div>
            <div className={classNames('g-c-text-sub g-ellipsis-1', styles['description'])} title={record.description}>
              {record.description}
            </div>
          </div>
        ),
      },
      {
        title: '参数类型',
        dataIndex: 'type',
        key: 'type',
        width: TABLE_CONFIG.COLUMNS.TYPE.width,
      },
      {
        title: '来源',
        dataIndex: 'source',
        key: 'source',
        width: TABLE_CONFIG.COLUMNS.TYPE.width,
        render: (value: string, record: any) => (record.children ? '' : value || '--'),
      },
      {
        title: '值',
        dataIndex: 'value_from',
        key: 'value_from',
        width: TABLE_CONFIG.COLUMNS.VALUE.width,
        render: (value: ActionType.ValueFrom, record: any) => {
          // 当有children时，这一列显示空，这里给了高度32，是为了限制每一行的最小高度是32
          if (record.children) return <div style={{ height: 32 }} />;

          const col1Error = record.error?.['col-1'];
          const col2Error = record.error?.['col-2'];

          return (
            <Space.Compact className={styles['value-from']}>
              <Tooltip title={col1Error || ''}>
                <Select
                  placeholder="请选择"
                  className={styles['col-1']}
                  options={VALUE_FROM_OPTIONS}
                  status={col1Error ? 'error' : ''}
                  style={col1Error ? { zIndex: 1 } : {}}
                  value={value}
                  onChange={(value_from) => {
                    // 更换value_from，同步清除value和error
                    updateTableValue(record.key, { value_from, error: undefined, value: undefined });
                  }}
                  disabled={disabled}
                />
              </Tooltip>
              <Tooltip title={col2Error || ''}>
                {value === ActionType.ValueFrom.Const ? (
                  <Input
                    placeholder="请输入"
                    className={styles['col-2']}
                    status={col2Error ? 'error' : ''}
                    value={record.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateTableValue(record.key, { value, error: undefined });
                    }}
                    disabled={disabled}
                  />
                ) : value === ActionType.ValueFrom.Property ? (
                  <Select
                    placeholder="请选择"
                    className={styles['col-2']}
                    status={col2Error ? 'error' : ''}
                    options={propertyOptions}
                    value={record.value}
                    onChange={(value) => {
                      updateTableValue(record.key, { value, error: undefined });
                    }}
                    disabled={disabled}
                  />
                ) : (
                  <Input disabled className={styles['col-2']} status={col2Error ? 'error' : ''} />
                )}
              </Tooltip>
            </Space.Compact>
          );
        },
      },
    ],
    [disabled, updateTableValue, propertyOptions]
  );

  // 使用boxId和toolId请求获取工具的param
  useEffect(() => {
    // 工具箱
    if (actionSource?.box_id && actionSource?.tool_id) {
      fetchToolParams({ boxId: actionSource?.box_id, toolId: actionSource?.tool_id });
    }
    // mcp
    if (actionSource?.mcp_id) {
      fetchMcpParams({ mcpId: actionSource?.mcp_id, tool_name: actionSource?.tool_name });
    }
  }, [actionSource]);

  // 使用绑定的对象类id获取它的属性
  useEffect(() => {
    if (!obId || !knId) return;

    fetchObjectTypeProperties(knId, obId);
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const params = extractLeafParams(tableData);
    onChange?.(params);
  }, [tableData]);

  // 暴露API给父组件
  useImperativeHandle(ref, () => ({
    validate: validateParams,
  }));

  // 空状态配置
  const emptyStateConfig =
    disabled || actionSource?.tool_id
      ? {}
      : {
          locale: {
            emptyText: <Empty image={<img src={toolParamEmpty} />} description="请选择工具后设置参数" />,
          },
        };

  return (
    <Table
      className={styles['tool-param-table']}
      dataSource={tableData}
      columns={columns}
      pagination={false}
      expandable={{
        expandRowByClick: true,
        expandedRowKeys: expandedKeys, // 受控状态：绑定展开的 key 数组
        onExpand: handleRowExpand, // 监听展开/折叠事件，同步状态
      }}
      {...(overflowYHeight ? { scroll: { y: overflowYHeight } } : {})}
      {...emptyStateConfig}
    />
  );
});

export default ToolParamsTable;
