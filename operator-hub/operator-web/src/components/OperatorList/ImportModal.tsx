import { Modal, Button, message, Upload, Form, Radio, Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { impexImport } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useState } from 'react';
import { OperatorTypeEnum } from './types';
import styles from './ImportModal.module.less';

export default function ImportModal({ closeModal, fetchInfo, activeTab }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any>([]); // 管理上传文件列表
  const [loading, setLoading] = useState<boolean>(false);

  const layout = {
    labelCol: { span: 24 },
  };
  const handleCancel = () => {
    closeModal?.();
  };

  const onFinish = async () => {
    try {
      // 校验表单
      await form.validateFields();

      setLoading(true);
      const { data, mode } = form.getFieldsValue();
      const formData = new FormData();
      formData.append('data', data?.file);
      if (mode) formData.append('mode', mode);
      try {
        // activeTab 与后端 type 的映射：mcp→mcp，tool_box→toolbox，operator→operator；因此需去掉下划线
        await impexImport(formData, activeTab?.replace('_', '') || OperatorTypeEnum.MCP);
        message.success('导入成功');
        fetchInfo?.();
        handleCancel();
      } catch (error: any) {
        if (error?.description) {
          message.error(error?.description);
        }
      } finally {
        setLoading(false);
      }
    } catch {}
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
      title="导入"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={640}
      getContainer={() => microWidgetProps.container}
      className={styles['import-modal']}
    >
      <Form {...layout} form={form} className="dip-mt-24">
        <Form.Item label="导入模式" name="mode" required initialValue="create">
          <Radio.Group>
            <Radio
              value="create"
              style={{ width: '100%', marginBottom: '8px' }}
              className={styles['import-mode-radio']}
            >
              创建模式
              <div style={{ opacity: 0.5 }} className="dip-mt-4">
                仅创建新的算子资源，若算子资源已存在则终止导入
              </div>
            </Radio>
            <Radio value="upsert" className={styles['import-mode-radio']}>
              更新模式
              <div style={{ opacity: 0.5 }} className="dip-mt-4">
                若导入的算子资源已存在，则更新配置；若不存在，则创建
              </div>
            </Radio>
          </Radio.Group>
        </Form.Item>
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
              const isSupportedFormat = ['json'].includes(fileExtension);
              if (!isSupportedFormat) {
                message.info('上传格式不正确，只能是json格式的文件');

                setTimeout(() => {
                  form.setFieldsValue({ data: undefined });
                }, 10);
                return false;
              }
              setFileList([file]);
              return false;
            }}
          >
            <Tooltip title="文件大小不超过5M，文件格式为JSON" placement="right">
              <Button icon={<UploadOutlined />}>上传</Button>
            </Tooltip>
          </Upload>
        </Form.Item>
        <Form.Item noStyle>
          <div style={{ textAlign: 'right' }}>
            <Button className="dip-mr-8 dip-w-74" type="primary" htmlType="submit" loading={loading} onClick={onFinish}>
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
