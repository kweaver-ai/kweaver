import type React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, startTransition, useEffect, useMemo } from 'react';
import { Button, Select, Space, Tabs, Empty, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { TabsProps, SelectProps } from 'antd';
import '../OperatorList/style.less';
import { useMicroWidgetProps } from '@/hooks';
import SearchInput from '../SearchInput';
import {
  getMCPList,
  getMcpMarketList,
  getOperatorCategory,
  getOperatorList,
  getOperatorMarketList,
  getToolBoxList,
  getToolBoxMarketList,
} from '@/apis/agent-operator-integration';
import empty from '@/assets/images/empty2.png';
import { postResourceTypeOperation } from '@/apis/authorization';
import AuthorizeIcon from '@/assets/images/authorize.svg';
import ImportIcon from '@/assets/images/import.svg';
import { componentsPermConfig, transformArray } from '@/utils/permConfig';
import OperatorCard from './OperatorCard';
import CreateMenu from './CreateMenu';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from './types';
import { getOperatorTypeName } from './utils';
import ImportMcpServiceModal from '@/components/MCP/ImportMcpServiceModal';
import ImportToolboxAndOperatorModal from '@/components/OperatorList/ImportToolboxAndOperatorModal';

const OperatorList: React.FC<{ isPluginMarket?: boolean }> = ({ isPluginMarket = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('activeTab') || OperatorTypeEnum.MCP);
  const [publishStatus, setPublishStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const microWidgetProps = useMicroWidgetProps();
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [operatorList, setOperatorList] = useState<any>([]);
  const pageSize = 20; // 每页数据量
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryType, setCategoryType] = useState<any>([]);
  const [permConfigInfo, setPermConfigInfo] = useState<any>({});
  // 导入弹窗状态
  const [importModalOpen, setImportModalOpen] = useState<{ mcp: boolean; toolbox: boolean; operator: boolean }>({
    mcp: false,
    toolbox: false,
    operator: false,
  });

  const tabItems: TabsProps['items'] = [
    { key: OperatorTypeEnum.MCP, label: 'MCP' },
    { key: OperatorTypeEnum.ToolBox, label: '工具' },
    { key: OperatorTypeEnum.Operator, label: '算子' },
  ];

  const statusOptions: SelectProps['options'] = useMemo(
    () =>
      [
        { value: '', label: '全部' },
        { value: OperatorStatusType.Published, label: '已发布' },
        { value: OperatorStatusType.Unpublish, label: '未发布' },
        { value: OperatorStatusType.Offline, label: '已下架' },
        { value: OperatorStatusType.Editing, label: '已发布编辑中' },
      ].filter(option => !(activeTab === OperatorTypeEnum.ToolBox && option.value === OperatorStatusType.Editing)),
    [activeTab]
  );

  // 处理搜索输入 - 使用 startTransition 优化
  const handleSearchChange = useCallback((val: string) => {
    startTransition(() => {
      setSearchText(val);
    });
  }, []);

  // 处理标签页切换
  const handleTabChange = useCallback((key: string) => {
    startTransition(() => {
      setActiveTab(key);
      // 更新 URL 参数
      searchParams.set('activeTab', key);
      setSearchParams(searchParams);
    });
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType([{ category_type: '', name: '全部' }, ...data]);
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
    operationCheck();
  }, []);

  // 处理状态筛选
  const handleStatusChange = useCallback((value: string) => {
    startTransition(() => {
      setPublishStatus(value);
    });
  }, []);

  const categoryChange = useCallback((value: string) => {
    startTransition(() => {
      setCategory(value);
    });
  }, []);

  const fetchInfo = async (page: number = 1) => {
    setLoading(true);
    try {
      let operatorData: any = {};
      const params = {
        page,
        page_size: pageSize,
        // create_user: isPluginMarket ? '' : microWidgetProps?.userid,
        name: searchText,
        status: publishStatus,
        category,
      };

      if (activeTab === OperatorTypeEnum.Operator) {
        const { data, total } = isPluginMarket ? await getOperatorMarketList(params) : await getOperatorList(params);

        operatorData = {
          data: data?.map((item: any) => ({
            ...item,
            description: item.metadata?.description,
          })),
          total,
        };
      }

      if (activeTab === OperatorTypeEnum.ToolBox) {
        const { data, total } = isPluginMarket ? await getToolBoxMarketList(params) : await getToolBoxList(params);

        operatorData = {
          data: data?.map((item: any) => ({
            ...item,
            name: item.box_name,
            description: item.box_desc,
          })),
          total,
        };
      }
      if (activeTab === OperatorTypeEnum.MCP) {
        operatorData = isPluginMarket ? await getMcpMarketList(params) : await getMCPList(params);
      }

      // 首屏加载替换数据，翻页加载合并数据
      if (page === 1) {
        setOperatorList(operatorData?.data || []);
        setHasMore((operatorData?.data?.length || 0) < (operatorData?.total || 0));
      } else {
        setOperatorList((prev: any) => {
          const newList = [...(prev || []), ...(operatorData?.data || [])];
          const hasMoreData = newList.length < (operatorData?.total || 0);
          setHasMore(hasMoreData);
          return newList;
        });
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreData = useCallback(() => {
    if (!hasMore || loading) {
      console.log('[fetchMoreData] Aborted - hasMore:', hasMore, 'loading:', loading);
      return;
    }
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchInfo(nextPage);
  }, [hasMore, loading, currentPage, fetchInfo]);

  useEffect(() => {
    setCurrentPage(1);
    setOperatorList([]);
    fetchInfo();
  }, [activeTab, searchText, publishStatus, category, isPluginMarket]);

  const operationCheck = async () => {
    try {
      const data = await postResourceTypeOperation({
        method: 'GET',
        resource_types: [OperatorTypeEnum.ToolBox, OperatorTypeEnum.MCP, OperatorTypeEnum.Operator],
      });
      setPermConfigInfo(transformArray(data));
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleMenuClick = () => {
    componentsPermConfig({ id: '*', name: '', type: activeTab || OperatorTypeEnum.MCP }, microWidgetProps);
  };

  return (
    <div className="operator-list">
      <div className="operator-list-title">
        {/* 头部 */}
        <Tabs className="operator-list-tabs" activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

        {!isPluginMarket && (
          <div>
            {
              // 检查当前标签页是否有创建权限
              permConfigInfo?.[activeTab || OperatorTypeEnum.MCP]?.includes(PermConfigTypeEnum.Create) && (
                <>
                  <CreateMenu fetchInfo={fetchInfo} activeTab={activeTab} />
                  <Button
                    style={{ marginLeft: '8px' }}
                    icon={<ImportIcon />}
                    onClick={() => {
                      setImportModalOpen({
                        mcp: (activeTab || OperatorTypeEnum.MCP) === OperatorTypeEnum.MCP,
                        toolbox: activeTab === OperatorTypeEnum.ToolBox,
                        operator: activeTab === OperatorTypeEnum.Operator,
                      });
                    }}
                  >
                    导入
                    {getOperatorTypeName(activeTab)}
                  </Button>
                </>
              )
            }
            {
              // 检查当前标签页是否有授权权限
              permConfigInfo?.[activeTab || OperatorTypeEnum.MCP]?.includes(PermConfigTypeEnum.Authorize) && (
                <Button icon={<AuthorizeIcon />} style={{ marginLeft: '8px' }} onClick={handleMenuClick}>
                  权限配置
                </Button>
              )
            }
          </div>
        )}
      </div>

      {/* 筛选项 */}
      <div className="operator-list-filter dip-mb-8">
        <Space size={16} style={{ flexShrink: 0, flexWrap: 'wrap' }}>
          <Space>
            <div>类型：</div>
            <Select value={category} onChange={categoryChange} style={{ width: 120 }}>
              {categoryType?.map((item: any) => (
                <Select.Option key={item.category_type} value={item.category_type}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Space>

          {!isPluginMarket && (
            <Space>
              <div>发布状态：</div>
              <Select
                value={publishStatus}
                onChange={handleStatusChange}
                style={{ width: 120 }}
                options={statusOptions}
              />
            </Space>
          )}
        </Space>
        <Space>
          <SearchInput value={searchText} placeholder="搜索名称" onSearch={handleSearchChange} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => fetchInfo()} style={{ border: 'none' }} />
        </Space>
      </div>
      {operatorList?.length ? (
        <div style={{ height: !isPluginMarket ? 'calc(100vh - 195px)' : 'calc(100vh - 145px)' }}>
          <OperatorCard
            loading={loading}
            params={{ activeTab, isPluginMarket }}
            fetchInfo={fetchInfo}
            hasMore={hasMore}
            operatorList={operatorList}
            fetchMoreData={fetchMoreData}
          />
        </div>
      ) : (
        <Empty image={<img src={empty} />} className="operator-list-empty" />
      )}

      {
        // 导入MCP服务弹窗
        importModalOpen.mcp && (
          <ImportMcpServiceModal
            onCancel={() => {
              setImportModalOpen(prev => ({
                ...prev,
                mcp: false,
              }));
            }}
            onOk={() => {
              fetchInfo();
              // 导入成功后刷新列表
              setImportModalOpen(prev => ({
                ...prev,
                mcp: false,
              }));
            }}
          />
        )
      }

      {
        // 导入工具框和算子弹窗
        (importModalOpen.toolbox || importModalOpen.operator) && (
          <ImportToolboxAndOperatorModal
            activeTab={activeTab as any}
            onCancel={() => {
              setImportModalOpen(prev => ({
                ...prev,
                toolbox: false,
                operator: false,
              }));
            }}
            onOk={() => {
              // 导入成功后刷新列表
              fetchInfo();
              setImportModalOpen(prev => ({
                ...prev,
                toolbox: false,
                operator: false,
              }));
            }}
          />
        )
      }
    </div>
  );
};

export default OperatorList;
