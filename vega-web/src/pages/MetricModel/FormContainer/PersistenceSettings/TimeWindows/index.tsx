import { useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Table } from 'antd';
import { Drawer, Button } from '@/web-library/common';
import { getNewStr } from '../../utils';
import NumFixItem from '../TracingDuration';

const TimeWindows = (props: any): JSX.Element => {
  const [form] = Form.useForm();
  const { value: valueProps = [], onChange } = props;
  const [visibleTimeWindows, setVisibleTimeWindows] = useState<boolean>(false);

  const onClose = (): void => {
    setVisibleTimeWindows(false);
    form.resetFields();
  };

  const onOpen = (): void => {
    form.resetFields();
    setVisibleTimeWindows(true);
  };

  const onSubmit = async (): Promise<void> => {
    form.validateFields().then(async (values: any) => {
      const arrVal = valueProps ?? [];
      if (values.customTimeValue && !arrVal?.includes(values.customTimeValue)) {
        onChange([values.customTimeValue, ...arrVal]);
        onClose();
      }
    });
  };

  const deleteConfirm = (id: string): void => {
    const copyValues = valueProps.filter((item: any) => item !== id);

    onChange(copyValues);
  };

  const columns = [
    {
      title: intl.get('MetricModel.persistenceTaskTimeWindows'),
      dataIndex: 'name',
      width: '80%',
      render: (_text: any, record: any) => getNewStr(record),
    },
    {
      title: intl.get('Global.operation'),
      render: (_text: any, record: any) => <Button.Link onClick={() => deleteConfirm(record)}>{intl.get('Global.delete')}</Button.Link>,
    },
  ];

  return (
    <div>
      <Button onClick={onOpen} disabled={valueProps?.length >= 5}>
        {intl.get('MetricModel.addTimeWindows')}
      </Button>
      {!!valueProps && valueProps?.length > 0 && (
        <Table
          size="small"
          rowKey="0"
          columns={columns}
          dataSource={valueProps}
          pagination={{
            hideOnSinglePage: true,
            size: 'small',
            pageSizeOptions: ['10', '20', '50'],
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      )}
      <Drawer title={intl.get('MetricModel.addTimeWindows')} open={visibleTimeWindows} onClose={onClose} width={500}>
        <Form
          form={form}
          {...{
            labelCol: { span: 6 },
            wrapperCol: { span: 14 },
            colon: false,
          }}
        >
          <Form.Item
            name="customTimeValue"
            label={intl.get('MetricModel.persistenceTaskTimeWindows')}
            rules={[
              {
                required: true,
                validator: (_: any, value: any) => {
                  if (!value) {
                    return Promise.reject(new Error(intl.get('MetricModel.windowsTypeCannotNull')));
                  } else if (valueProps?.includes(value)) {
                    return Promise.reject(new Error(intl.get('MetricModel.windowsTypeCannotRepeat')));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <NumFixItem />
          </Form.Item>
        </Form>
        <div
          style={{
            position: 'absolute' as const,
            right: 0,
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e9e9e9',
            padding: '10px 16px',
            textAlign: 'right' as const,
          }}
        >
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            {intl.get('Global.cancel')}
          </Button>
          <Button onClick={onSubmit} type="primary">
            {intl.get('Global.ok')}
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default TimeWindows;
