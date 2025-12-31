import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { Form, Spin, Button } from 'antd';
import HeaderSteps from '@/components/HeaderSteps';
import { encryptData } from '@/utils/encrypt-RSA';
import api from '@/services/dataConnect';
import ConnectType from '@/services/dataConnect/type';
import HOOKS from '@/hooks';
import DataConnectConfig from './DataConnectConfig';
import DataConnectType from './DataConnectType';
import styles from './index.module.less';

const DataSourceForm = (): JSX.Element => {
  const [form] = Form.useForm();
  const urlPrefix = `/data-connect`;
  const [current, setCurrent] = useState<number>(0);
  const { resetFields } = form;
  const [initialValue, setInitialValue] = useState<ConnectType.Data>();
  const [checkDataSource, setCheckDataSource] = useState<ConnectType.Connector>();
  const [updateSecretKey, setUpdateSecretKey] = useState<boolean>(false);
  const [connectors, setConnectors] = useState<ConnectType.Connector[]>([]);
  const [loading, setloading] = useState<boolean>(false);
  const { message } = HOOKS.useGlobalContext();
  const history = useHistory();
  const params: any = useParams();
  const { id } = params || {};

  const getDataSourceConnectors = async (): Promise<void> => {
    const res = await api.getDataSourceConnectors();

    setConnectors(res.connectors);
    setCheckDataSource(res.connectors[0]);
    if (id) {
      setCurrent(1);
      const resDetail = await api.getDataSourceById(id);
      // setDataSourceType(res.type);
      const curDataSource = res.connectors.find((val) => val.olk_connector_name === resDetail.type);

      setCheckDataSource(curDataSource);
      setInitialValue(resDetail);
    } else {
      setCheckDataSource(res.connectors[0]);
    }
  };

  useEffect(() => {
    getDataSourceConnectors();
  }, []);

  const steps = [
    {
      title: intl.get('DataConnect.selConnectType'),
    },
    { title: intl.get('DataConnect.dataSourceConfig') },
  ];

  const stepsDom: Record<number, JSX.Element> = {
    0: <DataConnectType connectors={connectors} checkDataSource={checkDataSource} setCheckDataSource={setCheckDataSource} />,
    1: (
      <DataConnectConfig
        form={form}
        initialVal={initialValue}
        isEdit={!!id}
        checkDataSource={checkDataSource}
        updateSecretKey={updateSecretKey}
        setUpdateSecretKey={setUpdateSecretKey}
      />
    ),
  };

  const goBack = (): void => {
    history.push(urlPrefix);
  };

  const complete = (): void => {
    history.push(urlPrefix);
  };

  const next = (): void => {
    if (current === 0) {
      setCurrent(current + 1);

      return;
    }
    form.validateFields().then(async (values) => {
      setloading(true);
      const { name, bin_data, comment } = values;
      const password = bin_data.password ? { password: encryptData(bin_data.password) } : {};
      let curVal = {
        name,
        bin_data: {
          ...bin_data,
          ...password,
        },
        comment,
        type: checkDataSource?.olk_connector_name,
      };

      if (id && !updateSecretKey) {
        const curPassword = bin_data.token ? {} : { password: initialValue?.bin_data.password };

        curVal = {
          name,
          type: checkDataSource?.olk_connector_name,
          comment,
          bin_data: {
            ...bin_data,
            ...curPassword,
          },
        };
      }
      try {
        const res = !id ? await api.createDataSource(curVal) : await api.updateDataSource(id, curVal);

        setloading(false);
        if (!res?.code) {
          message.success(intl.get('Global.saveSuccess'));
          complete();
        }
      } catch {
        setloading(false);
      }
    });
  };

  const pre = (): void => {
    setCurrent(current - 1);
  };

  const postTestConnect = (): void => {
    form.validateFields().then(async (values) => {
      const { bin_data } = values;
      const password = bin_data.password ? { password: encryptData(bin_data.password) } : {};
      let curVal = {
        bin_data: {
          ...bin_data,
          ...password,
        },
        type: checkDataSource?.olk_connector_name,
      };

      if (id && !updateSecretKey) {
        const curPassword = bin_data.token ? {} : { password: initialValue?.bin_data.password };

        curVal = {
          type: checkDataSource?.olk_connector_name,
          bin_data: {
            ...bin_data,
            ...curPassword,
          },
        };
      }
      const res = await api.postTestConnect(curVal);

      if (res) {
        message.success(intl.get('Global.testConnectorSucc'));
      }
    });
  };

  return (
    <div className={styles['dataview-form-wrapper']}>
      <HeaderSteps
        title={!id ? intl.get('DataConnect.newDataSource') : intl.get('DataConnect.editDataSource')}
        stepsCurrent={current}
        items={steps}
        goBack={goBack}
      />
      <Spin spinning={loading} delay={500}>
        <div className={styles['content-wrapper']}>
          <Form form={form} layout="vertical">
            {stepsDom[current]}
          </Form>
          <div className={styles['button-container']} data-step={current}>
            <div>{current === 1 && <Button onClick={postTestConnect}>{intl.get('Global.testConnector')}</Button>}</div>
            <div>
              {current === 1 && !id && (
                <Button className="g-mr-2" onClick={pre}>
                  {intl.get('Global.prev')}
                </Button>
              )}
              <Button className="g-mr-2" type="primary" loading={loading} disabled={loading} onClick={next}>
                {current === 1 ? intl.get('Global.ok') : intl.get('Global.next')}
              </Button>
              <Button
                onClick={() => {
                  goBack();
                }}
              >
                {intl.get('Global.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default DataSourceForm;
