import { useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Upload } from 'antd';
import Cookie from '@/utils/cookie';
import HOOKS from '@/hooks';
import api from '@/services';
import { Button, IconFont, Input, Modal } from '@/web-library/common';
import styles from '../index.module.less';

interface TProps {
  callback: () => void;
  disabledBuilt?: boolean;
}

const ImportCom = (props: TProps) => {
  const { message, modal } = HOOKS.useGlobalContext();
  const { callback, disabledBuilt = false } = props;
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<any>();
  const [form] = Form.useForm();

  /** 上传逻辑 */
  const changeUpload = async (jsonData: any): Promise<void> => {
    const res: any = await api.knowledgeNetwork.createNetwork(jsonData);
    const confirm = async (val: 'ignore' | 'overwrite', modalContext: any): Promise<void> => {
      const resConfirm: any = await api.knowledgeNetwork.createNetwork(jsonData, val);
      modalContext.destroy();
      if (!resConfirm?.error_code) {
        message.success(intl.get('Global.importSuccess'));
        await callback();
      } else {
        // 此处因为没使用 axios-http，所以如果请求失败得手动添加 error 提示
        message.error(resConfirm.description);
      }
    };
    setJsonData(jsonData);

    if (
      res?.error_code &&
      (res?.error_code === 'OntologyManager.KnowledgeNetwork.KNIDExisted' || res?.error_code === 'OntologyManager.KnowledgeNetwork.KNNameExisted')
    ) {
      const modalContext = modal.info({
        title: intl.get('Global.tipTitle'),
        content: (
          <>
            {res.description}。{intl.get('KnowledgeNetwork.importConflictTip')}
          </>
        ),
        icon: ' ',
        footer: (
          <div style={{ display: 'flex', marginTop: 20, justifyContent: 'flex-end' }}>
            <Button type="primary" className="g-mr-2" onClick={() => confirm('overwrite', modalContext)}>
              {intl.get('Global.overwrite')}
            </Button>
            <Button
              className="g-mr-2"
              onClick={() => {
                modalContext.destroy();
                setIsModalVisible(true);
                form.setFieldValue('name', jsonData.name);
                form.setFieldValue('id', jsonData.id);
              }}
            >
              {intl.get('Global.create')}
            </Button>
            <Button className="g-mr-2" onClick={() => confirm('ignore', modalContext)}>
              {intl.get('Global.ignore')}
            </Button>
            <Button onClick={() => modalContext.destroy()}>{intl.get('Global.cancel')}</Button>
          </div>
        ),
      });
    } else if (res?.error_code) {
      message.error(res.description);
    } else {
      message.success(intl.get('Global.importSuccess'));
      await callback();
    }
  };
  const uploadProps = {
    name: 'items_file',
    action: '',
    accept: '.json',
    showUploadList: false,
    headers: { 'Accept-Language': Cookie.get('language') || 'zh-cn', 'X-Language': Cookie.get('language') || 'zh-cn' },
    beforeUpload: (file: any): boolean => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          changeUpload(jsonData);
          setJsonData(jsonData);
        } catch (error) {
          setJsonData(undefined);
          console.error('Error parsing JSON file:', error);
        }
      };
      return false;
    },
  };

  const handleConfirm = async () => {
    await form.validateFields();
    setIsLoading(true);
    const formValues = form.getFieldsValue();
    const requestData = { ...jsonData };
    // 新建导入：使用表单填写的名称和ID
    requestData.name = formValues.name;
    requestData.id = formValues.id;

    const res = await api.knowledgeNetwork.createNetwork(requestData);

    if (!res?.error_code) {
      message.success(intl.get('Global.importSuccess'));
      await callback();
      setIsModalVisible(false);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      message.error(res.description);
    }
  };

  return (
    <>
      <Upload {...uploadProps} disabled={disabledBuilt}>
        <Button disabled={disabledBuilt} icon={<IconFont type="icon-upload" />}>
          {intl.get('Global.import')}
        </Button>
      </Upload>
      {/* 导入弹窗 */}
      <Modal
        title={intl.get('KnowledgeNetwork.importKnowledgeNetwork')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" className={styles.importForm}>
          <Form.Item
            label={intl.get('KnowledgeNetwork.businessKnowledgeNetworkName')}
            name="name"
            rules={[{ required: true, message: intl.get('Global.pleaseInput') }]}
          >
            <Input placeholder={intl.get('Global.pleaseInputName')} />
          </Form.Item>
          <Form.Item label="ID" name="id">
            <Input placeholder={intl.get('Global.pleaseInputId')} />
          </Form.Item>{' '}
        </Form>

        {/* 底部按钮 */}
        <div style={{ display: 'flex', marginTop: 24, justifyContent: 'flex-end' }}>
          <Button type="primary" className="g-mr-2" onClick={handleConfirm} loading={isLoading}>
            {intl.get('Global.import')}
          </Button>
          <Button onClick={() => setIsModalVisible(false)}>{intl.get('Global.cancel')}</Button>
        </div>
      </Modal>
    </>
  );
};

export default ImportCom;
