import { useEffect, useState, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Button, Empty, Tree, Checkbox, Modal } from 'antd';
import classnames from 'classnames';
import DataConnectType from '@/services/dataConnect/type';
import scanManagementApi from '@/services/scanManagement';
import HOOKS from '@/hooks';
import { IconFont, Input } from '@/web-library/common';
import styles from './styles.module.less';

interface TScanModal {
  open: boolean;
  onClose: (isOk?: boolean) => void;
  allDataSource?: DataConnectType.Data[];
  dataSourceTree?: DataConnectType.Data[];
  isEmpty?: boolean;
}

const ScanModal = ({ open, onClose, allDataSource = [], dataSourceTree = [], isEmpty = false }: TScanModal): JSX.Element => {
  const { message } = HOOKS.useGlobalContext();
  const [data, setData] = useState<DataConnectType.Data[]>([]);
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(false);
  const [searchVal, setSearchVal] = useState<string>('');

  // 扫描数据源
  const scanModalOk = async (): Promise<void> => {
    const scanTasks = data.map((item) => ({
      scan_name: item.name,
      ds_info: { ds_id: item.id, ds_type: item.type },
      type: 0,
    }));
    await scanManagementApi.batchCreateScanTask(scanTasks);
    message.success(intl.get('Global.scanTaskSuccess'));
    onClose(true);
  };

  useEffect(() => {
    if (open) {
      setCheckedList([]);
      setIndeterminate(false);
      setCheckAll(false);
      setSearchVal('');
      setData([]);
    }
  }, [open]);

  const titleText = useMemo(() => {
    const cur = intl.get('DataConnect.selectDataSourceToScan');
    return cur;
  }, [data]);

  const curDatasource = useMemo(() => {
    if (searchVal) {
      return allDataSource.filter((val) => val.title.includes(searchVal));
    }

    return dataSourceTree;
  }, [allDataSource, dataSourceTree, searchVal]);

  const allDataSourceIds = useMemo(() => allDataSource.map((val) => val.id), [allDataSource]);

  const onCheckAllChange = (e: { target: { checked: boolean | ((prevState: boolean) => boolean) } }): void => {
    setCheckedList(e.target.checked ? allDataSourceIds : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    setData(e.target.checked ? allDataSource : []);
  };

  const onCheck = (checkedKeys: any): void => {
    const newCheckedKeys = allDataSourceIds.filter((val) => checkedKeys.includes(val));
    const newData = allDataSource.filter((val) => newCheckedKeys.includes(val.id));

    setCheckedList(newCheckedKeys);
    setData(newData);
    setIndeterminate(!!newCheckedKeys.length && newCheckedKeys.length !== allDataSourceIds.length);
    setCheckAll(newCheckedKeys.length === allDataSourceIds.length);
  };

  const onOk = (): void => {
    scanModalOk();
  };

  return (
    <Modal
      title={titleText}
      width={800}
      open={open}
      onOk={onOk}
      onCancel={() => onClose()}
      className={styles.modalWrapper}
      maskClosable={false}
      getContainer={(): any => document.getElementById('vega-root')}
      footer={
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}></div>
          <div className={styles.footerRight}>
            <Button disabled={data?.length === 0} type="primary" onClick={(): void => onOk()} className={styles.okButton}>
              {intl.get('Global.startScan')}
            </Button>
            <Button onClick={(): void => onClose()}>{intl.get('Global.cancel')}</Button>
          </div>
        </div>
      }
    >
      <div className={styles.ModalBox}>
        {isEmpty ? (
          <div className={styles.modalContent}>
            <div className={styles.emptyContainer}>
              <Empty />
            </div>
          </div>
        ) : (
          <div className={classnames(styles.modalContent, styles.init)}>
            <div className={styles.modalInitContent}>
              <div className={styles.modalLeft}>
                <Input.Search
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVal(e.target.value)}
                  className={styles.searchInput}
                  allowClear
                  placeholder={intl.get('DataConnect.searchDataSourceName')}
                />
                <Checkbox checked={checkAll} indeterminate={indeterminate} onChange={onCheckAllChange}>
                  {intl.get('Global.all')}
                </Checkbox>
                <div className={styles.treeContainer}>
                  <Tree blockNode checkable showIcon onCheck={onCheck} checkedKeys={checkedList} treeData={curDatasource as any[]} />
                </div>
              </div>
            </div>
            <div className={classnames(styles.modalright)}>
              <div className={styles.initTitle}>
                <div>{`${intl.get('Global.selected')}${data?.length || 0} ${intl.get('Global.count')}`}</div>
                <Button
                  type="link"
                  className={styles.initClear}
                  onClick={(): void => {
                    onCheck([]);
                  }}
                  disabled={data.length === 0}
                >
                  {intl.get('Global.removeAll')}
                </Button>
              </div>
              <div className={styles.rightItemBox}>
                {data?.length
                  ? data?.map((item, index) => {
                      return (
                        <div className={styles.item} key={index}>
                          {item.icon}
                          <span title={item.name} className={styles.itemName}>
                            {item.name}
                          </span>
                          <IconFont
                            type="icon-delete1"
                            onClick={(): void => {
                              onCheck(checkedList.filter((val) => val !== item.id));
                            }}
                            className={styles['icon-close']}
                          />
                        </div>
                      );
                    })
                  : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ScanModal;
