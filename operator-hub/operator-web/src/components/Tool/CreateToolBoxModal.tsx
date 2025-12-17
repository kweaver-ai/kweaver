import { Modal, Button, message, Upload, Form, Select, Input, Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { editToolBox, getOperatorCategory, postToolBox } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { validateName } from '@/utils/validators';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { useNavigate } from 'react-router-dom';
import { OperateTypeEnum } from '../OperatorList/types';

export default function CreateToolModal({ closeModal, toolBoxInfo, fetchInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const navigate = useNavigate();
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
    if (toolBoxInfo?.box_id) {
      try {
        const { data, box_name, box_desc, box_svc_url, box_category } = values;
        const formData = new FormData();
        formData.append('box_name', box_name);
        formData.append('box_desc', box_desc);
        formData.append('box_svc_url', box_svc_url);
        formData.append('box_category', box_category);
        const file = data?.file;
        if (file) {
          formData.append('metadata_type', 'openapi');
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
    }
    const { data, box_name, box_desc, box_svc_url, box_category, metadata_type } = values;
    const formData = new FormData();
    formData.append('data', data?.file);
    if (box_name) formData.append('box_name', box_name);
    if (box_desc) formData.append('box_desc', box_desc);
    if (box_svc_url) formData.append('box_svc_url', box_svc_url);
    if (box_category) formData.append('box_category', box_category);
    if (metadata_type) formData.append('metadata_type', metadata_type);
    try {
      const { box_id } = await postToolBox(formData);
      message.success('新建成功');
      navigate(`/tool-detail?box_id=${box_id}&action=${OperateTypeEnum.Edit}&back=${btoa(location.pathname)}`);
    } catch (error: any) {
      message.error(error?.description);
    }
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
      title={toolBoxInfo?.box_id ? '编辑工具箱' : '新建工具'}
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={660}
      getContainer={() => microWidgetProps.container}
    >
      <Form
        {...layout}
        form={form}
        // name="upload_form"
        onFinish={onFinish}
        initialValues={initialValues}
        style={{ marginTop: '30px' }}
      >
        {!toolBoxInfo?.box_id && (
          <Form.Item name="data" label="上传文件" rules={[{ required: true, message: '请上传文件' }]}>
            <Upload
              // customRequest={customRequest}
              accept=".yaml,.yml,.json"
              maxCount={1}
              fileList={fileList}
              // showUploadList={false}
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
                const isSupportedFormat = ['json', 'yaml', 'yml'].includes(fileExtension);
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
              <Button icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item name="metadata_type" hidden={true}>
          <Input defaultValue="openapi" />
        </Form.Item>
        {toolBoxInfo?.box_id && (
          <>
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
            <Form.Item label="工具箱服务地址" name="box_svc_url" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder={`请输入`} />
            </Form.Item>
          </>
        )}

        <Form.Item label="工具箱类型" name="box_category" rules={[{ required: true, message: '请选择类型' }]}>
          <Select>
            {categoryType?.map((item: any) => (
              <Select.Option key={item.category_type} value={item.category_type}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {toolBoxInfo?.box_id && (
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
