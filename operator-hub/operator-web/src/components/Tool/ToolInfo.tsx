import { useState, useEffect } from 'react';
import { Collapse, Switch } from 'antd';
import './style.less';
import MethodTag from '../OperatorList/MethodTag';
import JsonschemaTab from '../MyOperator/JsonschemaTab';
import { ControlOutlined, EditOutlined, InteractionOutlined, ProfileOutlined } from '@ant-design/icons';
import { ToolStatusEnum } from '../OperatorList/types';

const { Panel } = Collapse;

export default function ToolInfo({ selectedTool, type }: any) {
  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  return (
    <div className="operator-info">
      <Collapse
        ghost
        defaultActiveKey={''}
        expandIconPosition="end"
        className="operator-details-collapse"
      >
        <Panel
          key="1"
          header={
            <span>
              <ProfileOutlined /> 工具信息 <EditOutlined />
            </span>
          }
        >
          <div style={{ padding: '0 16px' }}>
            <div className="operator-info-title">工具名称</div>
            <div className="operator-info-desc">{selectedTool?.name}</div>
            <div className="operator-info-title">工具描述</div>
            <div className="operator-info-desc">{selectedTool?.description || '暂无描述'}</div>
            <div className="operator-info-title">工具规则</div>
            <div className="operator-info-desc">{selectedTool?.use_rule || '暂无规则'}</div>
            <div className="operator-info-title">Server URL</div>
            <div className="operator-info-desc">{selectedTool?.metadata?.server_url}</div>
            <div className="operator-info-title">工具路径</div>
            <div className="operator-info-desc">{selectedTool?.metadata?.path}</div>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '50px' }}>
                <span style={{ marginRight: '6px', color: '#00000072' }}>请求方法</span>
                <MethodTag status={selectedTool?.metadata?.method} />
              </div>
              <div>
                <span style={{ marginRight: '6px', color: '#00000072' }}>工具状态</span>
                <Switch
                  size="small"
                  value={selectedTool?.status !== ToolStatusEnum.Disabled}
                  onChange={onChange}
                  style={{ marginRight: '6px' }}
                />
                {selectedTool?.status === ToolStatusEnum.Disabled ? '未启用' : '已启用'}
              </div>
            </div>
          </div>
        </Panel>
        <Panel
          key="2"
          header={
            <span>
              <InteractionOutlined /> 输入输出{' '}
            </span>
          }
        >
          <JsonschemaTab operatorInfo={selectedTool} type="Inputs" />
          <JsonschemaTab operatorInfo={selectedTool} type="Outputs" />
        </Panel>
      </Collapse>
    </div>
  );
}
