import type React from 'react';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { Layout, Button, Typography, message, Switch, Checkbox, Empty } from 'antd';
import { BarsOutlined, PlusOutlined } from '@ant-design/icons';
import { FixedSizeList as List } from 'react-window';
import './style.less';
import {
  batchDeleteTool,
  getToolBox,
  getToolBoxMarket,
  getToolList,
  toolStatus,
} from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import ToolEmptyIcon from '@/assets/icons/tool-empty.svg';
import ImportIcon from '@/assets/images/import.svg';
import DebugResult from '../OperatorList/DebugResult';
import ToolInfo from '../Tool/ToolInfo';
import MethodTag from '../OperatorList/MethodTag';
import UploadTool from '../Tool/UploadTool';
import { OperateTypeEnum, OperatorTypeEnum, PermConfigTypeEnum, ToolStatusEnum } from '../OperatorList/types';
import EditToolModal from './EditToolModal';
import { useMicroWidgetProps } from '@/hooks';
import { confirmModal } from '@/utils/modal';
import _ from 'lodash';
import DetailHeader from '../OperatorList/DetailHeader';
import { postResourceOperation } from '@/apis/authorization';

const { Sider, Content } = Layout;
const { Paragraph, Text } = Typography;

enum LoadStatusEnum {
  Loading = 'loading',
  LoadingMore = 'loadingMore',
  Success = 'success',
  Error = 'error',
  Empty = 'empty',
}

