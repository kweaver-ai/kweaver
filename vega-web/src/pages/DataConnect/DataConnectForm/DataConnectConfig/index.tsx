import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form, FormInstance, Input, InputNumber, Radio, Select } from 'antd';
import DataConnectType from '@/services/dataConnect/type';
import { SCHEMA_REQUIRED_TYPES, USER_ID_REQUIRED_TYPES } from '../../utils';
import styles from '../index.module.less';

const { TextArea } = Input;

interface TProps {
  initialVal: any;
  isEdit: boolean;
  checkDataSource?: DataConnectType.Connector;
  updateSecretKey?: boolean;
  setUpdateSecretKey: (val: boolean) => void;
  form: FormInstance;
}

const BasicConfig = ({ initialVal, isEdit, checkDataSource, setUpdateSecretKey, form }: TProps): JSX.Element => {
  const { setFieldsValue } = form;
  // 使用 Form.useWatch 替代 getFieldValue
  const setValues = (): void => {
    if (initialVal) {
      const {
        authMethod,
        deployMethod,
        name,
        comment,
        bin_data: { storage_protocol },
      } = initialVal;

      setFieldsValue({ authMethod, deployMethod, name, comment, bin_data: { storage_protocol } });
      setTimeout(() => setFieldsValue({ bin_data: { ...initialVal.bin_data, password: '********' } }), 0);
    }
  };

  const authMethod = Form.useWatch('authMethod', form);
  const deployMethod = Form.useWatch('deployMethod', form);
  const binDataStorageProtocol = Form.useWatch(['bin_data', 'storage_protocol'], form);

  useEffect(() => {
    setValues();
  }, [JSON.stringify(initialVal)]);

  const getRules = (name = '', maxLength = 100): any => [
    {
      required: true,
      message: intl.get('Global.cannotNull', { name: intl.get(`DataConnect.${name}`) }),
    },
    {
      max: maxLength,
      message: intl.get('Global.maxLength', { name: intl.get(`DataConnect.${name}`), maxLength }),
    },
  ];

  const storageProtocolList = [
    { label: 'anyshare', value: 'anyshare' },
    { label: 'doclib', value: 'doclib' },
  ];
  const connectProtocolList = checkDataSource?.connect_protocol.split(',') || [];

  const onPasswordFocus = (): void => {
    if (isEdit) {
      // 确认密码是否编辑过
      setUpdateSecretKey(true);
      setFieldsValue({
        bin_data: { password: '' },
      });
    }
  };
  // 显示连接地址 和 端口
  const isHost = binDataStorageProtocol !== 'doclib';
  // 显示数据库
  const isDatabaseName =
    checkDataSource?.olk_connector_name &&
    checkDataSource?.olk_connector_name != 'opensearch' &&
    !USER_ID_REQUIRED_TYPES.includes(checkDataSource?.olk_connector_name as any);
  // 显示用户
  const isUser = authMethod !== 1 && isHost;
  // 判断是用户名 还是用户ID
  const isUserId = checkDataSource?.olk_connector_name && USER_ID_REQUIRED_TYPES.includes(checkDataSource?.olk_connector_name as any);
  // 显示token
  const isToken = authMethod === 1 && checkDataSource?.olk_connector_name === 'inceptor-jdbc';
  // 显示模式方式
  const isSchema = checkDataSource?.olk_connector_name && SCHEMA_REQUIRED_TYPES.includes(checkDataSource?.olk_connector_name as any);
  // 显示副本集名称，仅副本集模式部署的Mongo数据源使用
  const isReplicaSet = deployMethod !== 0 && checkDataSource?.olk_connector_name === 'mongodb';
  // 显示存储介质， excel必填，分文档库（doclib） 和 anyshare
  const isStorageProtocol = checkDataSource?.olk_connector_name === 'excel';
  // 显示存储路径， excel、anyshare7数据源必填
  const isStorageBase = checkDataSource?.olk_connector_name === 'excel' || checkDataSource?.olk_connector_name === 'anyshare7';

  useEffect(() => {
    if (isStorageProtocol) {
      setFieldsValue({ bin_data: { connect_protocol: binDataStorageProtocol !== 'doclib' ? 'https' : 'http' } });
    } else {
      const connectProtocolAry = checkDataSource?.connect_protocol.split(',') || [];

      setFieldsValue({ bin_data: { connect_protocol: connectProtocolAry[0] } });
    }
  }, [binDataStorageProtocol, checkDataSource?.connect_protocol]);

  return (
    <div className={styles['content-wrapper-form']}>
      <Form.Item
        label={intl.get('Global.dataSourceName_common')}
        name="name"
        preserve={true}
        initialValue={initialVal?.name}
        rules={[
          {
            required: true,
            message: intl.get('Global.cannotNull', { name: intl.get('Global.dataSourceName_common') }),
          },
          {
            validator: (_rule, value: string, callback): void => {
              if (value && value.length > 128) {
                callback(
                  intl.get('Global.maxLength', {
                    name: intl.get('Global.dataSourceName_common'),
                    maxLength: 128,
                  })
                );
              }
              // 正则规则：id只能包含小写英文字母、数字、下划线，且不能以下划线开头
              const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/;

              if (value && !regex.test(value)) {
                callback(intl.get('DataConnect.dataSourceNameTest'));
              }

              callback();
            },
          },
        ]}
      >
        <Input placeholder={intl.get('Global.pleaseInput')} />
      </Form.Item>
      {isStorageProtocol && (
        <Form.Item
          label={intl.get('DataConnect.storageProtocol')}
          name={['bin_data', 'storage_protocol']}
          rules={getRules('storageProtocol')}
          initialValue={'anyshare'}
        >
          <Select disabled={isEdit}>
            {storageProtocolList.map((val) => (
              <Select.Option key={val.value} value={val.value}>
                {intl.get(`DataConnect.${val.label}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      {isDatabaseName && (
        <Form.Item
          label={intl.get('DataConnect.databaseName')}
          name={['bin_data', 'database_name']}
          rules={getRules('databaseName', 100)}
          initialValue={initialVal?.bin_data.database_name}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
      )}
      {isSchema && (
        <Form.Item
          label={intl.get('DataConnect.schemaName')}
          name={['bin_data', 'schema']}
          rules={getRules('schemaName', 100)}
          initialValue={initialVal?.bin_data.schema}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
      )}
      <Form.Item
        label={intl.get('DataConnect.connectProtocol')}
        name={['bin_data', 'connect_protocol']}
        preserve={true}
        rules={[
          {
            required: true,
            message: intl.get('Global.cannotNull', { name: intl.get('DataConnect.connectProtocol') }),
          },
        ]}
        initialValue={initialVal?.bin_data?.connect_protocol ?? connectProtocolList[0]}
      >
        <Select disabled={isEdit || isStorageProtocol || connectProtocolList.length === 1}>
          {connectProtocolList.map((val) => (
            <Select.Option key={val} value={val}>
              {val}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {isHost && (
        <div className={styles['box-row']}>
          <Form.Item
            label={intl.get('DataConnect.host')}
            className={styles['box-row-left']}
            name={['bin_data', 'host']}
            rules={getRules('host', 256)}
            initialValue={initialVal?.bin_data?.host || ''}
          >
            <Input placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          <Form.Item
            label={intl.get('DataConnect.port')}
            className={styles['box-row-right']}
            name={['bin_data', 'port']}
            rules={[
              {
                required: true,
                message: intl.get('Global.cannotNull', { name: intl.get('DataConnect.port') }),
              },
            ]}
            initialValue={initialVal?.bin_data?.port}
          >
            <InputNumber precision={0} placeholder={intl.get('Global.pleaseInput')} className={styles['full-width']} />
          </Form.Item>
        </div>
      )}
      {checkDataSource?.olk_connector_name === 'inceptor-jdbc' && (
        <Form.Item
          label={intl.get('DataConnect.authMethod')}
          name="authMethod"
          rules={[
            {
              required: true,
              message: intl.get('Global.cannotNull', { name: intl.get('DataConnect.authMethod') }),
            },
          ]}
          initialValue={initialVal?.authMethod || 0}
        >
          <Radio.Group>
            <Radio value={1}>{intl.get('DataConnect.tokenMethod')}</Radio>
            <Radio value={0}>{intl.get('DataConnect.userPasswordMethod')}</Radio>
          </Radio.Group>
        </Form.Item>
      )}
      {isToken && (
        <Form.Item
          label={intl.get('DataConnect.token')}
          name={['bin_data', 'token']}
          rules={getRules('token')}
          initialValue={initialVal?.bin_data?.account || ''}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
      )}
      <div className={styles['box-row']}>
        {isUser && (
          <Form.Item
            label={isUserId ? intl.get('DataConnect.userID') : intl.get('DataConnect.userName')}
            className={styles['box-row-left']}
            name={['bin_data', 'account']}
            rules={getRules(isUserId ? 'userID' : 'userName')}
            initialValue={initialVal?.bin_data?.account || ''}
          >
            <Input placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
        )}
        {/* 密码 */}
        {isUser && (
          <Form.Item
            label={intl.get('DataConnect.password')}
            className={styles['box-row-right']}
            name={['bin_data', 'password']}
            rules={getRules('password', 1000)}
            initialValue={isEdit ? '********' : ''}
          >
            <Input type="password" onFocus={onPasswordFocus} placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
        )}
      </div>
      {checkDataSource?.olk_connector_name === 'mongodb' && (
        <Form.Item
          label={intl.get('DataConnect.deployMethod')}
          name="deployMethod"
          rules={[
            {
              required: true,
              message: intl.get('Global.cannotNull', { name: intl.get('DataConnect.deployMethod') }),
            },
          ]}
          initialValue={initialVal?.deployMethod || 1}
        >
          <Radio.Group>
            <Radio value={1}>{intl.get('DataConnect.deployMethodReplicaSet')}</Radio>
            <Radio value={0}>{intl.get('DataConnect.deployMethodSingle')}</Radio>
          </Radio.Group>
        </Form.Item>
      )}
      {isReplicaSet && (
        <Form.Item
          label={intl.get('DataConnect.replicaSetName')}
          name={['bin_data', 'replica_set']}
          rules={getRules('replicaSetName')}
          initialValue={initialVal?.bin_data?.replica_set || ''}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
      )}
      {isStorageBase && (
        <Form.Item
          label={intl.get('DataConnect.storageBase')}
          name={['bin_data', 'storage_base']}
          rules={getRules('storageBase')}
          initialValue={initialVal?.bin_data?.storage_base || ''}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
      )}
      <Form.Item label={intl.get('Global.comment')} name="comment" preserve={true} initialValue={initialVal?.comment || ''}>
        <TextArea rows={4} maxLength={255} />
      </Form.Item>
    </div>
  );
};

export default BasicConfig;
