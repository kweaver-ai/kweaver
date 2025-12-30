import { componentsPermConfig } from '@/utils/permConfig';
import { OperatorTypeEnum } from './types';
import { Modal } from 'antd';
const { success } = Modal;

export const PublishedPermModal = (params: any, microWidgetProps: any) => {
  const { activeTab, record } = params;
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

  success({
    title: '发布成功',
    centered: true,
    getContainer: microWidgetProps?.container,
    content: (
      <div>
        <p>若您还未配置权限，可前往进行权限配置。</p>
      </div>
    ),
    okCancel: true,
    onOk() {
      componentsPermConfig({ id, name, type: activeTab }, microWidgetProps);
    },
    okText: '权限配置',
    cancelText: '暂不配置',
  });
};