export default function ToolDetail() {
  const navigate = useNavigate();
  const microWidgetProps = useMicroWidgetProps();
  const [selectedTool, setSelectedTool] = useState<any>({});
  const [toolBoxInfo, setToolBoxInfo] = useState<any>({});
  const [searchParams] = useSearchParams();
  const box_id = searchParams.get('box_id') || '';
  const action = searchParams.get('action') || '';
  const [toolList, setToolList] = useState<any>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [hasMore, setHasMore] = useState(true);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [selectedToolArry, setSelectedToolArry] = useState<any>([]);
  const [editToolModal, setEditToolModal] = useState(false);
  const [changeToolStatus, setChangeToolStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();
  const [toolListTotal, setToolListTotal] = useState(0);
  const [loadStatus, setLoadStatus] = useState<LoadStatusEnum>(LoadStatusEnum.Loading);

  const canModify = useMemo(
    () => action === OperateTypeEnum.Edit && permissionCheckInfo?.includes(PermConfigTypeEnum.Modify),
    [action, permissionCheckInfo]
  );

  useEffect(() => {
    fetchInfo({});
    resourceOperation();
  }, []);

  useEffect(() => {
    if (selectedToolArry?.length) {
      setChangeToolStatus(true);
      for (let i = 0; i < selectedToolArry.length - 1; i++) {
        if (selectedToolArry[i].status !== selectedToolArry[i + 1].status) {
          setChangeToolStatus(false);
          break;
        }
      }
    }
  }, [selectedToolArry]);

  const fetchInfo = async (data?: any) => {
    try {
      const data =
        action === OperateTypeEnum.View
          ? await getToolBoxMarket({
              box_id,
            })
          : await getToolBox({
              box_id,
            });
      setToolBoxInfo(data);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };
  const fetchToolList = async () => {
    try {
      setLoading(true);
      setLoadStatus(page === 1 ? LoadStatusEnum.Loading : LoadStatusEnum.LoadingMore);
      const response = await getToolList({
        box_id,
        page,
        page_size: pageSize,
      });
      setToolList((prev: any) => (page === 1 ? response?.tools : [...prev, ...response?.tools]));
      setSelectedTool(response?.tools[0]);
      setHasMore(response?.tools.length >= pageSize);
      setSelectedToolIds([]);
      setSelectedToolArry([]);
      setToolListTotal(response?.total || 0);
      setLoadStatus((response?.total || 0) === 0 ? LoadStatusEnum.Empty : LoadStatusEnum.Success);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
      setLoadStatus(LoadStatusEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemsRendered = ({ visibleStopIndex }: { visibleStopIndex: number }) => {
    // 当滚动到列表底部附近且有更多数据且不在加载中时，加载更多
    if (visibleStopIndex >= toolList.length - 5 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchToolList();
  }, [page]);

  const clickTool = (item?: any) => {
    setSelectedTool(item);
  };

  const getFetchTool = () => {
    if (page === 1) {
      fetchToolList();
    } else {
      setPage(1);
    }
  };

  const changeStatus = async (data: any) => {
    try {
      const resultArray = _.map(data, (item: any) => ({
        tool_id: item.tool_id,
        status: item?.status === ToolStatusEnum.Disabled ? ToolStatusEnum.Enabled : ToolStatusEnum.Disabled,
      }));
      await toolStatus(box_id, resultArray);
      // getFetchTool();

      // 仅更新toolList中对应项的status
      setToolList(prev =>
        prev.map((item: any) =>
          resultArray.find((data: any) => data.tool_id === item.tool_id)
            ? { ...item, status: resultArray[0].status }
            : item
        )
      );
      setSelectedToolArry(prev =>
        prev.map((item: any) =>
          resultArray.find((data: any) => data.tool_id === item.tool_id)
            ? { ...item, status: resultArray[0].status }
            : item
        )
      );

      message.success(data[0]?.status === ToolStatusEnum.Disabled ? '此工具启用成功' : '此工具禁用成功');
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  // 虚拟列表项渲染
  const ListItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = toolList?.[index];
    const isSelected = selectedTool?.tool_id === item.tool_id;

    return (
      <div style={style}>
        <div className={`side-list-item ${isSelected ? 'side-list-item-select' : ''}`} onClick={() => clickTool(item)}>
          {action === OperateTypeEnum.Edit && permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
            <Checkbox
              checked={selectedToolIds.includes(item.tool_id)}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedToolIds([...selectedToolIds, item.tool_id]);
                  setSelectedToolArry([...selectedToolArry, item]);
                } else {
                  setSelectedToolIds(selectedToolIds.filter(id => id !== item.tool_id));
                  setSelectedToolArry(selectedToolArry.filter((data: any) => data.tool_id !== item.tool_id));
                }
              }}
              onClick={e => e.stopPropagation()}
            />
          )}
          <Text strong className="side-list-item-id">
            {index + 1}
          </Text>
          <div style={{ width: 'calc(100% - 56px)' }}>
            <div className="side-list-item-name">
              <Paragraph ellipsis={{ rows: 1 }} title={item.name} style={{ margin: '0 12px 0 0' }}>
                {item.name}
              </Paragraph>
              {/* <Text >{item.name}</Text> */}
              <MethodTag status={item.metadata?.method} style={{ height: '22px' }} />

              <Switch
                size="small"
                value={item?.status === ToolStatusEnum.Enabled}
                onChange={(val, e) => {
                  e.stopPropagation();
                  changeStatus([item]);
                }}
                style={{ marginLeft: 'auto' }}
                disabled={action !== OperateTypeEnum.Edit}
              />
            </div>
            <Paragraph className="side-list-item-desc" ellipsis={{ rows: 1 }} title={item.description}>
              {item.description}
            </Paragraph>
          </div>
        </div>
      </div>
    );
  };

  const batchDeleteTools = async () => {
    try {
      // 调用API删除选中的工具
      await batchDeleteTool(box_id, { tool_ids: selectedToolIds });
      message.success('删除成功');
      getFetchTool();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const showDeleteConfirm = () => {
    confirmModal({
      title: '删除工具',
      content: '请确认是否删除选中的工具？',
      onOk() {
        batchDeleteTools();
      },
      onCancel() {},
    });
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: box_id,
            type: OperatorTypeEnum.ToolBox,
          },
        ],
      });
      setIsPermissionCheckInfo(data?.[0]?.operation);
    } catch (error: any) {
      console.error(error);
    }
  };

  // 跳转到使用IDE新建工具页面
  const navigateToCreateToolInIDE = useCallback(() => {
    navigate(`/ide/toolbox/${toolBoxInfo?.box_id}/tool/create`);
  }, [toolBoxInfo?.box_id, navigate]);

  // 跳转到使用IDE编辑工具页面
  const navigateToEditToolInIDE = useCallback(
    (toolId: string) => {
      navigate(`/ide/toolbox//${toolBoxInfo?.box_id}/tool/${toolId}/edit`);
    },
    [toolBoxInfo?.box_id, navigate]
  );

  return (
    <div className={classNames('operator-detail', { 'dip-position-fill dip-flex-column': toolListTotal === 0 })}>
      <DetailHeader
        type={OperatorTypeEnum.ToolBox}
        detailInfo={{ ...toolBoxInfo, description: toolBoxInfo?.box_desc, toolLength: toolListTotal }}
        fetchInfo={fetchInfo}
        permissionCheckInfo={permissionCheckInfo}
        getFetchTool={getFetchTool}
        navigateToCreateToolInIDE={navigateToCreateToolInIDE}
      />

      {
        // 内容为空
        loadStatus === LoadStatusEnum.Empty && (
          <div className="dip-flex-1 tool-detail-contant">
            <div className="dip-bg-white dip-w-100 dip-h-100 dip-flex-center dip-border-radius-8">
              <Empty description="暂无工具" image={<ToolEmptyIcon style={{ fontSize: 144 }} />}>
                {canModify && (
                  <>
                    {toolBoxInfo?.metadata_type === MetadataTypeEnum.OpenAPI && (
                      <UploadTool getFetchTool={getFetchTool} toolBoxInfo={toolBoxInfo} placement="bottomLeft">
                        <Button type="primary" icon={<ImportIcon className="dip-font-16" />}>
                          导入工具
                        </Button>
                      </UploadTool>
                    )}

                    {toolBoxInfo?.metadata_type === MetadataTypeEnum.Function && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined className="dip-font-16" />}
                        onClick={navigateToCreateToolInIDE}
                      >
                        在IDE中新建工具
                      </Button>
                    )}
                  </>
                )}
              </Empty>
            </div>
          </div>
        )
      }

      {
        // 已经加载了，且内容不为空
        ![LoadStatusEnum.Empty, LoadStatusEnum.Loading].includes(loadStatus) && (
          <Layout className="tool-detail-contant">
            {/* 左侧面板 */}
            <Sider width={500} className="operator-detail-sider">
              {/* 工具列表 */}
              <div className="operator-detail-sider-content-title">
                <div className="operator-detail-sider-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>
                      <BarsOutlined /> 工具列表 - {toolListTotal}
                    </Text>
                  </div>
                </div>
                {action === OperateTypeEnum.Edit && (
                  <div style={{ marginBottom: '10px' }}>
                    {permissionCheckInfo?.includes(PermConfigTypeEnum.Execute) && (
                      <Button style={{ marginLeft: '10px' }} size="small" href="#targetDiv">
                        调试
                      </Button>
                    )}
                    {selectedToolIds.length > 0 && (
                      <>
                        <Button style={{ marginLeft: '10px' }} onClick={showDeleteConfirm} size="small">
                          删除({selectedToolIds.length})
                        </Button>
                        {changeToolStatus && (
                          <>
                            {selectedToolArry[0]?.status === ToolStatusEnum.Disabled ? (
                              <Button
                                style={{ marginLeft: '10px' }}
                                size="small"
                                onClick={() => changeStatus(selectedToolArry)}
                              >
                                启用({selectedToolIds.length})
                              </Button>
                            ) : (
                              <Button
                                style={{ marginLeft: '10px' }}
                                size="small"
                                onClick={() => changeStatus(selectedToolArry)}
                              >
                                禁用({selectedToolIds.length})
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {
                      // openapi的工具 或 函数工具&resource_object === 'operator'(代表从已有算子导入)，使用【编辑】；其它（resource_object === 'tool'，代表IDE新建的工具），使用【在IDE中编辑】
                      selectedToolIds.length === 1 &&
                        (toolBoxInfo?.metadata_type === MetadataTypeEnum.OpenAPI ||
                        selectedToolArry[0]?.resource_object === 'operator' ? (
                          <Button style={{ marginLeft: '10px' }} size="small" onClick={() => setEditToolModal(true)}>
                            编辑
                          </Button>
                        ) : (
                          <Button
                            style={{ marginLeft: '10px' }}
                            size="small"
                            onClick={() => navigateToEditToolInIDE(selectedToolIds[0])}
                          >
                            在IDE中编辑
                          </Button>
                        ))
                    }
                  </div>
                )}

                <div className="operator-detail-sider-list">
                  <List
                    height={700}
                    itemCount={toolList?.length}
                    itemSize={56}
                    className="scrollbar-thin scrollbar-thumb-gray-300"
                    onItemsRendered={handleItemsRendered}
                  >
                    {ListItem}
                  </List>
                </div>
              </div>
            </Sider>
            {/* 右侧内容区域 */}
            <Content style={{ background: 'white', borderRadius: '8px' }}>
              <ToolInfo selectedTool={selectedTool} />
              {permissionCheckInfo?.includes(PermConfigTypeEnum.Execute) && (
                <div id="targetDiv">
                  <DebugResult selectedTool={selectedTool} type={OperatorTypeEnum.ToolBox} />
                </div>
              )}
            </Content>
          </Layout>
        )
      }

      {editToolModal && (
        <EditToolModal
          closeModal={() => setEditToolModal(false)}
          selectedTool={{ box_id, ...selectedToolArry[0] }}
          fetchInfo={fetchToolList}
        />
      )}
    </div>
  );
}
