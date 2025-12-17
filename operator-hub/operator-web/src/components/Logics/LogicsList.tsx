import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useState, useCallback, startTransition, useEffect, useMemo } from 'react';
import { Button, Select, Space, Tabs, Empty, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { TabsProps, SelectProps } from 'antd';
import '../OperatorList/style.less';
import { useMicroWidgetProps } from '@/hooks';
import SearchInput from '../SearchInput';
import { getOperatorCategory, getOperatorList, getOperatorMarketList } from '@/apis/agent-operator-integration';
import empty from '@/assets/images/empty2.png';
import { postResourceTypeOperation } from '@/apis/authorization';
import AuthorizeIcon from '@/assets/images/authorize.svg';
import { componentsPermConfig, transformArray } from '@/utils/permConfig';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import OperatorCard from '../OperatorList/OperatorCard';
import CreateButton from './CreateButton';

const LogicsList: React.FC<{ isPluginMarket?: boolean; activeKey: string }> = ({
  isPluginMarket = false,
  activeKey,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('activeTab') || OperatorTypeEnum.Operator);
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

  const tabItems: TabsProps['items'] = [{ key: OperatorTypeEnum.Operator, label: '算子' }];

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
      message.error(error?.description);
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
        resource_types: [OperatorTypeEnum.Operator],
      });
      setPermConfigInfo(transformArray(data));
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleMenuClick = () => {
    componentsPermConfig({ id: '*', name: '', type: OperatorTypeEnum.Operator }, microWidgetProps);
  };

  return (
    <div className="operator-list">
      <Tabs className="operator-list-tabs" activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      {/* 头部 */}
      <div className="operator-list-title">
        {!isPluginMarket ? (
          <div>
            {permConfigInfo?.[OperatorTypeEnum.Operator]?.includes(PermConfigTypeEnum.Create) && (
              <CreateButton fetchInfo={fetchInfo} />
            )}
            {permConfigInfo?.[OperatorTypeEnum.Operator]?.includes(PermConfigTypeEnum.Authorize) && (
              <Button icon={<AuthorizeIcon />} style={{ marginLeft: '8px' }} onClick={handleMenuClick}>
                权限配置
              </Button>
            )}
          </div>
        ) : (
          <div></div>
        )}

        <div className="operator-list-filter">
          <Space size="middle" style={{ flexShrink: 0, flexWrap: 'wrap' }}>
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

            <SearchInput value={searchText} placeholder="搜索算子名称" onSearch={handleSearchChange} allowClear />
            <Button icon={<ReloadOutlined />} onClick={() => fetchInfo()} style={{ border: 'none' }} />
          </Space>
        </div>
      </div>

      {operatorList?.length ? (
        <OperatorCard
          loading={loading}
          params={{ activeTab, isPluginMarket, activeKey }}
          fetchInfo={fetchInfo}
          hasMore={hasMore}
          operatorList={operatorList}
          fetchMoreData={fetchMoreData}
        />
      ) : (
        <Empty image={<img src={empty} />} className="operator-list-empty" />
      )}
    </div>
  );
};

export default LogicsList;
