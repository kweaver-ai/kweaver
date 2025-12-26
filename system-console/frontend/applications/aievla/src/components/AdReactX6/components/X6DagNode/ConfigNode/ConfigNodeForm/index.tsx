import React, { useEffect, useState } from 'react';
import AdDrawer from '@/components/AdDrawer';
import intl from 'react-intl-universal';
import { Button, ConfigProvider, Form, Input } from 'antd';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import AdIconList from '@/components/AdIconList';
import { Graph, Node } from '@antv/x6';
import { validatorConfigNameRepeat } from '@/services/benchmark';

const FormItem = Form.Item;
const ConfigNodeForm = ({ node, graph }: any) => {
  const nodeData = node?.getData();
  const readOnly = nodeData.readOnly;
  const prefixLocale = 'benchmark.config';
  const [form] = Form.useForm();
  const [nameFieldValidate, setNameFieldValidate] = useState({
    status: undefined as any,
    help: undefined as any,
  });

  useEffect(() => {
    form.setFieldsValue({
      name: nodeData.name,
      description: nodeData.description,
      icon: nodeData.icon,
    });
  }, []);

  const formFinish = async (values: any) => {
    if (values.name !== nodeData.originalName) {
      const data = await validatorConfigNameRepeat(values.name);
      if (!data) {
        nodeData.updateConfigName(values.name);
        (node as Node).updateData({
          ...values,
          formVisible: false,
        });
        (graph as Graph).cleanSelection();
      } else {
        setNameFieldValidate({
          status: 'error',
          help: intl.get('global.repeatName'),
        });
      }
    } else {
      (graph as Graph).cleanSelection();
      (node as Node).updateData({
        ...values,
        formVisible: false,
      });
      nodeData.updateConfigName(values.name);
    }
  };

  return (
    <AdDrawer
      title={intl.get('benchmark.config.configTitle')}
      subTitle={intl.get('benchmark.config.configSubTitle')}
      width={400}
      drag={{ maxWidth: 960 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      visible
    >
      <Form form={form} layout='vertical' onFinish={formFinish}>
        <FormItem
          name='name'
          label={intl.get(`${prefixLocale}.configName`)}
          rules={[
            {
              required: true,
              message: intl.get('global.noNull'),
            },
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('global.onlyKeyboard'),
            },
            {
              max: 50,
              message: intl.get('global.lenErr', { len: 50 }),
            },
          ]}
          validateStatus={nameFieldValidate.status}
          help={nameFieldValidate.help}
        >
          <TrimmedInput
            disabled={readOnly}
            placeholder={intl.get(`${prefixLocale}.namePlaceholder`)}
            autoComplete='off'
            aria-autocomplete='none'
            onChange={() => {
              if (nameFieldValidate.status === 'error') {
                setNameFieldValidate({
                  status: undefined,
                  help: undefined,
                });
              }
            }}
          />
        </FormItem>
        <FormItem
          name='description'
          label={intl.get('global.desc')}
          rules={[
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('global.onlyKeyboard'),
            },
            {
              max: 255,
              message: intl.get('global.lenErr', { len: 255 }),
            },
          ]}
        >
          <Input.TextArea disabled={readOnly} placeholder={intl.get(`${prefixLocale}.inputDes`)} style={{ height: '96px' }} />
        </FormItem>
        <FormItem
          label={intl.get('global.color')}
          name='icon'
          rules={[
            {
              required: true,
              message: intl.get('global.noNull'),
            },
          ]}
        >
          <AdIconList
            disabled={readOnly}
            gap={6}
            iconList={[
              'icon-color-pz-FADB14',
              'icon-color-pz-FF8501',
              'icon-color-pz-F759AB',
              'icon-color-pz-F75959',
              'icon-color-pz-9254DE',
              'icon-color-pz-126EE3',
              'icon-color-pz-019688',
              'icon-color-pz-13C2C2',
              'icon-color-pz-52C41A',
              'icon-color-pz-8C8C8C',
            ]}
          />
        </FormItem>
        {!readOnly && (
          <FormItem noStyle>
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                size='small'
                onClick={() => {
                  form.submit();
                }}
                type='primary'
              >
                {intl.get('global.ok')}
              </Button>
              <Button
                style={{ marginLeft: 10 }}
                size='small'
                onClick={() => {
                  (graph as Graph).cleanSelection();
                  node.updateData({ formVisible: false });
                }}
              >
                {intl.get('global.cancel')}
              </Button>
            </ConfigProvider>
          </FormItem>
        )}
      </Form>
    </AdDrawer>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <ConfigNodeForm {...restProps} />;
};
