import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Divider } from 'antd';
import { EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import { Text, Title, Button, Input, Form, Modal } from '@/common';

const rulesConfig = (keys: string[], maxInput = 50) => {
  const rules = {
    required: { required: true, message: intl.get('global.cannotBeNull') },
    max: { max: maxInput, message: intl.get('global.lenErr', { len: maxInput }) },
    onlyKeyboard: { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
  };

  return _.map(keys, (key: string) => rules[key as keyof typeof rules]);
};

const Setting = (props: any) => {
  const [modal, contextHolder] = Modal.useModal();
  const { sourceData } = props;

  const [form] = Form.useForm();

  const [isEdit, setIsEdit] = useState(false);

  const onDelete = () => {
    modal.confirm({
      title: '确认要删除评测数据集吗？',
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: `[${sourceData.name}]一旦删除，其所有的数据文件将永久地删除，请谨慎操作。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {},
    });
  };

  return (
    <div>
      {contextHolder}
      <div className='g-flex-align-center'>
        <Title level={3}>基本信息</Title>
        <Divider type='vertical' style={{ borderColor: 'rgba(0,0,0,.15)' }} />
        <Button.Link icon={<EditOutlined />} onClick={() => setIsEdit(true)}>
          编辑
        </Button.Link>
      </div>
      <Form className='g-mt-4' form={form} colon={false} layout='vertical' initialValues={{ ...sourceData }}>
        <Form.Item name='name' label='名称' rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}>
          <Input.Spell disabled={!isEdit} style={{ width: '100%' }} placeholder={intl.get('global.pleaseEnter')} />
        </Form.Item>
        <Form.Item name='description' label='简介'>
          <Input.TextArea disabled={!isEdit} autoSize={{ minRows: 2 }} style={{ resize: 'none', height: 66, minHeight: 66, padding: '10px 12px' }} />
        </Form.Item>
      </Form>
      {isEdit && (
        <div className='g-mt-4'>
          <Button className='g-mr-2' type='primary' onClick={() => setIsEdit(false)}>
            保存
          </Button>
          <Button onClick={() => setIsEdit(false)}>取消</Button>
        </div>
      )}
      <Divider variant='dashed' style={{ borderColor: 'rgba(0, 0, 0, 0.15)' }} />
      <div className='g-border g-border-radius g-flex-space-between' style={{ padding: '16px 32px' }}>
        <div className='g-flex-column'>
          <Text>删除评测数据集</Text>
          <Text className='g-mt-1'>此操作将会删除与数据集相关的所有资源，且此操作不可逆，请谨慎确认是否要删除此数据集。</Text>
        </div>
        <div>
          <Button danger onClick={onDelete}>
            删除评测集
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Setting;
