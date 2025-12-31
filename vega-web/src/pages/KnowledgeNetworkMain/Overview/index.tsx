import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { TableColumnProps } from 'antd';
import dayjs from 'dayjs';
import Tags from '@/components/Tags';
import api from '@/services/object';
import CreateAndEditForm from '@/pages/KnowledgeNetwork/CreateAndEditForm';
import { KnowledgeNetworkType, ObjectType } from '@/services';
import { Button, IconFont, Table, Title } from '@/web-library/common';
import styles from './index.module.less';

type TBarItem = {
  icon: string;
  iconColor: string;
  title: string;
  count: number;
  url: string;
  btnText: string;
};

const BarItem = (props: TBarItem) => {
  const history = useHistory();
  const { icon = 'icon-dip-chakanbangdan', iconColor = '#126ee3', title, count, url, btnText } = props;
  const curCount = new Intl.NumberFormat('en-US').format(count || 0);

  const toPath = () => {
    history.push(url);
  };

  return (
    <div className={styles['bar-item']} onClick={toPath}>
      <dl>
        <dt style={{ background: iconColor }}>
          <IconFont type={icon} style={{ color: '#fff', fontSize: 32 }} />
        </dt>
        <dd>
          <p style={{ opacity: 0.65 }}>{title}</p>
          <p style={{ fontSize: 48 }}>{curCount}</p>
        </dd>
      </dl>
      {url && (
        <Button.Create style={{ padding: 0, height: 40 }} type="link" onClick={toPath}>
          {btnText}
        </Button.Create>
      )}
    </div>
  );
};

interface TProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission: boolean;
  callback: (id: string) => void;
}

const Overview = (props: TProps) => {
  const { detail, callback, isPermission } = props;
  const history = useHistory();
  const [tableData, setTableData] = useState<ObjectType.Detail[]>([]);
  const [open, setOpen] = useState(false);
  const [checkId, setCheckId] = useState('');

  const onCancel = () => {
    setOpen(false);
  };

  const onEdit = () => {
    setCheckId(detail?.id || localStorage.getItem('KnowledgeNetwork.id') || '');
    setOpen(true);
  };

  const columns: TableColumnProps<ObjectType.Detail>[] = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      ellipsis: true,
      width: 350,
      render: (value: string, record: ObjectType.Detail) => (
        <div className="g-flex" style={{ lineHeight: '22px' }} title={value}>
          <div className={styles['name-icon']} style={{ background: record.color }}>
            <IconFont type={record.icon} style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      width: 150,
      render: (value: string[]) => <Tags value={value} />,
    },
    { title: intl.get('Global.modifier'), dataIndex: 'updater', width: 150, render: (value: any, record: any) => record?.updater?.name || '--' },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      width: 200,
      render: (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm:ss') : '--'),
    },
  ];

  const getTableData = async () => {
    if (!detail?.id) return;
    try {
      const res = await api.objectGet(detail?.id as string, { offset: 0, limit: 5 });
      if (!res) return;
      const { entries } = res;
      setTableData(entries || []);
    } catch (error) {}
  };

  useEffect(() => {
    getTableData();
  }, [detail?.id]);

  return (
    <div className={styles['overview-box']}>
      <div className={styles['overview-box-header']}>
        <div className={styles['header-title']}>
          <div className={styles['header-title-left']}>
            <div className={styles['name-icon']} style={{ background: detail?.color }}>
              <IconFont type={detail?.icon || ''} style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div className={styles['name-text']}>{detail?.name}</div>
          </div>
          <div className={styles['header-title-right']}>
            {isPermission && (
              <Button icon={<IconFont type="icon-dip-bianji" />} onClick={onEdit}>
                {intl.get('Global.edit')}
              </Button>
            )}
            {/* <Button icon={<IconFont type="icon-dip-task-list" />}>{intl.get('KnowledgeNetwork.overviewBtn')}</Button> */}
          </div>
        </div>
        <div className={styles['header-comment']}>{detail?.comment || intl.get('Global.noComment')}</div>
        <div className={styles['header-footer']}>
          <IconFont type="icon-dip-User" style={{ fontSize: 16 }} />
          <span style={{ padding: '0 5px' }}>{intl.get('Global.modifier')}:</span>
          <span style={{ marginRight: 20 }}>{detail?.creator?.name || ''}</span>
          <IconFont type="icon-dip-history" style={{ fontSize: 16 }} />
          <span style={{ padding: '0 5px' }}>{intl.get('Global.updateTime')}:</span>
          <span>{dayjs(detail?.update_time).format('YYYY-MM-DD HH:mm:ss')}</span>
        </div>
      </div>

      <div className={styles['overview-box-bar']}>
        <BarItem
          icon="icon-dip-duixianglei"
          iconColor="#126ee3"
          title={intl.get('Global.objectClass')}
          count={detail?.statistics?.object_types_total || 0}
          url={isPermission ? '/ontology/object/create' : ''}
          btnText={intl.get('Global.createObjectType')}
        />
        <BarItem
          icon="icon-dip-guanxilei"
          iconColor="#08979c"
          title={intl.get('Global.edgeClass')}
          count={detail?.statistics?.relation_types_total || 0}
          url={isPermission ? '/ontology/edge/create' : ''}
          btnText={intl.get('Global.createEdgeClass')}
        />
        <BarItem
          icon="icon-dip-hangdonglei"
          iconColor="#90c06b"
          title={intl.get('Global.actionClass')}
          count={detail?.statistics?.action_types_total || 0}
          url={isPermission ? '/ontology/action/create' : ''}
          btnText={intl.get('Global.createActionType')}
        />
      </div>
      <div className={styles['overview-box-content']}>
        <Title>{intl.get('KnowledgeNetwork.recentlyModifiedObjectType')}</Title>
        <Table size="small" dataSource={tableData} columns={columns} pagination={false} />
      </div>
      <CreateAndEditForm open={open} onCancel={onCancel} id={checkId} callBack={() => callback(localStorage.getItem('KnowledgeNetwork.id') || '')} />
    </div>
  );
};

export default Overview;
