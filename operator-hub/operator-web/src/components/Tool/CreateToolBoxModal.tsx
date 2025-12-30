import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { Modal, Form, Input, Select, Radio, Typography, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import OpenAPIIcon from '@/assets/icons/open-api.svg';
import FuncIcon from '@/assets/icons/func.svg';
import { getOperatorCategory, postToolBox } from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import { validateName } from '@/utils/validators';
import styles from './CreateToolBoxModal.module.less';
import { metadataTypeMap } from '@/components/OperatorList/metadata-type';

const { Text } = Typography;
const { TextArea } = Input;

interface CreateToolBoxModalProps {
  onCancel: () => void;
  onOk: (boxInfo: {
    box_id: string;
    box_name: string;
    box_category: string;
    box_description: string;
    metadata_type: MetadataTypeEnum;
  }) => void;
}

const CreateToolBoxModal: React.FC<CreateToolBoxModalProps> = ({ onCancel, onOk }) => {
  const [form] = Form.useForm();

  const [categoryType, setCategoryType] = useState<any>([]);
  const [metadataType, setMetadataType] = useState<MetadataTypeEnum | undefined>(undefined);

  const radioOptions = useMemo(
    () => [
      {
        key: MetadataTypeEnum.OpenAPI,
        icon: OpenAPIIcon,
        title: metadataTypeMap[MetadataTypeEnum.OpenAPI],
        desc: '接入现有的 HTTP 服务，支持导入 OpenAPI 规范',
      },
      {
        key: MetadataTypeEnum.Function,
        icon: FuncIcon,
        title: metadataTypeMap[MetadataTypeEnum.Function],
        desc: '在线编写自定义代码逻辑，无需管理服务器，由平台托管运行',
      },
    ],
    []
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getOperatorCategory();
        setCategoryType(data);
        form.setFieldsValue({
          box_category: data[0]?.category_type,
        });
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
  }, []);

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      const { box_id } = await postToolBox(values);
      onOk({ ...values, box_id });
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  return (
    <Modal
      open
      centered
      maskClosable={false}
      title="新建工具箱"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={640}
      okButtonProps={{
        className: 'dip-w-74',
      }}
      cancelButtonProps={{
        className: 'dip-w-74',
      }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <Form form={form} layout="vertical" className={styles['toolbox-form']} autoComplete="off">
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
          <Input placeholder="请输入" showCount maxLength={50} />
        </Form.Item>

        <Form.Item label="工具箱描述" name="box_desc" rules={[{ required: true, message: '请输入描述' }]}>
          <TextArea rows={4} maxLength={255} placeholder="请输入" />
        </Form.Item>

        <Form.Item label="工具箱业务类型" name="box_category" rules={[{ required: true, message: '请选择类型' }]}>
          <Select>
            {categoryType?.map((item: any) => (
              <Select.Option key={item.category_type} value={item.category_type}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          labelCol={{ span: 24 }}
          className={styles['tech-type-item']}
          label={
            <div className="dip-flex-space-between dip-w-100">
              <span>工具箱技术选型</span>
              <Text type="secondary" className={styles['label-tip']} style={{ marginRight: '-12px' }}>
                <InfoCircleOutlined className="dip-mr-8" />
                选择后不支持修改
              </Text>
            </div>
          }
          name="metadata_type"
          rules={[{ required: true, message: '请选择' }]}
        >
          <Radio.Group className={styles['card-radio-group']} onChange={e => setMetadataType(e.target.value)}>
            {radioOptions.map(({ key, title, desc, icon: Icon }) => (
              <Radio.Button
                key={key}
                value={key}
                className={classNames(styles['card-radio-item'], {
                  [styles['card-radio-item-checked']]: metadataType === key,
                })}
              >
                <div className={styles['card-content']}>
                  <div className={styles['card-title']}>
                    <Icon className="dip-font-20 dip-mr-8" />
                    {title}
                  </div>
                  <div className={styles['card-desc']}>{desc}</div>
                </div>
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        {metadataType === MetadataTypeEnum.OpenAPI && (
          <Form.Item label="工具箱服务地址" name="box_svc_url" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder={`请输入`} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CreateToolBoxModal;
