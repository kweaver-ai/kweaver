import { useMemo, useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Tag, Table, Divider, Dropdown } from 'antd';
import _ from 'lodash';
import ObjectIcon from '@/components/ObjectIcon';
import ENUMS from '@/enums';
import SERVICE from '@/services';
import { Text, Title, Button, IconFont, Drawer } from '@/web-library/common';
import styles from './index.module.less';

const ObjectItem = (props: any) => {
  const { value, icon, color } = props;
  return (
    <div className="g-flex-align-center" title={value}>
      {icon && <ObjectIcon icon={icon} color={color} />}
      <div>
        <Text className="g-ellipsis-1">{value}</Text>
      </div>
    </div>
  );
};

const uniqueIdPrefix = 'edgeDetail';
const Detail = (props: any) => {
  const { open, knId, sourceData, isPermission } = props;
  const { onClose, onDeleteConfirm, goToCreateAndEditPage } = props;

  const [source, setSource] = useState(sourceData);
  const { id, tags, name, comment } = source;

  useEffect(() => {
    if (!id) return;
    getDetail();
  }, [id]);

  const getDetail = async () => {
    const result = await SERVICE.edge.edgeGetDetail(knId, id);
    if (result[0]) setSource(result[0]);
  };

  /** 下来菜单变更 */
  const onChange = (data: any) => {
    if (data.key === 'delete') {
      onDeleteConfirm([source], false, () => onClose());
    }
  };

  /** 基础数据 */
  const baseInfo = [
    { label: intl.get('Global.id'), value: id },
    { label: intl.get('Global.tag'), value: Array.isArray(tags) && tags.length ? _.map(tags, (i) => <Tag key={i}>{i}</Tag>) : '--' },
    { label: intl.get('Global.comment'), value: comment || '--' },
  ];

  /** 构建直接连接表格的列配置和数据 */
  const getDirectData = () => {
    const { mapping_rules, source_object_type, source_object_type_id, target_object_type, target_object_type_id } = source;
    /** 直接连接的表格列配置 */
    const columns: any = [
      { dataIndex: 'name', width: 100, render: (value: string) => <Title>{value}</Title> },
      {
        title: intl.get('Edge.detailSourcePoint'),
        dataIndex: 'source',
        width: 415,
        render: (value: string, data: any) => {
          if (data?.type === 'property') return value || intl.get('Global.emptyValue');
          if (data?.type === 'object') {
            const { icon, color } = data?.source_object_type || {};
            return <ObjectItem value={value} icon={icon} color={color} />;
          }
        },
      },
      {
        title: intl.get('Edge.detailTargetPoint'),
        dataIndex: 'target',
        width: 415,
        render: (value: string, data: any) => {
          if (data?.type === 'property') return value || intl.get('Global.emptyValue');
          if (data?.type === 'object') {
            const { icon, color } = data?.target_object_type || {};
            return <ObjectItem value={value} icon={icon} color={color} />;
          }
        },
      },
    ];
    /** 直接连接的表格数据 */
    const dataSource = [
      {
        id: _.uniqueId(uniqueIdPrefix),
        name: intl.get('Global.objectClass'),
        type: 'object',
        source_object_type,
        target_object_type,
        source: source_object_type?.display_name || source_object_type?.name || source_object_type_id,
        target: target_object_type?.display_name || target_object_type?.name || target_object_type_id,
      },
      ..._.map(mapping_rules, (item, index) => {
        const { source_property, target_property } = item;
        return {
          id: index,
          type: 'property',
          name: intl.get('Global.dataProperty'),
          source: source_property?.display_name || source_property?.name,
          target: target_property?.display_name || target_property?.name,
        };
      }),
    ];
    return { columns, dataSource };
  };

  /** 构建数据视图连接表格的列配置和数据 */
  const getDataViewData = () => {
    const { mapping_rules, source_object_type, source_object_type_id, target_object_type, target_object_type_id } = source;
    const { backing_data_source, source_mapping_rules, target_mapping_rules } = mapping_rules || {};
    /** 数据视图的表格列配置 */
    const columns: any = [
      {
        title: intl.get('Edge.detailSourceObject'),
        dataIndex: 'source',
        width: 415,
        render: (value: string, data: any) => {
          if (data?.type === 'property') return value || intl.get('Global.emptyValue');
          if (data?.type === 'object') {
            const { icon, color } = data?.source_object_type || {};
            return <ObjectItem value={value} icon={icon} color={color} />;
          }
        },
      },
      {
        title: intl.get('Global.dataView'),
        dataIndex: 'dataView',
        width: 415,
        render: (value: string, data: any) => {
          if (data?.type === 'object') return value || intl.get('Global.emptyValue');
          if (data?.type === 'property')
            return (
              <div className="g-flex-align-center">
                <div className="g-w-100 g-flex-align-center" title={data?.dataView?.source}>
                  <div className={styles['view-data-option-label']}>{intl.get('Edge.detailDataViewSource')}</div>
                  <Text className="g-ellipsis-1">{data?.dataView?.source}</Text>
                </div>
                <div className="g-w-100 g-flex-align-center" title={data?.dataView?.target}>
                  <div className={styles['view-data-option-label']} style={{ background: '#000' }}>
                    {intl.get('Edge.detailDataViewTarget')}
                  </div>
                  <Text className="g-ellipsis-1">{data?.dataView?.target}</Text>
                </div>
              </div>
            );
        },
      },
      {
        title: intl.get('Edge.detailTargetObject'),
        dataIndex: 'target',
        width: 415,
        render: (value: string, data: any) => {
          if (data?.type === 'property') return value || intl.get('Global.emptyValue');
          if (data?.type === 'object') {
            const { icon, color } = data?.target_object_type || {};
            return <ObjectItem value={value} icon={icon} color={color} />;
          }
        },
      },
    ];
    /** 数据视图的表格数据 */
    const dataSource = [
      {
        id: _.uniqueId(uniqueIdPrefix),
        type: 'object',
        source_object_type,
        target_object_type,
        source: source_object_type?.display_name || source_object_type?.name || source_object_type_id,
        target: target_object_type?.display_name || target_object_type?.name || target_object_type_id,
        dataView: backing_data_source?.display_name || backing_data_source?.name || backing_data_source?.id,
      },
      ..._.map(source_mapping_rules, (item, index) => {
        const targetMapping = target_mapping_rules?.[index];
        return {
          id: index,
          type: 'property',
          source: item?.source_property?.display_name || item?.source_property?.name,
          target: targetMapping?.target_property?.display_name || targetMapping?.target_property?.name,
          dataView: {
            source: item?.target_property?.display_name || item?.target_property?.name,
            target: targetMapping?.source_property?.display_name || targetMapping?.source_property?.name,
          },
        };
      }),
    ];
    return { columns, dataSource };
  };

  const { columns, dataSource }: any = useMemo(() => {
    if (source?.type === ENUMS.EDGE.TYPE_DIRECT) return getDirectData();
    if (source?.type === ENUMS.EDGE.TYPE_DATA_VIEW) return getDataViewData();
    return { columns: [], dataSource: [] };
  }, [source]);

  // console.log('source', source);

  return (
    <Drawer open={open} className={styles['edge-root-drawer']} width={1000} title={intl.get('Edge.detailTitle')} onClose={onClose} maskClosable={true}>
      <div className={styles['edge-root-drawer-content']}>
        <div className="g-flex-space-between">
          <Title>{name}</Title>
          <div className="g-flex-align-center">
            {isPermission && (
              <Button className="g-mr-2" icon={<IconFont type="icon-dip-bianji" />} onClick={() => goToCreateAndEditPage('edit', source)}>
                {intl.get('Global.edit')}
              </Button>
            )}
            {isPermission && (
              <Dropdown trigger={['click']} menu={{ items: [{ key: 'delete', label: intl.get('Global.delete') }], onClick: onChange }}>
                <Button icon={<IconFont type="icon-dip-gengduo" />} />
              </Dropdown>
            )}
          </div>
        </div>
        <Divider className="g-mt-4 g-mb-4" />
        <div>
          {_.map(baseInfo, (item) => {
            const { label, value } = item;
            return (
              <div key={label} className={styles['edge-root-drawer-base-info']}>
                <div className={styles['edge-root-drawer-base-info-label']}>{label}</div>
                <div className="g-ellipsis-1">{value}</div>
              </div>
            );
          })}
        </div>
        <Divider className="g-mt-4 g-mb-4" />
        <div>
          <Title className="g-mt-1 g-mb-3">{intl.get('Global.config')}</Title>
          <Table bordered size="small" rowKey="id" pagination={false} columns={columns} dataSource={dataSource} />
        </div>
      </div>
    </Drawer>
  );
};

export default (props: any) => {
  if (!props.open) return null;
  return <Detail {...props} />;
};
