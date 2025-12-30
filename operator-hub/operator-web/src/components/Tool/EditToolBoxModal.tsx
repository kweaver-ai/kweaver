import { Modal, Button, message, Upload, Form, Select, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { editToolBox, getOperatorCategory } from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import { useMicroWidgetProps } from '@/hooks';
import { validateName } from '@/utils/validators';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import TemplateDownloadSection from '@/components/TemplateDownloadSection';

export default function EditToolBoxModal({ closeModal, toolBoxInfo, fetchInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any>([]); // 管理上传文件列表
  const initialValues = {
    metadata_type: 'openapi',
    ...toolBoxInfo,
  };
  const layout = {
    labelCol: { span: 24 },
  };
  const [categoryType, setCategoryType] = useState<any>([]);
  const handleCancel = () => {
    closeModal?.();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data);
        form.setFieldsValue({
          box_category: toolBoxInfo?.category_type || data[0]?.category_type,
        });
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
  }, []);

  const onFinish = async (values: any) => {
    try {
      const { data, box_name, box_desc, box_svc_url, box_category } = values;
      const formData = new FormData();
      formData.append('box_name', box_name);
      formData.append('box_desc', box_desc);
      formData.append('box_svc_url', box_svc_url);
      formData.append('box_category', box_category);
      formData.append('metadata_type', toolBoxInfo.metadata_type);
      const file = data?.file;
      if (file) {
        formData.append('data', file);
      }
      const { edit_tools } = await editToolBox(toolBoxInfo?.box_id, formData);
      if (edit_tools?.length) {
        Modal.success({
          title: '编辑成功',
          centered: true,
          getContainer: () => microWidgetProps.container,
          content: (
            <div>
              <div className="dip-mb-12">以下 {edit_tools?.length} 个工具更新成功：</div>
              <TextArea
                readOnly
                rows={4}
                value={edit_tools?.map(({ name }: any) => name)?.join('\n')}
                style={{
                  whiteSpace: 'pre',
                }}
              />
            </div>
          ),
        });
      } else {
        message.success('编辑成功');
      }
      handleCancel();
      fetchInfo?.();
    } catch (error: any) {
      if (error?.description) {
        Modal.info({
          centered: true,
          title: '无法编辑工具箱',
          content: error.description,
          getContainer: () => microWidgetProps.container,
        });
      }
    }
    return false;
  };

  const handleRemove = () => {
    setTimeout(() => {
      form.setFieldsValue({ data: undefined });
    }, 10);
    setFileList([]);
  };

  return (
    <Modal
      centered
      title="编辑工具箱"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={660}
      getContainer={() => microWidgetProps.container}
    >
      <Form {...layout} form={form} onFinish={onFinish} initialValues={initialValues} style={{ marginTop: '30px' }}>
        <Form.Item name="metadata_type" hidden={true}>
          <Input defaultValue="openapi" />
        </Form.Item>

        <Form.Item
          required
          label="工具箱名称"
          name="box_name"
          rules={[
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject('请输入工具箱名称');
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

        <Form.Item label="工具箱描述" name="box_desc" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} maxLength={255} placeholder="请尽量详细描述主要功能和使用场景。描述将展示给用户" />
        </Form.Item>

        {toolBoxInfo?.metadata_type === MetadataTypeEnum.OpenAPI && (
          <Form.Item label="工具箱服务地址" name="box_svc_url" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder={`请输入`} />
          </Form.Item>
        )}

        <Form.Item label="工具箱业务类型" name="box_category" rules={[{ required: true, message: '请选择类型' }]}>
          <Select>
            {categoryType?.map((item: any) => (
              <Select.Option key={item.category_type} value={item.category_type}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {toolBoxInfo?.metadata_type === MetadataTypeEnum.OpenAPI && (
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
              <div style={{ color: 'rgba(0, 0, 0, 0.45)' }} className="dip-pl-16" onClick={e => e.stopPropagation()}>
                <div>上传使用OpenAPI 3.0协议的JSON或YAML文件</div>
                <div>文件大小不能超过5M</div>
                <TemplateDownloadSection className="dip-mb-8" />
              </div>
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
