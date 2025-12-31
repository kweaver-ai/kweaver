import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Col, Form, Row, Segmented } from 'antd';
import { useForm } from 'antd/es/form/Form';
import ColorSelect from '@/components/ColorSelect';
import IconSelect from '@/components/IconSelect';
import TagsSelector, { tagsSelectorValidator } from '@/components/TagsSelector';
import frameworkProps from '@/utils/axios-http/frameworkProps';
import api from '@/services/Knowledge-network';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import { Input, Modal } from '@/web-library/common';
import styles from './index.module.less';

export type CreateAndEditModalProps = {
  open: boolean;
  id?: string;
  onCancel: () => void;
  callBack?: () => void;
};

/** 创建和编辑表单 */
const CreateAndEditForm = (props: any) => {
  const { open, id, onCancel, callBack } = props;
  const history = useHistory();
  const { message } = HOOKS.useGlobalContext();
  const [form] = useForm();
  const [createMode, setCreateMode] = useState<'standard' | 'ai'>('standard');

  const getDetail = async () => {
    const res = await api.detailNetwork({ knIds: [id] });
    setTimeout(() => {
      form.setFieldsValue(res);
    });
  };

  useEffect(() => {
    form.resetFields();
    setCreateMode('standard');
    if (id) {
      getDetail();
    }
  }, [id, open]);

  const onOk = () => {
    form.validateFields().then(async (e) => {
      console.log(e, 'evalidateFields');

      // AI创建模式:跳转到微应用
      if (createMode === 'ai' && !id) {
        try {
          const aiDescription = e.aiDescription;
          const microApp = frameworkProps.data;
          // 隐藏侧边栏
          microApp?.toggleSideBarShow?.(false);

          // 跳转到智能体页面
          microApp.history?.getBasePathByName('agent-web-dataagent')?.then((res: any) => {
            const params = new URLSearchParams({
              id: '01KC3E3TTFWJQ5FC8ZEZHX9KQQ', // 智能体Key(唯一的，导入导出不会改变)
              version: 'v0',
              agentAppType: 'common',
              preRoute: microApp.history.getBasePath,
              preRouteIsMicroApp: 'true',
            });

            microApp.navigate(`${res}/usage?${params.toString()}`, { state: { inputValue: aiDescription, fileList: [] } });
          });

          onCancel();
        } catch (error) {}
        return;
      }

      // 标准创建/编辑模式
      if (id) {
        const { id: _id, ...rest } = e;
        const params = {
          ...rest,
          branch: 'main',
        };
        await api.updateNetwork(id, params);
        message.success(intl.get('Global.editSuccess'));
        onCancel();
        callBack?.();
      } else {
        const params = {
          ...e,
          branch: 'main',
        };
        const res = await api.createNetwork(params);
        if (res.error_code) {
          message.error(res.description);
        }
        if (res.id) {
          message.success(intl.get('Global.createSuccess'));
          onCancel();
          localStorage.setItem('KnowledgeNetwork.id', res.id);
          history.push(`/ontology/main/overview?id=${res.id}`);
        }
      }
    });
  };

  return (
    <Modal
      open={open}
      width={640}
      title={intl.get('KnowledgeNetwork.create')}
      onCancel={onCancel}
      onOk={onOk}
      okText={createMode === 'ai' ? intl.get('KnowledgeNetwork.generate') : undefined}
    >
      <div className={styles.createAndEditForm}>
        {!id && (
          <Segmented
            block
            value={createMode}
            onChange={(value) => setCreateMode(value as 'standard' | 'ai')}
            options={[
              { label: intl.get('KnowledgeNetwork.standardCreate'), value: 'standard' },
              { label: intl.get('KnowledgeNetwork.aiCreate'), value: 'ai' },
            ]}
          />
        )}

        {createMode === 'standard' ? (
          <Form layout="vertical" form={form}>
            <Form.Item
              label={intl.get('Global.name')}
              name="name"
              rules={[
                { required: true, message: intl.get('Global.notNull') },
                { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
              ]}
            >
              <Input placeholder={intl.get('Global.placeholder')} />
            </Form.Item>
            <Form.Item
              label="ID"
              name="id"
              rules={[
                { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
                { pattern: ENUMS.REGEXP.LOWER_NUMBER, message: intl.get('Global.idLowercaseLetterNumberOnly') },
              ]}
            >
              <Input placeholder={intl.get('Global.placeholder')} disabled={!!id} />
            </Form.Item>
            <Row gutter={20}>
              <Col span={12}>
                <Form.Item label={intl.get('Global.icon')} name="icon">
                  <IconSelect isPopUp />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={intl.get('Global.color')} name="color" labelCol={{ span: 10 }}>
                  <ColorSelect isPopUp />
                </Form.Item>
              </Col>
            </Row>
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
              <Input.TextArea placeholder={intl.get('Global.placeholder')} />
            </Form.Item>
          </Form>
        ) : (
          <div className={styles.aiCreateContent}>
            <Form layout="vertical" form={form}>
              <Form.Item name="aiDescription" rules={[{ required: true, message: intl.get('Global.notNull') }]}>
                <Input.TextArea className={styles.aiTextArea} placeholder={intl.get('KnowledgeNetwork.aiCreatePlaceholder')} />
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateAndEditForm;
