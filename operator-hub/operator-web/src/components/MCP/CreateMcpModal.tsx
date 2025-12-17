import { Button, message, Form, Select, Input, Table, Drawer, Radio } from 'antd';
import { getOperatorCategory, mcpSSE, postMCP, putMCP } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { useNavigate } from 'react-router-dom';
import { OperateTypeEnum } from '../OperatorList/types';
import SkillsSection from './ConfigSection/Sections/SkillsSection';
import { McpCreationTypeEnum, McpModeTypeEnum } from './types';

export default function CreateMcpModal({ closeModal, fetchInfo, mcpInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<any>(mcpInfo?.tool_configs || []);
  const [creationType, setCreationType] = useState<string>(mcpInfo?.creation_type || McpCreationTypeEnum.Custom);
  const initialValues = {
    mode: McpModeTypeEnum.SSE,
    creation_type: McpCreationTypeEnum.Custom,
    ...mcpInfo,
  };
  const layout = {
    labelCol: { span: 24 },
  };
  const [categoryType, setCategoryType] = useState<any>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const handleCancel = () => {
    closeModal?.();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data);
        if (!mcpInfo?.category)
          form.setFieldsValue({
            category: data[0]?.category_type,
          });
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
  }, []);

  const onFinish = async () => {
    if (duplicateCount > 0) {
      message.error(`${duplicateCount} 个工具已重名，请修改`);
      return false;
    }
    const values = form.getFieldsValue();
    values.tool_configs = dataSource;

    try {
      if (mcpInfo?.mcp_id) {
        await putMCP(mcpInfo?.mcp_id, values);
        fetchInfo?.();
        handleCancel();
      } else {
        const { mcp_id } = await postMCP(values);
        navigate(`/mcp-detail?mcp_id=${mcp_id}&action=${OperateTypeEnum.Edit}&back=${btoa(location.pathname)}`);
      }

      message.success(mcpInfo?.mcp_id ? '编辑成功' : '创建成功');
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const getMcpSSE = async () => {
    try {
      const { url, mode } = form.getFieldsValue();
      const { tools } = await mcpSSE({ url, mode });
      setDataSource(tools);
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const updateSkills = (data?: any) => {
    setDataSource(data);
  };
  const duplicateCountError = (data?: any) => {
    setDuplicateCount(data);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  const handleValuesChange = (changedValues: any) => {
    if (changedValues?.creation_type) setCreationType(changedValues.creation_type);
  };

  return (
    <Drawer
      title={mcpInfo?.mcp_id ? '编辑MCP服务' : '新建MCP服务'}
      open={true}
      onClose={handleCancel}
      footer={
        <div style={{ textAlign: 'right', padding: '10px 0' }}>
          <Button style={{ marginRight: '12px' }} onClick={() => closeModal?.()}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={() => {
              onFinish();
            }}
          >
            确定
          </Button>
        </div>
      }
      width={800}
      getContainer={() => microWidgetProps.container}
      maskClosable={false}
    >
      <Form
        {...layout}
        form={form}
        style={{ maxHeight: '630px', overflow: 'auto' }}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        className="create-mcp-form"
      >
        <Form.Item label="新建方式" name="creation_type">
          <Radio.Group disabled={mcpInfo?.mcp_id}>
            <Radio value={McpCreationTypeEnum.Custom}>连接MCP服务</Radio>
            <Radio value={McpCreationTypeEnum.ToolImported}>从工具箱导入</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="服务名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input maxLength={50} />
        </Form.Item>

        <Form.Item label="服务描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} placeholder="请尽量详细描述主要功能和使用场景。描述将展示给用户" />
        </Form.Item>
        <Form.Item label="服务类型" name="category" rules={[{ required: true, message: '请选择服务类型' }]}>
          <Select>
            {categoryType?.map((item: any) => (
              <Select.Option key={item.category_type} value={item.category_type}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {creationType === McpCreationTypeEnum.Custom && (
          <Form.Item label="通信模式" name="mode">
            <Select
              options={[
                { value: McpModeTypeEnum.SSE, label: 'SSE' },
                { value: McpModeTypeEnum.Stream, label: 'Streamable' },
              ]}
            />
          </Form.Item>
        )}
        {creationType === McpCreationTypeEnum.Custom && (
          <Form.Item label="URL">
            <Form.Item name="url" noStyle rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder={`请输入`} style={{ width: '533px' }} />
            </Form.Item>

            <Button style={{ marginLeft: '12px' }} onClick={() => getMcpSSE()}>
              解析
            </Button>
          </Form.Item>
        )}
        <Form.Item label="工具列表">
          {creationType === McpCreationTypeEnum.Custom ? (
            <Table dataSource={dataSource} columns={columns} bordered size="small" />
          ) : (
            <SkillsSection
              updateSkills={updateSkills}
              stateSkills={mcpInfo?.tool_configs}
              duplicateCountError={duplicateCountError}
            />
          )}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
