import intl from 'react-intl-universal';
import { Form, Radio } from 'antd';
import edge_type_data_view from '@/assets/images/edge/edge_type_data_view.svg';
import edge_type_direct from '@/assets/images/edge/edge_type_direct.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import MappingRules from './MappingRules';
import MappingRulesDataView from './MappingRulesDataView';

const DIRECT_INIT_VALUE = {
  source_object_type_id: undefined,
  target_object_type_id: undefined,
  mapping_rules: [{ source_property: { name: undefined }, target_property: { name: undefined } }],
};
const DATA_VIEW_INIT_VALUE = {
  source_object_type_id: undefined,
  target_object_type_id: undefined,
  backing_data_source: { type: ENUMS.EDGE.TYPE_DATA_VIEW, id: '' },
  source_mapping_rules: [{ source_property: { name: undefined }, target_property: { name: undefined } }],
  target_mapping_rules: [{ source_property: { name: undefined }, target_property: { name: undefined } }],
};

const Mapping = (props: any) => {
  const { form, values } = props;
  const { EDGE_CONNECTION_TYPE_OPTIONS } = HOOKS.useConstants();

  const type = Form.useWatch('type', form); // 数据来源
  const previewImage: any = { [ENUMS.EDGE.TYPE_DIRECT]: edge_type_direct, [ENUMS.EDGE.TYPE_DATA_VIEW]: edge_type_data_view };
  const mappingRulesInitValue: any = {
    [ENUMS.EDGE.TYPE_DIRECT]: values.type === ENUMS.EDGE.TYPE_DIRECT ? values.mapping_rules : DIRECT_INIT_VALUE,
    [ENUMS.EDGE.TYPE_DATA_VIEW]: values.type === ENUMS.EDGE.TYPE_DATA_VIEW ? values.mapping_rules : DATA_VIEW_INIT_VALUE,
  };

  return (
    <div style={{ width: 1000 }}>
      <Form
        form={form}
        labelAlign="left"
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        initialValues={{ type: ENUMS.EDGE.TYPE_DIRECT, mapping_rules: DIRECT_INIT_VALUE, ...values }}
      >
        <Form.Item label={intl.get('Edge.relationAssociation')} name="type">
          <Radio.Group
            options={EDGE_CONNECTION_TYPE_OPTIONS}
            onChange={(event) => {
              const value = event.target.value;
              form.setFieldValue('mapping_rules', mappingRulesInitValue[value]);
            }}
          />
        </Form.Item>
        <div className="g-border g-border-radius g-flex-center g-bg-line" style={{ height: 160 }}>
          <img src={previewImage[type]} />
        </div>
        <Form.Item name="mapping_rules" className="g-mt-6" wrapperCol={{ span: 24 }}>
          {type === ENUMS.EDGE.TYPE_DIRECT && <MappingRules />}
          {type === ENUMS.EDGE.TYPE_DATA_VIEW && <MappingRulesDataView />}
        </Form.Item>
      </Form>
    </div>
  );
};

export default Mapping;
