import { Button, message, Form, Select, Input, Table, Drawer, Radio, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getOperatorCategory, mcpSSE, postMCP, putMCP } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { useNavigate } from 'react-router-dom';
import EmptyIcon from '@/assets/icons/empty.svg';
import { OperateTypeEnum } from '../OperatorList/types';
import SkillsSection from './ConfigSection/Sections/SkillsSection';
import HeaderList from './HeaderList';
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
    await form.validateFields();

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
        navigate(`/mcp-detail?mcp_id=${mcp_id}&action=${OperateTypeEnum.Edit}`);
      }

      message.success(mcpInfo?.mcp_id ? '编辑成功' : '创建成功');
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const getMcpSSE = async () => {
    await form.validateFields(['url']);
    try {
      const { url, mode, headers } = form.getFieldsValue();
      const { tools } = await mcpSSE({ url, mode, headers });
      setDataSource(tools);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
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
          <Button
            type="primary"
            className="dip-w-74 dip-mr-8"
            onClick={() => {
              onFinish();
            }}
          >
            确定
          </Button>
          <Button onClick={() => closeModal?.()} className="dip-w-74">
            取消
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
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        className="create-mcp-form dip-mt-0"
      >
        <Form.Item label="新建方式" name="creation_type">
          <Radio.Group
            disabled={mcpInfo?.mcp_id}
            onChange={() => {
              // 切换新建方式时，清空数据
              setDataSource([]);
            }}
          >
            <Radio value={McpCreationTypeEnum.Custom}>连接已有MCP服务</Radio>
            <Radio value={McpCreationTypeEnum.ToolImported}>
              从工具箱添加
              <Tooltip title="您可以从工具箱添加工具，以MCP的协议对外提供使用">
                <QuestionCircleOutlined className="dip-ml-8 dip-text-color-45 dip-font-16" />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="MCP 服务名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input maxLength={50} placeholder="请输入" />
        </Form.Item>

        <Form.Item label="MCP 服务描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} placeholder="请输入" />
        </Form.Item>
        <Form.Item label="MCP 服务类型" name="category" rules={[{ required: true, message: '请选择服务类型' }]}>
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
          <>
            <Form.Item label="URL" required>
              <div className="dip-flex">
                <Form.Item name="url" className="dip-flex-1" rules={[{ required: true, message: '请输入' }]}>
                  <Input placeholder={`请输入`} />
                </Form.Item>

                <Button style={{ marginLeft: '12px' }} className="dip-w-74" onClick={() => getMcpSSE()}>
                  解析
                </Button>
              </div>
            </Form.Item>
            <Form.Item label="Header列表" name="headers">
              <HeaderList value={mcpInfo?.headers} />
            </Form.Item>
          </>
        )}

        <Form.Item label="工具列表">
          {creationType === McpCreationTypeEnum.Custom ? (
            <Table
              dataSource={dataSource}
              columns={columns}
              bordered
              size="small"
              locale={{
                emptyText: (
                  <div className="dip-flex-column-center">
                    <EmptyIcon className="dip-mb-8" style={{ fontSize: 108 }} />
                    <div className="dip-mb-24 dip-text-color-45 dip-font-13">暂无数据，请先解析URL地址</div>
                  </div>
                ),
              }}
            />
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
