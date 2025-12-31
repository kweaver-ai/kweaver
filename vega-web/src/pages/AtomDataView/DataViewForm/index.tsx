import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Button, Col, Form, Input, Row } from 'antd';
import { FORM_LAYOUT } from '@/hooks/useConstants';
import api from '@/services/atomDataView';
import AtomDataViewType from '@/services/atomDataView/type';
import DataConnectType from '@/services/dataConnect/type';
import HOOKS from '@/hooks';
import { Drawer } from '@/web-library/common';
import FieldTable from './fieldTable';
import styles from './index.module.less';

interface PropType {
  id: string;
  visible: boolean;
  checkDatasource?: DataConnectType.Data & { excel_file_name: string };
  onClose: (val?: boolean) => void;
}

const { TextArea } = Input;

const DataViewForm = ({ visible, onClose, id, checkDatasource }: PropType): JSX.Element => {
  const [form] = Form.useForm();
  const { resetFields, setFieldsValue } = form;
  const { message } = HOOKS.useGlobalContext();

  const [fieldData, setFieldData] = useState<AtomDataViewType.Field[]>([]);
  const [detail, setDetail] = useState<AtomDataViewType.Data>();
  const [editingKey, setEditingKey] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const getDetail = async (): Promise<void> => {
    const resDetail = await api.getDataViewsByIds([id]);

    if (resDetail && resDetail.length > 0) {
      console.log(resDetail[0], 'resDetail[0]');
      const cur = resDetail[0];
      setFieldsValue({ name: cur.name, technical_name: cur.technical_name, comment: cur.comment });
      setDetail(cur);
      setFieldData(cur.fields);
      setPage(1);
    }
  };

  useEffect(() => {
    setFieldData([]);
    setPage(1);
    setDetail(undefined);
    if (id) {
      getDetail();
    }
  }, [id]);

  const onCancel = async (bool?: boolean): Promise<void> => {
    resetFields();
    setDetail(undefined);
    setFieldData([]);
    setPage(1);
    onClose(!!bool);
  };

  const onOk = async (): Promise<void> => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const { name, comment } = values;
        const paramsFields = {
          fields: fieldData,
          name,
          comment,
        };

        await api.updateDataViewAttrs(id, paramsFields);

        setLoading(false);
        message.success(intl.get('Global.saveSuccess'));
        onCancel(true);
        return;
      } catch {
        setLoading(false);
      }
    });
  };

  return (
    <Drawer title={intl.get('Global.edit')} open={visible} onClose={(): Promise<void> => onCancel()} width={800} closable={false} maskClosable={false}>
      <div className={styles['dataview-form-wrapper']}>
        <Form form={form} {...FORM_LAYOUT}>
          <div className={styles['title']}>
            <span> </span>
            {intl.get('Global.baseConfig')}
          </div>
          <Form.Item
            label={intl.get('Global.name')}
            name="name"
            preserve={true}
            initialValue={detail?.name}
            rules={[
              {
                required: true,
                message: intl.get('Global.nameCannotNull'),
              },
              {
                max: 100,
                message: intl.get('Global.nameCannotOverFourty'),
              },
            ]}
          >
            <Input placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          <Form.Item
            label={intl.get('DataView.technicalName')}
            name="technical_name"
            preserve={true}
            initialValue={detail?.technical_name}
            rules={[
              {
                required: true,
                message: intl.get('DataView.technicalNameCannotNull'),
              },
              {
                validator: (_rule, value: string, callback): void => {
                  if (value && value.length > 255) {
                    callback(intl.get('DataView.technicalNameMaxLength'));
                  }
                  callback();
                },
              },
            ]}
          >
            <Input placeholder={intl.get('Global.pleaseInput')} disabled />
          </Form.Item>
          <Form.Item label={intl.get('Global.comment')} name="comment" preserve={true} initialValue={detail?.comment || ''}>
            <TextArea rows={4} maxLength={255} />
          </Form.Item>
        </Form>

        {(detail?.file_name || checkDatasource?.excel_file_name) && (
          <>
            <div className={styles['title']}>
              <span> </span>
              {intl.get('DataView.dataRange')}
            </div>
            <Row gutter={24} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <b>{intl.get('DataView.sheetSpa')}</b>: {detail?.excel_config?.sheet}
              </Col>
              <Col span={12}>
                <b>{intl.get('DataView.cellRange')}</b>:{detail?.excel_config?.start_cell}-{detail?.excel_config?.end_cell}
              </Col>
            </Row>
            <Row gutter={24} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <b>{intl.get('DataView.hasHeaders')}</b>:{' '}
                {detail?.excel_config?.has_headers ? intl.get('DataView.hasHeadersTrue') : intl.get('DataView.hasHeadersFalse')}
              </Col>
              <Col span={12}>
                <b>{intl.get('DataView.sheetAsNewColumn')}</b>: {detail?.excel_config?.sheet_as_new_column ? intl.get('Global.yes') : intl.get('Global.no')}
              </Col>
            </Row>
          </>
        )}
        <div className={styles['title']}>
          <span> </span>
          {intl.get('Global.fieldInfo')}
        </div>
        <FieldTable
          editingKey={editingKey}
          setEditingKey={setEditingKey}
          dataSource={fieldData}
          onChange={(val): void => setFieldData(val)}
          page={page}
          setPage={setPage}
          isEdit={!!id}
        />
      </div>
      <div className={styles.footer}>
        <Button onClick={onOk} type="primary" style={{ marginRight: 8 }} disabled={!!editingKey} loading={loading}>
          {intl.get('Global.save')}
        </Button>
        <Button onClick={(): Promise<void> => onCancel()} disabled={!!editingKey || loading}>
          {intl.get('Global.cancel')}
        </Button>
      </div>
    </Drawer>
  );
};

export default DataViewForm;
