import React, { useEffect, useRef } from 'react';
import { Button, ConfigProvider, Form, Input } from 'antd';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import { Graph, Node } from '@antv/x6';
import { X6DagNodeType } from '@/components/AdReactX6/components/X6DagNode/enum';
import AdDrawer from '@/components/AdDrawer';

const FormItem = Form.Item;
const TaskNodeForm = ({ onClose, node, graph }: any) => {
  const nodeData = node?.getData();
  const readOnly = nodeData.readOnly;
  const inputRef = useRef<any>();
  const [form] = Form.useForm();
  useEffect(() => {
    const nodeData = (node as Node).getData();
    form.setFieldsValue({
      name: nodeData.name,
      description: nodeData.description,
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  const formChange = (changedValues: any, values: any) => {
    const formError = form.getFieldsError();
    const error = formError.find(item => item.errors.length > 0);
    if (!error) {
      (node as Node).updateData({
        name: values.name,
        description: values.description,
        // error: false
      });
    }
    // if (error) {
    //   (node as Node).updateData({
    //     error: true
    //   });
    // } else {
    //   (node as Node).updateData({
    //     name: values.name,
    //     description: values.description,
    //     error: false
    //   });
    // }
  };

  const formFinish = (values: any) => {
    (graph as Graph).cleanSelection();
    (node as Node).updateData({
      name: values.name,
      description: values.description,
      formVisible: false,
    });
  };

  const validatorName = (_: any, value: string) => {
    const allTaskNodeName = (graph as Graph)
      .getNodes()
      .filter(nodeItem => {
        const nodeData = nodeItem.getData();
        return nodeData.type === X6DagNodeType.taskNode && nodeItem.id !== node.id;
      })
      .map(node => node.getData().name);
    if (allTaskNodeName.includes(value)) {
      return Promise.reject(intl.get('global.repeatName'));
    }
    return Promise.resolve();
  };

  return (
    <AdDrawer
      width={400}
      drag={{ maxWidth: 960 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      title={intl.get('benchmark.config.taskInfo')}
      subTitle={intl.get('benchmark.config.taskSubTitle')}
      visible
    >
      <Form
        form={form}
        layout='vertical'
        // onValuesChange={(changedValues, values) => {
        //   setTimeout(() => {
        //     formChange(changedValues, values);
        //   }, 0);
        // }}
        onFinish={formFinish}
      >
        <FormItem
          name='name'
          label={intl.get('benchmark.config.taskName')}
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
            {
              validator: validatorName,
            },
          ]}
          validateTrigger={['onFocus', 'onChange']}
          validateFirst
        >
          <TrimmedInput
            disabled={readOnly}
            ref={inputRef}
            placeholder={intl.get('benchmark.config.taskNamePlaceholder')}
            autoComplete='off'
            aria-autocomplete='none'
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
          <Input.TextArea disabled={readOnly} placeholder={intl.get('benchmark.config.inputDes')} style={{ height: '96px' }} />
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
  return visible && <TaskNodeForm {...restProps} />;
};
