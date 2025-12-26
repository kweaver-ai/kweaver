import { useEffect, useState } from 'react';
import { Form, Input, message, Radio, Select } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import AdIconList from '@/components/AdIconList';
import { copyBenchmarkConfigById, createBenchmarkConfig, getBenchmarkTemplateConfigList, getDatasetExampleByTemplateId } from '@/services/benchmark';
import _ from 'lodash';
import DatasetExample from './DatasetExample';
import './style.less';

const FormItem = Form.Item;
const BenchmarkConfigModal = ({ onClose, editData, onJumpConfigPage, copyData, tableData }: any) => {
  const prefixLocale = 'benchmark.config';
  const [nameFieldValidate, setNameFieldValidate] = useState({
    status: undefined as any,
    help: undefined as any,
  });
  const [templateOptions, setTemplateOptions] = useState<any>([]);
  const [form] = Form.useForm();
  const templateId = Form.useWatch('template', form);

  useEffect(() => {
    if (editData) {
      // 说明是编辑
      form.setFieldsValue({
        name: editData.name,
        description: editData.description,
        color: editData.color,
      });
    }
    if (copyData) {
      // 说明是编辑
      form.setFieldsValue({
        name: getCopyName(`${copyData.name}${intl.get('global.duplicate')}`),
        description: copyData.description,
        color: copyData.color,
      });
    }
    getConfigTemplate();
  }, []);

  useEffect(() => {
    if (templateId) {
      getDatasetExample();
    }
  }, [templateId]);

  const getDatasetExample = async () => {
    const data = await getDatasetExampleByTemplateId(templateId);
    if (data) {
      form.setFieldValue('templateExample', data);
    }
  };

  const getConfigTemplate = async () => {
    const data = await getBenchmarkTemplateConfigList();
    if (data) {
      const templateData = data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
      setTemplateOptions(templateData);
    }
  };

  const getCopyName = (name: string): any => {
    const filterArr = _.filter(tableData, item => item.name === name);
    if (filterArr.length > 0) {
      return getCopyName(name + intl.get('global.duplicate'));
    }
    return name;
  };

  const formFinish = async (values: any) => {
    let res: any;
    if (copyData || values.type === 0) {
      let params: any = {};
      if (copyData) {
        params = {
          old_id: copyData.id,
          new_name: values.name,
          new_description: values.description ?? '',
          new_color: values.color,
        };
      } else {
        params = {
          old_id: values.template,
          new_name: values.name,
          new_description: values.description ?? '',
          new_color: values.color,
        };
      }
      const data = await copyBenchmarkConfigById(params);
      if (data) {
        message.success(intl.get('global.copySuccess'));
        onJumpConfigPage(data);
      } else {
        setNameFieldValidate({
          status: 'error',
          help: intl.get('global.repeatName'),
        });
      }
    } else {
      delete values.type;
      res = await createBenchmarkConfig(values);
      if (res) {
        onJumpConfigPage(res);
      } else {
        setNameFieldValidate({ status: 'error', help: intl.get('global.repeatName') });
      }
    }
  };

  return (
    <UniversalModal
      className='BenchmarkConfigModal'
      title={intl.get(`${prefixLocale}.${editData ? 'editConfig' : copyData ? 'copyConfig' : 'createConfig'}`)}
      width={640}
      onCancel={onClose}
      open
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onClose },
        { label: intl.get('global.createTwo'), type: 'primary', onHandle: form.submit },
      ]}
    >
      <Form style={{ overflow: 'auto' }} className='BenchmarkConfigModal-form' form={form} layout='vertical' onFinish={formFinish} scrollToFirstError>
        <FormItem
          name='name'
          label={intl.get(`${prefixLocale}.configName`)}
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
          ]}
          validateStatus={nameFieldValidate.status}
          help={nameFieldValidate.help}
        >
          <TrimmedInput
            placeholder={intl.get(`${prefixLocale}.namePlaceholder`)}
            autoComplete='off'
            aria-autocomplete='none'
            onChange={() => {
              if (nameFieldValidate.status === 'error') {
                setNameFieldValidate({ status: undefined, help: undefined });
              }
            }}
          />
        </FormItem>
        {!copyData && (
          <FormItem label={intl.get(`${prefixLocale}.type`)} name='type' rules={[{ required: true, message: intl.get('global.noNull') }]} initialValue={1}>
            <Radio.Group
              onChange={() => {
                form.setFieldsValue({ template: undefined, templateExample: undefined });
              }}
            >
              <Radio value={1}>{intl.get(`${prefixLocale}.blankConfig`)}</Radio>
              <Radio value={0}>{intl.get(`${prefixLocale}.templateConfig`)}</Radio>
            </Radio.Group>
          </FormItem>
        )}

        <FormItem noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
          {({ getFieldValue }) =>
            getFieldValue('type') === 0 && (
              <>
                <FormItem
                  className='ad-mb-3'
                  label={intl.get(`${prefixLocale}.template`)}
                  name='template'
                  rules={[{ required: true, message: intl.get('global.noNull') }]}
                >
                  <Select placeholder={intl.get(`${prefixLocale}.templatePlaceholder`)} options={templateOptions} />
                </FormItem>
                {getFieldValue('template') && (
                  <FormItem name='templateExample'>
                    <DatasetExample />
                  </FormItem>
                )}
              </>
            )
          }
        </FormItem>

        <FormItem
          name='description'
          label={intl.get('global.desc')}
          rules={[
            { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
            { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
          ]}
        >
          <Input.TextArea placeholder={intl.get(`${prefixLocale}.inputDes`)} style={{ height: '96px' }} />
        </FormItem>
        <FormItem
          label={intl.get('global.color')}
          name='color'
          rules={[{ required: true, message: intl.get('global.noNull') }]}
          initialValue='icon-color-pz-126EE3'
          className='ad-mb-0'
        >
          <AdIconList
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
      </Form>
    </UniversalModal>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <BenchmarkConfigModal {...restProps} />;
};
