import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Tag, Space } from 'antd';
import { ClockCircleOutlined, LeftOutlined } from '@ant-design/icons';
import './style.less';
import { formatTime } from '@/utils/operator';
import ToolIcon from '@/assets/images/tool-icon.svg';
import { OperateTypeEnum, OperatorTypeEnum } from './types';
import StatusTag from './StatusTag';
import OperatorName from './OperatorName';
import McpDetailButton from '../MCP/McpDetailButton';
import OperatorDetailButton from '../Operator/OperatorDetailButton';
import ToolDetailButton from '../Tool/ToolDetailButton';
import classNames from 'classnames';

export default function DetailHeader({ fetchInfo, type, detailInfo, permissionCheckInfo }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeKey = searchParams.get('activeKey') || '';
  const action = searchParams.get('action') || '';

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={classNames(`operator-detail-header`, {
        'tool-header-bg': type === OperatorTypeEnum.ToolBox,
        'operator-header-bg': type === OperatorTypeEnum.Operator,
        'mcp-header-bg': type === OperatorTypeEnum.MCP,
      })}
    >
      <div className="operator-detail-nav">
        <span
          className="operator-detail-nav-back"
          onClick={() => navigate(`/?activeTab=${type}&activeKey=${activeKey}`)}
        >
          <span style={{ marginRight: '6px', fontSize: '12px' }}>
            <LeftOutlined />
          </span>
          返回
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '76%' }}>
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
              <Tag style={{ opacity: '0.5', marginLeft: '10px' }}>
                <OperatorName type={type} />
              </Tag>
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
