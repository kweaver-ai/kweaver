import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Button, Divider, Form, Input, message } from 'antd';
import _ from 'lodash';

import AdIconList from '@/components/AdIconList';
import { DeleteModal } from '@/components/TipModal';
import useAdHistory from '@/hooks/useAdHistory';

import { dataSetDeleteById, dataSetEdit, dataSetGetById } from '@/services/dataSet';

import { getParam, getTextByHtml } from '@/utils/handleFunction';
import { ONLY_VALID_NAME, charMap, charToString } from '@/pages/DataManage/enum';

import './style.less';

export const dataSetInitData = {
  name: '',
  delimiter: ',',
  color: 'icon-color-sjj-FADB14',
  description: '',
  exp_permission: '',
};

export interface SettingProps {
  className?: string;
  onOk: any;
  refreshInfo: any;
  info: any;
  isChange: any;
  setIsChange: any;
}

const Setting = forwardRef((props: SettingProps, ref) => {
  const { onOk, refreshInfo, info, isChange, setIsChange } = props;

  const [form] = Form.useForm();
  const [preFormData, setPreFormData] = useState(dataSetInitData); // 部分字段单独控制
  const inputRef = useRef<any>(null);
  const isEdit = true;
  const { action, _dataSet: ds_id } = getParam(['action', '_dataSet']);
  const history = useAdHistory();

  useImperativeHandle(ref, () => ({
    handleOk,
    reset,
  }));

  useEffect(() => {
    setTimeout(async () => {
      const { name, description, exp_permission, color, versions } = info;
      const delimiter: any = charToString(charMap, info?.delimiter || ',');

      form.setFieldsValue({ name, delimiter, color, description });
      setPreFormData({ name, delimiter, color, description, exp_permission });
    }, 0);
  }, []);

  const reset = async () => {
    const { name, description, exp_permission, color, versions } = await dataSetGetById(ds_id);
    const delimiter: any = charToString(charMap, info?.delimiter || ',');

    form.setFieldsValue({ name, delimiter, color, description });
    setPreFormData({ name, delimiter, color, description, exp_permission });
  };

  const onFormChange = (value: any) => {
    const { name = preFormData.name, description = preFormData.description, color = preFormData.color } = value;
    if (name !== preFormData.name || description !== preFormData.description || color !== preFormData.color) {
      setIsChange(true);
      return;
    }
    setIsChange(false);
  };

  /**
   * 校验成功后发送请求
   */
  const handleOk = () => {
    form.validateFields().then(async formValues => {
      const body: any = {
        ...formValues,
        name: formValues.name.trim(),
        description: getTextByHtml(formValues.description) ? formValues.description : '', // 去除空的富文本
      };
      try {
        const res = await dataSetEdit(ds_id, _.omit(body, 'delimiter') as any);
        if (res) {
          refreshInfo();
          message.success(intl.get('global.editSuccess'));
          setIsChange(false);
          setPreFormData(body);
        }
      } catch (err: any) {
        const { Description, ErrorCode } = err?.response || err.data || err;
        if (ErrorCode === 'KnBuilder.ArgsErr' || ErrorCode === 'KnBuilder.DataSet.NameAlreadyExist') {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
          // return;
        }
      }
    });
  };

  const confirmDelete = async (ds_id: any) => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      currentDeleteName: info?.name,
      currentDeleteType: intl.get('delete.dataSet'),
    });
    if (!isOk) return;
    // refresh();
    const res = await dataSetDeleteById(ds_id);
    if (res) {
      await message.success(intl.get('global.delSuccess'));
      onOk();
      Promise.resolve().then(() => {
        setTimeout(() => {
          history.push('/dataManage/dataSet-list');
        }, 1000);
      });
    }
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 26 },
  };

  return (
    <div className='dataSet-files-setting ad-w-100 ad-h-100 ad-pt-6'>
      <Form
        form={form}
        {...layout}
        autoComplete='off'
        aria-autocomplete='none'
        initialValues={{ ...dataSetInitData }}
        onValuesChange={onFormChange}
        className='dataSet-edit-form'
      >
        <Form.Item
          label={intl.get('dataSet.config.dataSetName')}
          name='name'
          validateFirst
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            { pattern: ONLY_VALID_NAME, message: intl.get('dataSet.fileNameRule') },
          ]}
        >
          <Input disabled={isEdit} placeholder={intl.get('global.pleaseEnter')} autoComplete='off' aria-autocomplete='none' ref={inputRef} />
        </Form.Item>

        <Form.Item label={intl.get('dataSet.config.delimiter')} name='delimiter' validateFirst rules={[{ required: true, message: intl.get('global.noNull') }]}>
          <Input disabled={true} placeholder={intl.get('global.pleaseEnter')} autoComplete='off' aria-autocomplete='none' />
        </Form.Item>

        <Form.Item
          label={intl.get('global.desc')}
          name='description'
          validateFirst
          rules={[
            {
              validator: async (_, value) => {
                const text = getTextByHtml(value);
                if (!text) return;

                if (text.length > 255) {
                  throw new Error(intl.get('global.lenErr', { len: 255 }));
                }
              },
            },
          ]}
        >
          <Input.TextArea disabled={isEdit} style={{ height: 96, resize: 'none' }} />
        </Form.Item>

        <Form.Item name='color' label={intl.get('dataSet.color')} required>
          <AdIconList
            disabled={isEdit}
            iconList={[
              'icon-color-sjj-FADB14',
              'icon-color-sjj-FF8501',
              'icon-color-sjj-F75959',
              'icon-color-sjj-F759AB',
              'icon-color-sjj-9254DE',
              'icon-color-sjj-126EE3',
              'icon-color-sjj-019688',
              'icon-color-sjj-13C2C2',
              'icon-color-sjj-52C41A',
              'icon-color-sjj-8C8C8C',
            ]}
            // defaultValue="icon-color-rw-FADB14"
          />
        </Form.Item>

        <Form.Item name='color' required className='ad-mb-0' style={{ paddingLeft: 335 }}>
          <Button
            onClick={handleOk}
            disabled={!isChange}
            style={{
              color: isChange ? '#126EE3' : 'rgba(18,110,227,0.45)',
              border: isChange ? '1px solid #126EE3 ' : '1px solid rgba(18,110,227,0.45)',
              cursor: 'pointer',
              background: !isChange ? '#fff' : '#fff',
            }}
          >
            {intl.get('global.ok')}
          </Button>

          <Divider
            style={{
              width: 900,
              transform: 'translateX(-150px)',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              margin: '40px 0 24px',
            }}
          />
          <p style={{ width: 700, transform: 'translateX(-96px)', marginBottom: 24 }}>
            {intl.get('dataSet.deleteDataSetTip').split('\n')[0]}
            &nbsp;{intl.get('dataSet.deleteDataSetTip').split('\n')[1]}
          </p>
          <Button onClick={() => confirmDelete(ds_id)} style={{ color: '#F5222D', border: '1px solid #F5222D' }} className='ad-mb-6'>
            {intl.get('global.delete')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});

export default Setting;
