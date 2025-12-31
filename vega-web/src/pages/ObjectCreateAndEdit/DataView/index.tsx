import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, FormInstance, Input } from 'antd';
import classnames from 'classnames';
import { DataViewSource } from '@/components/DataViewSource';
import OntologyObjectType from '@/services/object/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

const DataView: React.FC<{ form: FormInstance; isEditPage: boolean; dataSource?: OntologyObjectType.DataSource }> = ({ form, isEditPage, dataSource }) => {
  const [useExistDataView, setUseExistDataView] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (dataSource?.id) {
      form.setFieldsValue({
        dataViewId: dataSource.id,
        dataViewName: dataSource.name,
      });
    }
    if (isEditPage) {
      setUseExistDataView(!!dataSource?.id);
    }
  }, [JSON.stringify(dataSource), isEditPage]);

  const changeUseExistDataView = (useExistDataView: boolean) => {
    setUseExistDataView(useExistDataView);
  };

  const handleChooseOk = (e: any[]) => {
    const dataView = e?.[0] || {};
    form.setFieldsValue({
      dataViewId: dataView.id,
      dataViewName: dataView.name,
    });
  };

  return (
    <>
      <div style={{ width: 600, margin: '0 auto' }}>
        <Form form={form} colon={false} labelAlign="left" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          <Form.Item label={intl.get('Object.createMode')}>
            <div className={styles['data-view-type-container']}>
              <div
                className={classnames(styles['data-view-type-item'], useExistDataView && styles['data-view-type-item-active'])}
                onClick={() => changeUseExistDataView(true)}
              >
                <IconFont type="icon-dip-usedata" style={{ fontSize: '36px' }} />
                <div>{intl.get('Object.useExistDataView')}</div>
              </div>
              {!(isEditPage && dataSource?.id) && (
                <div
                  className={classnames(styles['data-view-type-item'], !useExistDataView && styles['data-view-type-item-active'])}
                  onClick={() => changeUseExistDataView(false)}
                >
                  <IconFont type="icon-dip-writeclass" style={{ fontSize: '36px' }} />
                  <div>{intl.get('Object.notUseExistDataView')}</div>
                </div>
              )}
            </div>
          </Form.Item>
          {useExistDataView && (
            <>
              <Form.Item label={intl.get('Global.dataView')} name="dataViewName" rules={[{ required: true, message: intl.get('Global.chooseDataView') }]}>
                <Input style={{ cursor: 'pointer' }} placeholder={intl.get('Global.pleaseSelect')} onClick={() => setOpen(true)} readOnly />
              </Form.Item>
              <Form.Item name="dataViewId" style={{ display: 'none' }}>
                <Input type="hidden" />
              </Form.Item>
            </>
          )}
        </Form>
      </div>
      {/* 数据视图源选择器 */}
      <DataViewSource
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        selectedRowKeys={[form.getFieldValue('dataViewId')]}
        maxCheckedCount={1}
        onOk={(checkedList: any[]) => {
          handleChooseOk(checkedList);
          setOpen(false);
        }}
      />
    </>
  );
};

export default DataView;
