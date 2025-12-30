import { Modal, Button, message, Form, Select, InputNumber, Input, Checkbox, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getOperatorCategory, postOperatorInfo } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { validateName } from '@/utils/validators';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { ExecutionModeType } from './types';

export default function EditOperatorModal({ closeModal, operatorInfo, fetchInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();
  const initialValues = {
    operator_execute_control: { timeout: 3000000 },
    operator_info: { execution_mode: ExecutionModeType.Sync },
    ...operatorInfo,
  };
  const layout = {
    labelCol: { span: 24 },
  };
  const [categoryType, setCategoryType] = useState<any>([]);
  const [isDataSourceDisabled, setIsDataSourceDisabled] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any[]>([]); // 管理上传文件列表

  const handleCancel = () => {
    closeModal?.();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data);
        if (!operatorInfo?.operator_info?.execution_mode)
          form.setFieldsValue({
            operator_info: {
              category: data[0]?.category_type,
            },
          });
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
    setIsDataSourceDisabled(operatorInfo?.operator_info?.execution_mode === ExecutionModeType.Async);
  }, []);

  const onFinish = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('operator_id', operatorInfo.operator_id);
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('operator_info', JSON.stringify(values.operator_info));
      formData.append('operator_execute_control', JSON.stringify(values.operator_execute_control));
      formData.append('metadata_type', operatorInfo.metadata_type);
      const file = values.data?.file;
      if (file) {
        formData.append('data', file);
      }

      await postOperatorInfo(formData);
      message.success('更新成功');
      handleCancel();
      fetchInfo?.();
    } catch (error: any) {
      if (error?.description) {
        Modal.info({
          centered: true,
          title: '无法编辑算子',
          content: error.description,
          getContainer: () => microWidgetProps.container,
        });
      }
    }
  };

  const handleValuesChange = (changedValues: any) => {
    const execution_mode = changedValues?.operator_info?.execution_mode;
    if (execution_mode && execution_mode === ExecutionModeType.Async) {
      setIsDataSourceDisabled(true);
      form.setFieldsValue({
        operator_info: {
          is_data_source: false,
        },
      });
    }
    if (execution_mode && execution_mode === ExecutionModeType.Sync) {
      setIsDataSourceDisabled(false);
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
      title="编辑算子"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={600}
      getContainer={() => microWidgetProps.container}
      styles={{
        // 弹窗高度最大为80vh，这里的72px为弹窗header + 间距的高度
        body: { maxHeight: 'calc(80vh - 72px)', overflowY: 'auto', paddingRight: 24, marginBottom: 32 },
        content: { paddingRight: 0 },
        footer: { paddingRight: 24 },
      }}
    >
      <Form
        {...layout}
        form={form}
        name="upload_form"
        onFinish={onFinish}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          label="算子名称"
          name="name"
          required
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

        <Form.Item label="算子描述" name="description" rules={[{ required: true, message: '请输入算子描述' }]}>
          <TextArea rows={4} maxLength={500} placeholder="请尽量详细描述算子的主要功能和使用场景。描述将展示给用户" />
        </Form.Item>
        <Form.Item
          label="算子类型"
          name={['operator_info', 'category']}
          rules={[{ required: true, message: '请选择算子类型' }]}
        >
          <Select>
            {categoryType?.map((item: any) => (
              <Select.Option key={item.category_type} value={item.category_type}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="运行方式" name={['operator_info', 'execution_mode']}>
          <Select
            options={[
              { value: ExecutionModeType.Sync, label: '同步' },
              { value: ExecutionModeType.Async, label: '异步' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="超时时间(ms)"
          name={['operator_execute_control', 'timeout']}
          rules={[
            { required: true, message: '请输入超时时间' },
            { type: 'integer', min: 1, message: '超时时间必须为大于0的整数' },
          ]}
        >
          <InputNumber placeholder={`请输入`} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="发布设置" name={['operator_info', 'is_data_source']} valuePropName="checked">
          <Checkbox disabled={isDataSourceDisabled}>是否为dataFlow数据源算子</Checkbox>
        </Form.Item>
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
        <Form.Item noStyle>
          <div style={{ position: 'absolute', bottom: 20, right: 24 }}>
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
