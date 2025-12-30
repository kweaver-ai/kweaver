import type React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout, Input, Button, Typography, message, Skeleton } from 'antd';
import { ApiOutlined, BarsOutlined } from '@ant-design/icons';
import { FixedSizeList as List } from 'react-window';
import './style.less';
import { getMCP, getMCPMarket, getMcpTools } from '@/apis/agent-operator-integration';
import DebugResult from '../OperatorList/DebugResult';
import { OperateTypeEnum, OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import McpInfo from './McpInfo';
import DetailHeader from '../OperatorList/DetailHeader';
import { postResourceOperation } from '@/apis/authorization';
import { McpCreationTypeEnum } from './types';
import { useMicroWidgetProps } from '@/hooks';
import { isIPv4 } from '@/utils/dataProcess';

const { Sider, Content } = Layout;
const { Paragraph, Text } = Typography;

export default function McpDetail() {
  const [selectedTool, setSelectedTool] = useState<any>({});
  const [mcpInfo, setMcpInfo] = useState<any>({});
  const [searchParams] = useSearchParams();
  const mcp_id = searchParams.get('mcp_id') || '';
  const action = searchParams.get('action') || '';
  const [mcpToolList, setMcpToolList] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();
  const microWidgetProps = useMicroWidgetProps();
  const protocol = microWidgetProps.config.systemInfo.location.protocol;
  const host = microWidgetProps.config.systemInfo.location.hostname;
  const port = microWidgetProps.config.systemInfo.location.port;
  const newProtocol = isIPv4(host) ? 'http:' : protocol;
  const domain = `${newProtocol}//${host}${port ? ':' : ''}${port}`;

  useEffect(() => {
    fetchInfo();
    resourceOperation();
  }, []);

  useEffect(() => {
    if (mcpInfo?.url) getMcpSSE();
  }, [mcpInfo]);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const { base_info, connection_info } =
        action === OperateTypeEnum.View
          ? await getMCPMarket({
              mcp_id,
            })
          : await getMCP({
              mcp_id,
            });
      setMcpInfo({ ...base_info, ...connection_info });
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const clickTool = (item?: any) => {
    setSelectedTool(item);
  };

  // 虚拟列表项渲染
  const ListItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = mcpToolList?.[index];
    const isSelected = selectedTool?.name === item.name;

    return (
      <div style={style}>
        <div className={`side-list-item ${isSelected ? 'side-list-item-select' : ''}`} onClick={() => clickTool(item)}>
          <Text strong className="side-list-item-id">
            {index + 1}
          </Text>
          <div style={{ width: 'calc(100% - 45px)' }}>
            <Paragraph ellipsis={{ rows: 1 }} title={item.name} style={{ margin: '0 12px 0 0' }}>
              {item.name}
            </Paragraph>
            <Paragraph className="side-list-item-desc" ellipsis={{ rows: 1 }} title={item.description}>
              {item.description}
            </Paragraph>
          </div>
        </div>
      </div>
    );
  };

  const getMcpSSE = async () => {
    setLoading(true);
    setMcpToolList([]);
    try {
      const { tools } = await getMcpTools(mcp_id);
      setMcpToolList(tools);
      setSelectedTool(tools[0]);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: mcp_id,
            type: OperatorTypeEnum.MCP,
          },
        ],
      });
      setIsPermissionCheckInfo(data?.[0]?.operation);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="operator-detail">
      <DetailHeader
        type={OperatorTypeEnum.MCP}
        detailInfo={{ ...mcpInfo, toolLength: mcpToolList?.length }}
        fetchInfo={fetchInfo}
        permissionCheckInfo={permissionCheckInfo}
      />
      <Layout style={{ padding: '16px', background: '#f5f5f5' }}>
        {/* 左侧面板 */}
        <Sider width={500} className="operator-detail-sider">
          {/* URL 输入区域 */}
          <div className="operator-detail-sider-content">
            {!(
              mcpInfo?.status !== OperatorStatusType.Published &&
              mcpInfo?.creation_type === McpCreationTypeEnum.ToolImported
            ) && (
              <div className="operator-detail-sider-content-title">
                <Text strong>
                  <ApiOutlined /> 配置信息
                </Text>
              </div>
            )}
            {mcpInfo?.status === OperatorStatusType.Published && (
              <>
                {mcpInfo?.sse_url && (
                  <div className="operator-detail-config-info">
                    <span className="operator-detail-config-info-title"> sse: </span>
                    <Paragraph copyable ellipsis>
                      {domain + mcpInfo?.sse_url + '?token=token'}
                    </Paragraph>
                  </div>
                )}
                {mcpInfo?.stream_url && (
                  <div className="operator-detail-config-info">
                    <span className="operator-detail-config-info-title"> Streamable: </span>
                    <Paragraph copyable ellipsis>
                      {domain + mcpInfo?.stream_url + '?token=token'}
                    </Paragraph>
                  </div>
                )}
              </>
            )}
            {mcpInfo?.creation_type === McpCreationTypeEnum.Custom && (
              <div style={{ display: 'flex' }}>
                {action === OperateTypeEnum.Edit && (
                  <Input
                    value={mcpInfo?.url}
                    disabled
                    // onChange={e => setTestUrl(e.target.value)}
                    placeholder="请输入API地址"
                    className="flex-1"
                    title={mcpInfo?.url}
                    style={{ marginRight: '10px' }}
                  />
                )}
                <Button onClick={() => getMcpSSE()}>
                  {action === OperateTypeEnum.Edit ? '解析' : '重新解析获取工具列表'}
                </Button>
              </div>
            )}
          </div>

          {/* 工具列表 */}
          <div className="operator-detail-sider-content-title">
            <div className="operator-detail-sider-content">
              <Text strong>
                <BarsOutlined /> 工具列表 - {mcpToolList?.length}
              </Text>
            </div>
            <div className="operator-detail-sider-list">
              {loading ? (
                <Skeleton />
              ) : (
                <List
                  height={700}
                  itemCount={mcpToolList?.length}
                  itemSize={56}
                  className="scrollbar-thin scrollbar-thumb-gray-300"
                >
                  {ListItem}
                </List>
              )}
            </div>
          </div>
        </Sider>
        {/* 右侧内容区域 */}
        <Content style={{ background: 'white', borderRadius: '8px' }}>
          <McpInfo selectedTool={{ ...selectedTool, mcp_id }} type={OperatorTypeEnum.MCP} />
          {permissionCheckInfo?.includes(PermConfigTypeEnum.Execute) && (
            <DebugResult selectedTool={{ ...selectedTool, mcp_id }} type={OperatorTypeEnum.MCP} />
          )}
        </Content>
      </Layout>
    </div>
  );
}
