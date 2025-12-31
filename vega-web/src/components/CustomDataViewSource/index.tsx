import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, Splitter } from 'antd';
import DataViewGroup from './DataViewGroup';
import DataViewList from './DataViewList';
import DateViewPreview from './DateViewPreview';
import styles from './index.module.less';

export enum DataViewQueryType {
  SQL = 'SQL',
  DSL = 'DSL',
  IndexBase = 'IndexBase',
}

export const DataViewSource: React.FC<{
  open: boolean;
  onOk: (checkedList: any) => void;
  onCancel: () => void;
  queryType: DataViewQueryType;
}> = ({ open, onCancel, onOk, queryType }) => {
  const [checkedList, setCheckedList] = useState<any>([]);
  const [dropdownItems, setDropdownItems] = useState<any>([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [conditionParam, setConditionParam] = useState<any>({});
  const [previewId, setPreviewId] = useState<string>('');

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
    const dropList = checkedList.map((listItem: any) => ({
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
    let newCheckItems = [];
    if (key !== 'all') {
      newCheckItems = checkedList.filter((checkItem: { id: string }) => checkItem.id !== key);
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
    onOk(checkedList);
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
            {intl.get('Global.ok')}
          </Button>
          <Button onClick={() => onCancel()}>{intl.get('Global.cancel')}</Button>
        </div>
      </div>
    ),
    [checkedList.length, dropdownItems]
  );

  const onSelect = (selectedKeys: any, info?: any): void => {
    setPreviewId('');
    setSelectedKeys(selectedKeys);
    if (selectedKeys.length === 0 || info?.node?.key === 'all') {
      setConditionParam({});
      return;
    }
    const { paramType } = info.node.props;

    if (paramType === 'dataSourceId' || paramType === 'dataSourceType') {
      setConditionParam({ [paramType]: selectedKeys[0] });
    }
    if (paramType === 'excelFileName') {
      setConditionParam({ [paramType]: selectedKeys[0].split('☎☎')[0], dataSourceId: info.node.props.dataSourceId });
    }
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
    setPreviewId(id);
  };

  return (
    <Modal
      className={styles['data-source-modal']}
      title={title}
      width={1080}
      open={open}
      onOk={() => {}}
      onCancel={() => {
        onCancel();
      }}
      footer={footer}
    >
      <Splitter className={styles['splitter-box']}>
        <Splitter.Panel defaultSize={210} min={150} max={280} collapsible className={styles['panel-box']}>
          <DataViewGroup onSelect={onSelect} selectedKeys={selectedKeys} queryType={queryType} />
        </Splitter.Panel>
        <Splitter.Panel defaultSize={252} min={150} className={styles['panel-box']}>
          <DataViewList condition={conditionParam} checkedList={checkedList} onChange={onCheckListChange} onPreview={onPreview} queryType={queryType} />
        </Splitter.Panel>
        <Splitter.Panel className={styles['panel-box']}>
          <DateViewPreview id={previewId} />
        </Splitter.Panel>
      </Splitter>
    </Modal>
  );
};
