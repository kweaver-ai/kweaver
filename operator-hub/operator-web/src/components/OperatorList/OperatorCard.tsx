import type React from 'react';
import { useMemo, useCallback } from 'react';
import { Card, Row, Col, Typography, theme, Avatar, Tooltip } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useMediaQuery } from 'react-responsive';
import './style.less';
import { formatTime } from '@/utils/operator';
import ToolIcon from '@/assets/images/tool.svg';
import BuiltInIcon from '@/assets/images/built-in.svg';
import { OperateTypeEnum, OperatorTypeEnum } from './types';
import OperatorIcon from '@/assets/images/operator.svg';
import McpIcon from '@/assets/images/mcp.svg';
import OperatorDropdown from '../Operator/OperatorDropdown';
import ToolDropdown from '../Tool/ToolDropdown';
import McpDropdown from '../MCP/McpDropdown';
import StatusTag from '../OperatorList/StatusTag';
import { useNavigate } from 'react-router-dom';
import styles from './OperatorCard.module.less';
import { metadataTypeMap } from './metadata-type';

const { Title, Paragraph } = Typography;

const CardTag = ({ children }: { children: React.ReactNode }) => (
  <Tooltip title={children}>
    <div className={styles['card-tag']}>{children}</div>
  </Tooltip>
);

const OperatorCard: React.FC<{
  params: any;
  fetchInfo: any;
  operatorList: any;
  hasMore: any;
  fetchMoreData: any;
  loading: boolean;
}> = ({ params, operatorList, fetchInfo, hasMore, fetchMoreData, loading }) => {
  const { token } = theme.useToken();
  const { activeTab, isPluginMarket } = params;
  const navigate = useNavigate();

  // 使用 react-responsive 检测屏幕尺寸
  const isXXL = useMediaQuery({ minWidth: 1600 });
  const isXL = useMediaQuery({ minWidth: 1400 });
  // 根据屏幕尺寸动态计算列数和间距
  const { columns, gutter } = useMemo(() => {
    if (isXXL) return { columns: 4, gutter: 20 };
    if (isXL) return { columns: 3, gutter: 16 };
    return { columns: 3, gutter: 16 };
  }, [isXXL, isXL]);

  // 响应式列数配置
  const getResponsiveProps = useCallback(() => {
    const span = 24 / columns;
    return {
      sm: span,
      md: span,
      lg: span,
      xl: span,
      xxl: span,
    };
  }, [columns]);

  const handlePreview = (record: any) => {
    const { operator_id, mcp_id, box_id } = record;
    const type = isPluginMarket ? OperateTypeEnum.View : OperateTypeEnum.Edit;
    if (activeTab === OperatorTypeEnum.ToolBox) {
      navigate(`/tool-detail?box_id=${box_id}&action=${type}`);
    }
    if (activeTab === OperatorTypeEnum.Operator) {
      navigate(`/operator-detail?operator_id=${operator_id}&action=${type}`);
    }
    if (activeTab === OperatorTypeEnum.MCP) {
      navigate(`/mcp-detail?mcp_id=${mcp_id}&action=${type}`);
    }
  };

  return (
    <div className="operator-list-content">
      <div
        id="infinite-scroll-container"
        style={{ height: '100%', overflow: 'hidden', overflowY: 'auto', padding: '8px' }}
      >
        <InfiniteScroll
          dataLength={operatorList?.length}
          next={fetchMoreData}
          scrollableTarget="infinite-scroll-container"
          hasMore={hasMore}
          loader={
            <div style={{ textAlign: 'center', padding: token.paddingLG }}>
              {/* <div
                style={{
                  fontSize: token.fontSizeLG,
                  color: token.colorPrimary,
                  fontWeight: token.fontWeightStrong,
                }}
              >
                加载中...
              </div> */}
            </div>
          }
          scrollThreshold={0.8}
          style={{ minHeight: '100%', overflow: 'visible' }}
        >
          {/* 卡片网格 */}
          <Row gutter={[gutter, gutter]}>
            {operatorList?.map((item: any) => (
              <Col key={item.id} {...getResponsiveProps()}>
                <Card hoverable className="operator-list-content-card" loading={loading}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                      }}
                      onClick={() => handlePreview(item)}
                    >
                      <div className="dip-position-r">
                        {activeTab === OperatorTypeEnum.ToolBox && (
                          <ToolIcon style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
                        )}
                        {activeTab === OperatorTypeEnum.MCP && (
                          <McpIcon style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
                        )}
                        {activeTab === OperatorTypeEnum.Operator && (
                          <OperatorIcon style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
                        )}
                        {[OperatorTypeEnum.ToolBox, OperatorTypeEnum.Operator].includes(activeTab) && (
                          <CardTag>{metadataTypeMap[item.metadata_type]}</CardTag>
                        )}
                      </div>

                      <div style={{ marginLeft: '12px', width: 'calc(100% - 50px)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Title ellipsis={{ rows: 1 }} level={5} title={item.name}>
                            {item.name}
                          </Title>
                          {!isPluginMarket && <StatusTag status={item?.status} />}
                        </div>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: '13px', color: '#000000A5', height: '40px' }}
                          title={item.description}
                        >
                          {item.description}
                        </Paragraph>
                        <div style={{ fontSize: '12px', color: '#00000072' }}>
                          {activeTab === OperatorTypeEnum.ToolBox && (
                            <div style={{ marginBottom: '5px' }}>{item.tools?.length || 0} 个工具</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="operator-list-content-release">
                      {item.is_internal ? (
                        <>
                          <BuiltInIcon
                            style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '6px' }}
                          />
                          <div style={{ marginRight: '10px' }}>内置</div>
                        </>
                      ) : (
                        <>
                          <Avatar
                            size={24}
                            // className={styles.editorAvatar}
                            src={item?.release_user}
                          >
                            {isPluginMarket ? item?.release_user?.charAt(0) : item?.update_user?.charAt(0)}
                          </Avatar>
                          <div className="operator-list-content-user">
                            {isPluginMarket ? item?.release_user : item?.update_user}
                          </div>
                        </>
                      )}
                      {isPluginMarket ? (
                        <div>发布时间：{formatTime(item.release_time)}</div>
                      ) : (
                        <div>更新时间：{formatTime(item.update_time)}</div>
                      )}
                      {!isPluginMarket && (
                        <div
                          style={{ marginLeft: 'auto' }}
                          onClick={e => {
                            e.stopPropagation();
                          }}
                        >
                          {activeTab === OperatorTypeEnum.ToolBox && (
                            <ToolDropdown params={{ ...params, record: item }} fetchInfo={fetchInfo} />
                          )}
                          {activeTab === OperatorTypeEnum.MCP && (
                            <McpDropdown params={{ ...params, record: item }} fetchInfo={fetchInfo} />
                          )}
                          {activeTab === OperatorTypeEnum.Operator && (
                            <OperatorDropdown params={{ ...params, record: item }} fetchInfo={fetchInfo} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default OperatorCard;
