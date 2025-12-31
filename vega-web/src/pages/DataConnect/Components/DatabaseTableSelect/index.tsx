import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Empty, Modal, Splitter } from 'antd';
import { matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import api from '@/services/dataConnect';
import DataConnectType from '@/services/dataConnect/type';
import ScanTaskType from '@/services/scanManagement/type';
import { dataBaseIconList, transformAndMapDataSources } from '@/pages/DataConnect/utils';
import { IconFont } from '@/web-library/common';
import Database from './Database';
import DataTable from './DataTable';
import DataTableFields from './DataTableFields';
import styles from './index.module.less';

const getIconCom = (type: string): JSX.Element => {
  const cur = dataBaseIconList[type];
  if (cur) {
    return <IconFont type={cur.coloredName} />;
  }
  return <IconFont type="icon-dip-color-postgre-wubaisebeijingban" />;
};

export const DatabaseTableSelect: React.FC<{
  open: boolean;
  onOk: (checkedList: ScanTaskType.TableInfo[], dataConnectId: string) => void;
  onCancel: () => void;
}> = ({ open, onCancel, onOk }) => {
  const [checkedList, setCheckedList] = useState<ScanTaskType.TableInfo[]>([]);
  const [dropdownItems, setDropdownItems] = useState<any>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [conditionParam, setConditionParam] = useState<any>({});
  const [tableId, setTableId] = useState<string>('');
  const [treeData, setTreeData] = useState<any[]>([]);
  const getTreeData = async (): Promise<void> => {
    const res = await api.getDataSourceList({});
    const cur: DataConnectType.Data[] = res.entries
      .filter((val) => val.allow_multi_table_scan && matchPermission(PERMISSION_CODES.SACN, val.operations))
      .map((val: DataConnectType.Data) => ({
        ...val.bin_data,
        ...val,
        title: val.name,
        key: val.id,
        icon: getIconCom(val.type),
        paramType: 'dataSourceId',
        isLeaf: true,
      }));

    setTreeData(transformAndMapDataSources(cur));
  };

  useEffect(() => {
    getTreeData();
  }, []);

  useEffect(() => {
    const initailItem = {
      label: (
        <div className={styles['checked-box-title']} onClick={(e) => e.stopPropagation()}>
          <div className={styles['title']}>{intl.get('CustomDataView.checkedListTitle', { count: checkedList.length })}</div>
          <a className={styles['clear']} onClick={() => removeDropList('all')}>
            {intl.get('Global.clearAll')}
          </a>
        </div>
      ),
      key: `initail`,
    };
    const dropList = checkedList.map((listItem: ScanTaskType.TableInfo) => ({
      label: (
        <div className={styles['checked-box-item']} onClick={(e) => e.stopPropagation()}>
          <div className={styles['checked-box-text']} title={listItem.name}>
            {listItem.name}
          </div>
          <CloseOutlined onClick={() => removeDropList(listItem.id)} />
        </div>
      ),
      key: `${listItem.id}`,
    }));
    const newDropList = [initailItem, ...dropList];
    setDropdownItems(newDropList);
  }, [JSON.stringify(checkedList)]);

  const removeDropList = (key: string) => {
    let newCheckItems: ScanTaskType.TableInfo[] = [];
    if (key !== 'all') {
      newCheckItems = checkedList.filter((checkItem: ScanTaskType.TableInfo) => checkItem.id !== key);
    }
    setCheckedList(newCheckItems);
  };

  const title = (
    <div className={styles['title-box']}>
      <span className={styles['title-box-text']}>{intl.get('CustomDataView.DataViewSource.addDataViewTitle')}</span>
      <span className={styles['title-box-tip']}>{intl.get('CustomDataView.DataViewSource.dataViewSourceTip')}</span>
    </div>
  );

  useEffect(() => {
    if (!open) {
      setCheckedList([]);
    }
  }, [open]);

  const handleSubmit = () => {
    onOk(checkedList, selectedKey);
  };

  const footer = useMemo(
    () => (
      <div className={styles['footer-box']}>
        {checkedList.length === 0 ? (
          <div className={styles['footer-text']}>{intl.get('CustomDataView.checkedListTitle', { count: checkedList.length })}</div>
        ) : (
          <Dropdown
            menu={{
              items: dropdownItems,
            }}
            trigger={['click']}
            getPopupContainer={(n) => n}
          >
            <div className={styles['footer-text-active']}>
              {intl.get('CustomDataView.checkedListTitle', { count: checkedList.length })} <DownOutlined />
            </div>
          </Dropdown>
        )}
        <div className={styles['footer-btn']}>
          <Button type="primary" disabled={checkedList.length === 0} onClick={() => handleSubmit()}>
            {intl.get('Global.startScan')}
          </Button>
          <Button onClick={() => onCancel()}>{intl.get('Global.cancel')}</Button>
        </div>
      </div>
    ),
    [checkedList.length, dropdownItems]
  );

  const onSelect = (val: string, info?: any): void => {
    console.log(val, info, 'onSelect');
    setSelectedKey(val);
  };

  const onCheckListChange = (checkedItem: any): void => {
    const isExist = checkedList.find((val: { id: any }) => val.id === checkedItem.id);
    if (isExist) {
      setCheckedList(checkedList.filter((val: { id: any }) => val.id !== checkedItem.id));
      return;
    } else {
      setCheckedList([...checkedList, checkedItem]);
    }
  };

  const onPreview = (id: string): void => {
    setTableId(id);
  };

  return (
    <Modal
      className={styles['data-source-modal']}
      title={intl.get('DataConnect.selectTablesToScan')}
      width={1080}
      open={open}
      onOk={() => {}}
      destroyOnHidden
      onCancel={() => {
        onCancel();
      }}
      footer={footer}
    >
      {treeData.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ marginTop: '70px' }}>
            <Empty />
          </div>
        </div>
      ) : (
        <Splitter className={styles['splitter-box']}>
          <Splitter.Panel defaultSize={210} min={150} max={280} collapsible className={styles['panel-box']}>
            <Database onSelect={onSelect} treeData={treeData} selectedKey={selectedKey} />
          </Splitter.Panel>
          <Splitter.Panel defaultSize={252} min={150} className={styles['panel-box']}>
            <DataTable selectedKey={selectedKey} checkedList={checkedList} onChange={onCheckListChange} onPreview={onPreview} />
          </Splitter.Panel>
          <Splitter.Panel className={styles['panel-box']}>
            <DataTableFields tableId={tableId} />
          </Splitter.Panel>
        </Splitter>
      )}
    </Modal>
  );
};
