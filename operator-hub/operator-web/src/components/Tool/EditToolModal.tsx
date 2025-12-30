import { useState } from 'react';
import { Modal, Button, message, Form, Input, Upload, Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { editTool } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { validateName } from '@/utils/validators';
import TextArea from 'antd/es/input/TextArea';

export default function EditToolModal({ closeModal, fetchInfo, selectedTool, noEditDate = false }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState<any[]>([]); // 管理上传文件列表

  const initialValues = {
    ...selectedTool,
  };
  const layout = {
    labelCol: { span: 24 },
  };
  const handleCancel = () => {
    closeModal?.();
  };

  const handleRemove = () => {
    setTimeout(() => {
      form.setFieldsValue({ data: undefined });
    }, 10);
    setFileList([]);
  };

  const onFinish = async (values: any) => {
    try {
      if (!noEditDate) {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append('use_rule', values.use_rule);
        formData.append('metadata_type', selectedTool?.metadata_type);
        const file = values.data?.file;
        if (file) {
          formData.append('data', file);
        }

        await editTool(selectedTool?.box_id, selectedTool?.tool_id, formData);
        message.success('编辑成功');
      }
      handleCancel();
      fetchInfo?.({ ...values, box_id: selectedTool?.box_id, tool_id: selectedTool?.tool_id });
    } catch (error: any) {
      if (error?.description) {
        Modal.info({
          centered: true,
          title: '无法编辑工具',
          content: error.description,
          getContainer: () => microWidgetProps.container,
        });
      }
    }
  };

  return (
    <Modal
      centered
      title="编辑工具"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={670}
      getContainer={() => microWidgetProps.container}
      maskClosable={false}
    >
      <Form
        {...layout}
        form={form}
        style={{ maxHeight: '600px', overflow: 'auto' }}
        onFinish={onFinish}
        initialValues={initialValues}
        className="create-mcp-form"
      >
        <Form.Item
          required
          label="工具名称"
          name="name"
          rules={[
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject('请输入算子名称');
                }

                if (!validateName(value, true)) {
                  return Promise.reject('仅支持输入中文、字母、数字、下划线');
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input maxLength={50} showCount />
        </Form.Item>

        <Form.Item label="工具描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} placeholder="请输入" maxLength={500} />
        </Form.Item>
        <Form.Item label="工具规则" name="use_rule">
          <TextArea rows={4} placeholder="请输入" />
        </Form.Item>
        {selectedTool?.resource_object !== 'operator' && (
          <Form.Item label="更新数据" name="data">
            <Upload
              accept=".yaml,.yml,.json"
              maxCount={1}
              fileList={fileList}
              onRemove={handleRemove}
              beforeUpload={file => {
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.info('上传的文件大小不能超过5MB');
                  setTimeout(() => {
                    form.setFieldsValue({ data: undefined });
                  }, 10);
                  return false;
                }
                const fileExtension = file?.name?.split('.')?.pop()?.toLowerCase() || '';
                const isSupportedFormat = ['yaml', 'yml', 'json'].includes(fileExtension);
                if (!isSupportedFormat) {
                  message.info('上传格式不正确，只能是yaml或json格式的文件');

                  setTimeout(() => {
                    form.setFieldsValue({ data: undefined });
                  }, 10);
                  return false;
                }
                setFileList([file]);
                return false;
              }}
            >
              <ul
                style={{ listStyle: 'inside disc', color: 'rgba(0, 0, 0, 0.45)' }}
                className="dip-pl-8"
                onClick={e => e.stopPropagation()}
              >
                <li>
                  <span style={{ marginLeft: '-8px' }}>上传使用OpenAPI 3.0协议的JSON或YAML文件</span>
                </li>
                <li>
                  <span style={{ marginLeft: '-8px' }}>文件大小不能超过5M</span>
                </li>
              </ul>
              <Button icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item noStyle>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" className="dip-mr-8 dip-w-74">
              确定
            </Button>
            <Button className="dip-w-74" onClick={() => closeModal?.()}>
              取消
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
