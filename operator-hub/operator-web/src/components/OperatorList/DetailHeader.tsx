import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Tag, Space } from 'antd';
import { ClockCircleOutlined, LeftOutlined } from '@ant-design/icons';
import './style.less';
import { formatTime } from '@/utils/operator';
import ToolIcon from '@/assets/images/tool-icon.svg';
import ToolBgPng from '@/assets/images/tool-bg.png';
import OperatorBgPng from '@/assets/images/operator-bg.png';
import MCPBgPng from '@/assets/images/mcp-bg.png';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import { OperateTypeEnum, OperatorTypeEnum } from './types';
import StatusTag from './StatusTag';
import OperatorName from './OperatorName';
import McpDetailButton from '../MCP/McpDetailButton';
import OperatorDetailButton from '../Operator/OperatorDetailButton';
import ToolDetailButton from '../Tool/ToolDetailButton';
import { metadataTypeMap } from './metadata-type';

export default function DetailHeader({
  fetchInfo,
  type,
  detailInfo,
  permissionCheckInfo,
  getFetchTool,
  navigateToCreateToolInIDE,
}: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || '';

  const [expanded, setExpanded] = useState(false);

  // 返回到列表页面
  const handleBackToList = () => {
    navigate(`/?activeTab=${type}`);
  };

  const metadataTypeLabel = useMemo(() => {
    return detailInfo?.metadata_type ? metadataTypeMap[detailInfo?.metadata_type as MetadataTypeEnum] : '';
  }, [detailInfo?.metadata_type]);

  return (
    <div
      className="operator-detail-header"
      style={
        type === OperatorTypeEnum.ToolBox
          ? { backgroundImage: `url(${ToolBgPng})` }
          : type === OperatorTypeEnum.Operator
            ? { backgroundImage: `url(${OperatorBgPng})` }
            : type === OperatorTypeEnum.MCP
              ? { backgroundImage: `url(${MCPBgPng})` }
              : {}
      }
    >
      {[OperatorTypeEnum.ToolBox, OperatorTypeEnum.Operator].includes(type) && metadataTypeLabel && (
        <div
          style={{
            background: 'rgb(206, 153, 101)',
            position: 'absolute',
            right: 0,
            top: 0,
            borderBottomLeftRadius: 10,
          }}
          className="dip-font-12 dip-pt-4 dip-pb-4 dip-pl-8 dip-pr-8 dip-c-white"
        >
          {metadataTypeLabel}
        </div>
      )}
      <div className="operator-detail-nav">
        <span className="operator-detail-nav-back" onClick={handleBackToList}>
          <span style={{ marginRight: '6px', fontSize: '12px' }}>
            <LeftOutlined />
          </span>
          返回
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        <div className="dip-flex-1 dip-overflow-hidden">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                margin: '12px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={detailInfo?.name || detailInfo?.box_name}
            >
              {detailInfo?.name || detailInfo?.box_name}
            </div>
            <div style={{ paddingLeft: '20px', width: '275px' }}>
              <StatusTag status={detailInfo?.status} />
            </div>
          </div>
          <Typography.Paragraph
            copyable={false}
            ellipsis={{
              rows: 1,
              expandable: 'collapsible',
              expanded,
              onExpand: (_, info) => setExpanded(info.expanded),
            }}
          >
            {detailInfo?.description}
          </Typography.Paragraph>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#4F4F4F', display: 'flex' }}>
            {type !== OperatorTypeEnum.Operator && (
              <span style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
                <ToolIcon />
                <span style={{ marginLeft: '5px' }}>{detailInfo?.toolLength} 个工具</span>
              </span>
            )}

            {/* <span>👥 0 个用户正在使用</span> */}
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <ClockCircleOutlined />
              <span style={{ marginLeft: '5px' }}>{formatTime(detailInfo?.update_time)}</span>
            </span>
          </div>
        </div>
        {action === OperateTypeEnum.Edit && (
          <Space className="operator-detail-header-operate">
            {type === OperatorTypeEnum.ToolBox && (
              <ToolDetailButton
                detailInfo={detailInfo}
                fetchInfo={fetchInfo}
                permissionCheckInfo={permissionCheckInfo}
                goBack={handleBackToList}
                getFetchTool={getFetchTool}
                navigateToCreateToolInIDE={navigateToCreateToolInIDE}
              />
            )}
            {type === OperatorTypeEnum.MCP && (
              <McpDetailButton
                detailInfo={detailInfo}
                fetchInfo={fetchInfo}
                permissionCheckInfo={permissionCheckInfo}
              />
            )}
            {type === OperatorTypeEnum.Operator && (
              <OperatorDetailButton
                detailInfo={detailInfo}
                fetchInfo={fetchInfo}
                permissionCheckInfo={permissionCheckInfo}
              />
            )}
          </Space>
        )}
      </div>
    </div>
  );
}
