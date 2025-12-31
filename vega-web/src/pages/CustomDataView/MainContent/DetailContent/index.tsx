import { useState, useEffect, useMemo } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import { Divider, Form } from 'antd';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import { formatNodePosition } from '@/utils/dataView';
import api from '@/services/customDataView/index';
import HOOKS from '@/hooks';
import { Text, Title, Button } from '@/web-library/common';
import BasicInfo from './BasicInfo';
import { DataViewContext } from './context';
import DataViewSetting from './DataViewSetting';
import styles from './index.module.less';
import { NodeType } from '../../type';

export const getInitDataScope = () => [
  {
    id: 'node-init',
    type: NodeType.VIEW,
    title: intl.get('CustomDataView.GraphBox.referenceView'),
    input_nodes: [],
    output_nodes: [],
    config: {},
    output_fields: [],
    position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 108 },
  },
  {
    id: 'node-output',
    type: NodeType.OUTPUT,
    title: intl.get('CustomDataView.GraphBox.outputView'),
    input_nodes: [],
    output_nodes: [],
    config: {},
    output_fields: [],
    position: { x: window.innerWidth / 2 + 200, y: window.innerHeight / 2 - 108 },
    node_status: 'error',
  },
];

export const initDataViewTotalInfo = () => ({
  name: '',
  type: 'custom',
  comment: '',
  tags: [],
  group_name: '',
  module_type: 'data_view',
  primary_keys: [],
  data_scope: _.cloneDeep(getInitDataScope()),
});

const DetailContent = () => {
  const history = useHistory();
  const params: { id?: string } = useParams();
  const { id } = params;
  const [currentStep, setCurrentStep] = useState(0);
  const [basicInfoData, setBasicInfoData] = useState<any>(); // 基本配置
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // 加载状态
  const [dataViewTotalInfo, setDataViewTotalInfo] = useState<any>({});
  const [selectedDataView, setSelectedDataView] = useState<any>({});
  const [previewNode, setPreviewNode] = useState<any>({});
  const { modal } = HOOKS.useGlobalContext();

  // 监听页面刷新，提示用户
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (id) {
      loadEditData();
    } else {
      // 创建初始化视图
      setDataViewTotalInfo(initDataViewTotalInfo);
    }
  }, [id]);

  const canSave = useMemo(() => {
    if (selectedDataView?.id) {
      return false;
    }
    if (dataViewTotalInfo.data_scope?.length > 0) {
      const errorNodes = dataViewTotalInfo.data_scope.filter((item: any) => item.node_status === 'error');
      const outputNode = dataViewTotalInfo.data_scope.find((item: any) => item.id === 'node-output');
      if (errorNodes?.length === 0 && outputNode?.output_fields?.length) {
        return true;
      }
    }
    return false;
  }, [dataViewTotalInfo, selectedDataView]);

  const loadEditData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const resArr = await api.getCustomDataViewDetails([id], true);
      const res = resArr?.[0] || {};

      // 格式化节点位置
      if (res.data_scope?.length) {
        res.data_scope = formatNodePosition(res.data_scope);
      }

      const baseInfo = {
        name: res.name || '',
        id: res.id || '',
        comment: res.comment || '',
        tags: res.tags || [],
        group_name: res.group_name || '',
        query_type: res.query_type || '',
      };

      setBasicInfoData(baseInfo);

      setDataViewTotalInfo({
        ...baseInfo,
        primary_keys: res.primary_keys || [],
        query_type: res.query_type || '',
        type: res.type || '',
        data_scope: res.data_scope || [],
      });
    } catch (error) {
      arNotification.error(intl.get('Global.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoSubmit = () => {
    form
      .validateFields()
      .then((values: any) => {
        const cleanValues = {
          ...values,
          name: values.name?.replace(/\t/g, ''),
        };

        if (cleanValues.query_type !== dataViewTotalInfo.query_type) {
          dataViewTotalInfo.data_scope = _.cloneDeep(getInitDataScope());
        }

        setDataViewTotalInfo({ ...dataViewTotalInfo, ...cleanValues });
        setCurrentStep(1);
      })
      .catch((error) => {});
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    try {
      setLoading(true);
      let res;
      if (id) {
        res = await api.updateCustomDataView(id, { ...dataViewTotalInfo });
      } else {
        res = await api.createCustomDataView([{ ...dataViewTotalInfo }]);
      }
      if (res.error_code) {
        return;
      }
      arNotification.success(intl.get('Global.saveSuccess'));
      history.push('/custom-data-view');
    } catch (error) {
      arNotification.error(intl.get('Global.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    modal.confirm({
      title: intl.get('Global.confirmBackTitle'),
      content: intl.get('Global.confirmBackContent'),
      okText: intl.get('Global.ok'),
      cancelText: intl.get('Global.cancel'),
      onOk: () => {
        setDataViewTotalInfo(initDataViewTotalInfo);
        history.push('/custom-data-view');
      },
    });
  };

  return (
    <DataViewContext.Provider value={{ dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView, previewNode, setPreviewNode }}>
      <div className={styles['form-root']}>
        <div className={styles['form-header']}>
          <div className={styles['form-go-back']}>
            <div className="g-pointer g-flex-align-center" onClick={goBack}>
              <LeftOutlined style={{ marginRight: 4 }} />
              <Text>{intl.get('Global.back')}</Text>
            </div>
            <Divider type="vertical" style={{ margin: '0 16px' }} />
            <Title>{!id ? intl.get('CustomDataView.createCustomDataView') : intl.get('CustomDataView.editCustomDataView')}</Title>
          </div>
          {currentStep === 0 ? (
            <div className={styles['form-operate']}>
              <Button onClick={goBack}>{intl.get('Global.cancel')}</Button>
              <Button type="primary" onClick={handleBasicInfoSubmit}>
                {intl.get('Global.next')}
              </Button>
            </div>
          ) : (
            <div className={styles['form-operate']}>
              <Button onClick={() => setCurrentStep(0)}>{intl.get('Global.prev')}</Button>
              <Button disabled={!canSave} type="primary" onClick={handleSave} loading={loading}>
                {intl.get('Global.save')}
              </Button>
            </div>
          )}
        </div>
        <div className={styles['form-content']}>
          <div style={{ visibility: currentStep === 0 ? 'visible' : 'hidden' }}>
            <BasicInfo form={form} filedsValue={basicInfoData} />
          </div>
          <div style={{ visibility: currentStep === 1 ? 'visible' : 'hidden' }}>
            <DataViewSetting />
          </div>
        </div>
      </div>
    </DataViewContext.Provider>
  );
};

export default DetailContent;
