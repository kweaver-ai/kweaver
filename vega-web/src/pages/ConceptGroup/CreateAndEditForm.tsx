import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form } from 'antd';
import { useForm } from 'antd/es/form/Form';
import ColorSelect from '@/components/ColorSelect';
import TagsSelector, { tagsSelectorValidator } from '@/components/TagsSelector';
import api from '@/services/concept-group';
import HOOKS from '@/hooks';
import { Input, Modal } from '@/web-library/common';

interface CreateAndEditFormProps {
  open: boolean;
  id?: string;
  onCancel: () => void;
  callBack?: () => void;
  knId: string;
}

/** 创建和编辑概念分组表单 */
const CreateAndEditForm = (props: CreateAndEditFormProps) => {
  const { open, id, onCancel, callBack, knId } = props;
  const { message } = HOOKS.useGlobalContext();
  const [form] = useForm();

  // 获取概念分组详情
  const getDetail = async () => {
    if (!id || !knId) return;
    const res = await api.detailConceptGroup(knId, id);
    form.setFieldsValue(res);
  };

  useEffect(() => {
    form.resetFields();
    if (id && knId && open) {
      getDetail();
    }
  }, [id, knId, open]);

  // 表单提交
  const onOk = () => {
    form.validateFields().then(async (values) => {
      try {
        // 固定图标为icon-dip-fenzu
        const submitValues = { ...values, icon: 'icon-dip-fenzu' };
        if (id && knId) {
          // 编辑模式
          await api.updateConceptGroup(knId, id, submitValues);
          message.success(intl.get('ConceptGroup.editSuccess'));
        } else if (knId) {
          // 创建模式
          await api.createConceptGroup(knId, { ...submitValues, kn_id: knId, branch: 'main' });
          message.success(intl.get('ConceptGroup.createSuccess'));
        }
        onCancel();
        callBack?.();
      } catch (error: any) {
        console.error('Error submitting form:', error);
      }
    });
  };

  return (
    <Modal open={open} width={640} title={id ? intl.get('Global.edit') : intl.get('Global.create')} onCancel={onCancel} onOk={onOk}>
      <Form layout="vertical" form={form} initialValues={{ icon: 'icon-dip-fenzu', color: '#1890ff' }}>
        <Form.Item
          label={intl.get('Global.name')}
          name="name"
          rules={[
            { required: true, message: intl.get('Global.cannotBeNull', { name: intl.get('Global.name') }) },
            { max: 50, message: intl.get('Global.lenErr', { len: 50 }) },
          ]}
        >
          <Input placeholder={intl.get('ConceptGroup.pleaseInputName')} />
        </Form.Item>
        <Form.Item
          label={intl.get('Global.id')}
          name="id"
          rules={[
            { max: 50, message: intl.get('Global.lenErr', { len: 50 }) },
            { pattern: /^[a-z0-9_-]+$/, message: intl.get('Global.idPatternError') },
          ]}
        >
          <Input placeholder={intl.get('ConceptGroup.pleaseInputId')} disabled={!!id} />
        </Form.Item>
        <Form.Item label={intl.get('ConceptGroup.iconColor')} name="color">
          <ColorSelect icon="icon-dip-fenzu" />
        </Form.Item>
        <Form.Item
          label={intl.get('Global.tag')}
          name="tags"
          rules={[
            {
              validator: tagsSelectorValidator,
            },
          ]}
        >
          <TagsSelector />
        </Form.Item>
        <Form.Item label={intl.get('Global.comment')} name="comment">
          <Input.TextArea placeholder={intl.get('Global.pleaseInputComment')} rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAndEditForm;
