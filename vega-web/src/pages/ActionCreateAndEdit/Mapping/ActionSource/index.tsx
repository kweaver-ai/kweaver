import { useState, FC, useEffect, useMemo } from 'react';
import intl from 'react-intl-universal';
import { CloseCircleFilled } from '@ant-design/icons';
import { Button, FormInstance } from 'antd';
import classNames from 'classnames';
import AddToolModal from '@/components/AddToolModal';
import api from '@/services/tool';
import styles from './index.module.less';

interface ActionSourceProps {
  value: any;
  form: FormInstance;
  onChange?: (params: any) => void;
}

const ActionSource: FC<ActionSourceProps> = ({ onChange, value }) => {
  const [toolModalVisible, setToolModalVisible] = useState(false);

  const fetchToolDetail = async (boxId: string, toolId: string) => {
    try {
      const [{ box_name, tools }] = await api.getToolBoxDetail(boxId, ['box_name', 'tools']);
      const findTool = tools.find((tool: any) => tool.tool_id === toolId);

      if (findTool) {
        onChange?.({ ...value, box_name, tool_name: findTool?.name });
      } else {
        onChange?.(undefined);
      }
    } catch {}
  };

  const fetchMCPToolDetail = async (mcpId: string, toolName: string) => {
    try {
      const { tools: mcpTools } = await api.getMcpTools(mcpId, { page: 1, page_size: 100, status: 'enabled', all: true });
      const findTool = mcpTools.find((tool: any) => tool.name === toolName);

      if (findTool) {
        onChange?.({ ...value, mcp_name: findTool?.name, tool_name: toolName });
      } else {
        onChange?.(undefined);
      }
    } catch {}
  };

  useEffect(() => {
    if (value?.box_id && !value.box_name) {
      fetchToolDetail(value.box_id, value.tool_id);
    }
    if (value?.mcp_id && value.tool_name) {
      fetchMCPToolDetail(value.mcp_id, value.tool_name);
    }
  }, [value?.tool_name, value?.mcp_id, value?.box_id]);

  const title = useMemo(() => `${value?.box_name || value?.mcp_name}/${value?.tool_name}`, [value]);

  return (
    <div>
      <Button className={classNames({ 'g-c-watermark': !value?.tool_name }, styles['tool-selector'])} onClick={() => setToolModalVisible(true)}>
        {value?.tool_name ? (
          <div title={title} className={styles['tool-selector-content']}>
            <span className={styles['tool-selector-text']}>{title}</span>
            <CloseCircleFilled
              className={classNames('g-c-watermark', styles['close-icon'])}
              onClick={(e) => {
                // 清空工具
                e.stopPropagation();
                onChange?.(undefined);
              }}
            />
          </div>
        ) : (
          intl.get('Action.selectToolName')
        )}
      </Button>
      {toolModalVisible && (
        <AddToolModal
          onCancel={() => setToolModalVisible(false)}
          onOk={(tool) => {
            setToolModalVisible(false);
            onChange?.(tool);
          }}
          initialValue={value}
        />
      )}
    </div>
  );
};

export default ActionSource;
