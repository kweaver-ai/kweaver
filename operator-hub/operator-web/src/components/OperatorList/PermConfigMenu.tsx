import type React from 'react';
import { Button, Menu } from 'antd';
import { componentsPermConfig } from '@/utils/permConfig';
import { useMicroWidgetProps } from '@/hooks';
import { OperatorTypeEnum, PermConfigShowType } from './types';

const PermConfigMenu: React.FC<{ params: any; type?: string }> = ({ params, type }) => {
  const microWidgetProps = useMicroWidgetProps();
  const { record, activeTab } = params;

  const permissionConfig = () => {
    let id = '';
    let name = '';
    if (activeTab === OperatorTypeEnum.ToolBox) {
      id = record?.box_id;
      name = record?.box_name;
    }
    if (activeTab === OperatorTypeEnum.MCP) {
      id = record?.mcp_id;
      name = record?.name;
    }
    if (activeTab === OperatorTypeEnum.Operator) {
      id = record?.operator_id;
      name = record?.name;
    }
    componentsPermConfig({ id: id, name, type: activeTab }, microWidgetProps);
  };

  return (
    <>
      {type === PermConfigShowType.Button ? (
        <Button onClick={permissionConfig}>权限配置</Button>
      ) : (
        <div onClick={permissionConfig}>权限配置</div>
      )}
    </>
  );
};

export default PermConfigMenu;
