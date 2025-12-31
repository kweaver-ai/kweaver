import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Form, Select } from 'antd';
import { FORM_LAYOUT } from '@/hooks/useConstants';
import api from '@/services/customDataView';
import { GroupType } from '../../../type';

interface Props {
  visible: boolean;
  title: string;
  onOk: (values: { moveToGroupName: string }) => void;
  onCancel: () => void;
}

export const MoveToGroupModal: React.FC<Props> = ({ visible, title, onOk, onCancel }) => {
  const [form] = Form.useForm();
  const [allGroupList, setAllGroupList] = useState<GroupType[]>([]);

  // 获取分组列表
  useEffect(() => {
    visible &&
      api.getGroupList().then((res) => {
        setAllGroupList(res.entries);
      });
  }, [visible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.validateFields().then((values) => {
      onOk(values);
    });
  };

  return (
    <Modal title={title} width={600} open={visible} onOk={handleSubmit} onCancel={onCancel}>
      <Form form={form} {...FORM_LAYOUT}>
        <Form.Item name="moveToGroupName" label={intl.get('Global.targetGroupName')}>
          <Select showSearch optionFilterProp="children">
            {allGroupList
              .filter((v) => v.name && !v.builtin)
              .map((item) => {
                return (
                  <Select.Option key={item.name} value={item.name}>
                    {item.name === '' ? intl.get('Global.ungrouped') : item.name}
                  </Select.Option>
                );
              })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
