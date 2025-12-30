import { useState, useEffect } from 'react';
import { Collapse, Switch } from 'antd';
import './style.less';
import MethodTag from '../OperatorList/MethodTag';
import { EditOutlined, InteractionOutlined, ProfileOutlined } from '@ant-design/icons';
import JsonschemaTab from '../MyOperator/JsonschemaTab';

const { Panel } = Collapse;

export default function OperatorInfo({ selectedTool, type }: any) {
  return (
    <div className="operator-info">
      <Collapse
        ghost
        defaultActiveKey=''
        expandIconPosition="end"
        className="operator-details-collapse"
      >
        <Panel
          key="1"
          header={
            <span>
              <ProfileOutlined /> 算子信息 <EditOutlined />
            </span>
          }
        >
          <div style={{ padding: '0 16px' }}>
            <div className="operator-info-title">算子名称</div>
            <div className="operator-info-desc">{selectedTool?.name}</div>
            <div className="operator-info-title">算子描述</div>
            <div className="operator-info-desc">{selectedTool?.metadata?.description || '暂无描述'}</div>
             <div className="operator-info-title">Server URL</div>
            <div className="operator-info-desc">{selectedTool?.metadata?.server_url}</div>
            <div className="operator-info-title">算子路径</div>
            <div className="operator-info-desc">{selectedTool?.metadata?.path}</div>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '50px' }}>
                <span style={{ marginRight: '6px', color: '#00000072' }}>请求方法</span>
                <MethodTag status={selectedTool?.metadata?.method} />
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
