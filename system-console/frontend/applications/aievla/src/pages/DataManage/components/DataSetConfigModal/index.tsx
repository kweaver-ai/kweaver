import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Popover, Radio } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import AdIconList from '@/components/AdIconList';
import UniversalModal from '@/components/UniversalModal';

import HOOKS from '@/hooks';
import { getTextByHtml } from '@/utils/handleFunction';

import { ONLY_KEYBOARD, ONLY_VALID_NAME, charMap, chatMapString } from '../../enum';

import { dataSetCreate, dataSetEdit, dataSetGetById } from '@/services/dataSet';

import './style.less';
import classNames from 'classnames';

export interface DataSetCreateFormProps {
  key?: string;
  children?: React.ReactNode;
  action: any;
  ds_id?: any;
  setShow?: any;
  onOk?: any;
}

export const dataSetFormInitData = {
  name: '',
  delimiter: ',',
  color: 'icon-color-sjj-FADB14',
  description: '',
  exp_permission: '',
};

const DataSetConfigModal = (props: DataSetCreateFormProps) => {
  const prefixCls = 'dataSet-create-modal';
  const { children, action, ds_id = '', setShow, onOk = () => {} } = props;
  const history = useHistory();
  const [form] = Form.useForm();
  const [preFormData, setPreFormData] = useState(dataSetFormInitData); // 部分字段单独控制
  const [showCustomDelimiter, setShowCustomDelimiter] = useState(false); // 自定义分隔符
  const [delimiterValue, setDelimiterValue] = useState('');
  const [delimiterErr, setDelimiterErr] = useState(false);
  const [errTip, setErrTip] = useState('');
  const [isChange, setIsChange] = useState(false);
  const inputRef = useRef<any>(null);
  const inputDelimiterRef = useRef<any>(null);
  const mountRef = useRef(false);
  const language = HOOKS.useLanguage();

  useEffect(() => {
    setTimeout(async () => {
      try {
        if (action === 'editForm' || action === 'rename') {
          const res = await dataSetGetById(ds_id);
          const { name, description, exp_permission, color, versions } = res;
          // const delimiter = charToString(charMap, res?.delimiter || ',');

          let delimiter = res?.delimiter || ',';
          if (!_.includes(_.keys(charMap), res?.delimiter || ',')) {
            delimiter = 'custom';
            setDelimiterValue(res?.delimiter);
            setShowCustomDelimiter(true);
            setDelimiterErr(false);
          }

          form.setFieldsValue({ name, delimiter, color, description });
          setPreFormData({ name, delimiter, color, description, exp_permission });
        } else {
          form.setFieldsValue({ ...dataSetFormInitData });
          setPreFormData({ ...dataSetFormInitData });
        }
      } catch (err) {
        // console.log('err');
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (!mountRef.current) {
      inputRef.current!.focus({
        cursor: 'end',
      });
      mountRef.current = true;
    }
  }, [inputRef.current]);

  const onFormChange = (value: any) => {
    const { name = preFormData.name, delimiter = preFormData.delimiter, description = preFormData.description, color = preFormData.color } = value;
    if (name !== preFormData.name || delimiter !== preFormData.delimiter || description !== preFormData.description || color !== preFormData.color) {
      setIsChange(true);
      return;
    }
    setIsChange(false);
  };

  const handleCancel = async () => {
    // if (isChange) {
    //   const isOk = await tipModalFunc({
    //     title: intl.get('dataSet.config.exitPrompt').split('\n')[0],
    //     content: (
    //       <div className={language === 'en-US' ? 'dataSet-edit-config' : ''}>
    //         {intl.get('dataSet.config.exitPrompt').split('\n')[1]}
    //       </div>
    //     ),
    //     okText: intl.get('global.ok'),
    //     cancelText: intl.get('global.cancel'),
    //     closable: true
    //   });
    //   if (!isOk) return;
    // }
    setShow(false);
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
      let res: any = {};
      try {
        if (action === 'editForm' || action === 'rename') {
          res = await dataSetEdit(ds_id, _.omit(body, 'delimiter') as any);
          if (res) {
            setShow(false);
            setTimeout(() => {
              onOk();
              if (action === 'rename') return;
              Promise.resolve().then(() => {
                history.push(`/evaluation-data/manager?action=edit&name=${formValues.name}&_dataSet=${res.res.ds_id}`);
              });
            }, 100);
          }
        } else {
          const isValid = await handleDelimiterErr();
          if (!isValid && body.delimiter === 'custom') return;
          const delimiter = body.delimiter === 'custom' ? delimiterValue : body.delimiter;

          res = await dataSetCreate({ ...body, delimiter });
          if (res) {
            Promise.resolve().then(() => {
              history.push(`/evaluation-data/manager?action=create&name=${formValues.name}&_dataSet=${res.res.ds_id}`);
            });
          }
        }
      } catch (err: any) {
        const { ErrorCode } = err?.response || err.data || err;
        if (ErrorCode === 'KnBuilder.ArgsErr' || ErrorCode === 'KnBuilder.DataSet.NameAlreadyExist') {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
          // return;
        }
      }
    });
  };

  useEffect(() => {
    handleDelimiterErr();
  }, [delimiterValue]);

  const handleDelimiterErr = async () => {
    if (!delimiterValue) {
      setErrTip(intl.get('global.noNull'));
      setDelimiterErr(() => true);
      return false;
    }

    if (delimiterValue.length !== 1) {
      setErrTip(intl.get('global.lenErr', { len: 1 }));
      setDelimiterErr(() => true);
      return false;
    }

    if (!ONLY_KEYBOARD.test(delimiterValue)) {
      setErrTip(intl.get('dataSet.delimiterRule'));
      setDelimiterErr(() => true);
      return false;
    }
    return true;
  };

  return (
    <UniversalModal
      className={`${prefixCls}`}
      title={
        action === 'create'
          ? intl.get('dataSet.config.createDataSet')
          : action === 'rename'
            ? intl.get('dataSet.config.reName')
            : intl.get('dataSet.config.editDataSet')
      }
      width={640}
      visible={true}
      onOk={handleOk}
      onCancel={() => handleCancel()}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: () => handleCancel() },
        {
          label: action === 'create' ? intl.get('global.createTwo') : intl.get('global.save'),
          type: 'primary',
          onHandle: handleOk,
        },
      ]}
    >
      <Form
        form={form}
        layout='vertical'
        autoComplete='off'
        aria-autocomplete='none'
        initialValues={{ ...dataSetFormInitData }}
        onValuesChange={onFormChange}
        className='dataSetCreate-form'
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
          <Input placeholder={intl.get('global.pleaseEnter')} autoComplete='off' aria-autocomplete='none' ref={inputRef} />
        </Form.Item>

        <Form.Item label={intl.get('dataSet.config.delimiter')} name='delimiter' validateFirst rules={[{ required: true, message: intl.get('global.noNull') }]}>
          <Radio.Group
            disabled={action !== 'create'}
            onChange={e => {
              setDelimiterErr(false);
              if (e.target.value === 'custom') {
                setShowCustomDelimiter(true);
                return;
              }
              setShowCustomDelimiter(false);
            }}
            className='ad-m-0'
          >
            {_.map(_.keys(charMap), item => (
              <Radio className='align-item ad-mr-8' value={item || ''} key={item}>
                {chatMapString(item)}
              </Radio>
            ))}
            <Radio className='align-item-input' value={'custom'} key={'custom'}>
              <div className='ad-align-center popover-delimiter'>
                {intl.get('dataSet.custom')}
                <span>
                  <Popover
                    style={{ zIndex: 5 }}
                    open={showCustomDelimiter && delimiterErr}
                    content={errTip}
                    showArrow={false}
                    placement='leftBottom'
                    getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
                  >
                    <Input
                      className={classNames('ad-m-0 ad-ml-2', {
                        'ant-input-status-error': showCustomDelimiter && delimiterErr,
                      })}
                      style={{ width: 150 }}
                      placeholder={intl.get('global.pleaseEnter')}
                      autoComplete='off'
                      aria-autocomplete='none'
                      hidden={!showCustomDelimiter}
                      disabled={action !== 'create'}
                      ref={inputDelimiterRef}
                      value={delimiterValue}
                      defaultValue={delimiterValue}
                      onChange={e => {
                        setDelimiterErr(false);
                        inputDelimiterRef.current.focus({
                          cursor: 'end',
                        });
                        setDelimiterValue(e.target.value);

                        Promise.resolve().then(() => {
                          inputDelimiterRef.current.focus({
                            cursor: 'end',
                          });
                        });
                      }}
                    />
                  </Popover>
                </span>
              </div>
            </Radio>
          </Radio.Group>
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
          <Input.TextArea style={{ height: 96, resize: 'none' }} />
        </Form.Item>

        <Form.Item name='color' label={intl.get('dataSet.color')} required className='ad-mb-0'>
          <AdIconList
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
      </Form>
    </UniversalModal>
  );
};

export default DataSetConfigModal;
