import { Modal, Button, message, Upload, Form, Select, InputNumber, Checkbox } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getOperatorCategory, postOperatorRegiste } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import { ExecutionModeType } from '../MyOperator/types';

export default function CreateOperatorModal({ closeModal, fetchInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any>([]); // 管理上传文件列表
  const initialValues = {
    operator_execute_control: { timeout: 3000000 },
    operator_info: { execution_mode: ExecutionModeType.Sync },
  };
  const layout = {
    labelCol: { span: 24 },
  };
  const [categoryType, setCategoryType] = useState<any>([]);
  const [isDataSourceDisabled, setIsDataSourceDisabled] = useState<boolean>(false);

  const handleCancel = () => {
    closeModal?.();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data);
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
  }, []);

  // const customRequest = async ({ file }: any) => {
  //   const formData = new FormData();
  //   formData.append('data', file);
  //   formData.append('operator_metadata_type', 'openapi');
  //   form.setFieldsValue({ data: file }); // 更新表单状态
  // };

  const onFinish = async (values: any) => {
    const { data, operator_execute_control, operator_info } = values;
    const formData = new FormData();
    formData.append('data', data?.file);
    formData.append('operator_metadata_type', 'openapi');
    formData.append('operator_execute_control', JSON.stringify(operator_execute_control));
    formData.append('operator_info', JSON.stringify(operator_info));
    try {
      const data = (await postOperatorRegiste(formData)) || [];
      const failedData: any =
        _.map(
          _.filter(data, item => item.status === 'failed'),
          item => ({ ...item, tool_name: item?.name, error_msg: item?.error })
        ) || [];
      message.success(`上传成功${data?.length - failedData?.length}个`);
      closeModal?.(failedData);
      fetchInfo?.();
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

  const handleValuesChange = (changedValues: any) => {
    const execution_mode = changedValues?.operator_info?.execution_mode;
    if (execution_mode && execution_mode === ExecutionModeType.Async) {
      form.setFieldsValue({
        operator_info: {
          is_data_source: false,
        },
      });
      setIsDataSourceDisabled(true);
    }
    if (execution_mode && execution_mode === ExecutionModeType.Sync) {
      setIsDataSourceDisabled(false);
    }
  };

  return (
    <Modal
      title="上传本地JSON/YAML文件"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={600}
      getContainer={() => microWidgetProps.container}
    >
      <Form
        {...layout}
        form={form}
        name="upload_form"
        onFinish={onFinish}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        style={{ marginTop: '30px' }}
      >
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
              { value: 'sync', label: '同步' },
              { value: 'async', label: '异步' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="超时时间(ms)"
          name={['operator_execute_control', 'timeout']}
          rules={[{ required: true, message: '请输入超时时间' }]}
        >
          <InputNumber placeholder={`请输入`} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="发布设置" name={['operator_info', 'is_data_source']} valuePropName="checked">
          <Checkbox disabled={isDataSourceDisabled}>是否为dataFlow数据源算子</Checkbox>
        </Form.Item>
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
