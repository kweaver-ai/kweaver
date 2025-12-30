import { impexExport } from '@/apis/agent-operator-integration';
import { message } from 'antd';
import { downloadFile } from '@/utils/file';
import { OperatorTypeEnum } from './types';

export default function ExportButton({ params, extension = '' }: any) {
  const { activeTab, record } = params;
  const type = activeTab === OperatorTypeEnum.ToolBox ? 'toolbox' : activeTab;
  const id =
    activeTab === OperatorTypeEnum.ToolBox
      ? record.box_id
      : activeTab === OperatorTypeEnum.MCP
        ? record.mcp_id
        : record.operator_id;
  const value = { type, id };
  const handleExportAgent = async () => {
    try {
      const data = await impexExport(value);
      downloadFile(data, params.record.name + extension);
      message.success('导出成功');
    } catch (ex: any) {
      if (ex.description) {
        message.error(ex.description);
      }
    }
  };

  return <div onClick={() => handleExportAgent()}>导出</div>;
}
