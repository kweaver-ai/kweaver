import { forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Form } from 'antd';
import ToolParamsTable from '@/components/ToolParamsTable';
import ActionSource from './ActionSource';

const Mapping = forwardRef((props: any, ref) => {
  const { form, value, objectTypeId, knId } = props;

  const actionSource = Form.useWatch('action_source', form);

  return (
    <div style={{ width: 900 }}>
      <Form form={form} colon={false} labelAlign="left" initialValues={{ ...value }} layout="vertical">
        <Form.Item label={intl.get('Object.operator')} name="action_source" wrapperCol={{ span: 24 }}>
          <ActionSource {...props} />
        </Form.Item>

        <Form.Item name="parameters">
          <ToolParamsTable ref={ref} actionSource={actionSource} obId={objectTypeId} knId={knId} />
        </Form.Item>

        {/* <Form.Item label="行动监听">
                    <ScheduleExpression {...props} scheduleType={value?.['schedule.type']} />
                </Form.Item> */}
      </Form>
    </div>
  );
});

export default Mapping;
