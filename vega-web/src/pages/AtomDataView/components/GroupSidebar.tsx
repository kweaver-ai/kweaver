import { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Empty, Tooltip, Tree } from 'antd';
import { DATABASE_ICON_MAP } from '@/hooks/useConstants';
import DataConnectType from '@/services/dataConnect/type';
import ScanManagementApi from '@/services/scanManagement';
import { Input } from '@/web-library/common';
import styles from '../index.module.less';

interface GroupSidebarPropsType {
  allDataSource: DataConnectType.Data[];
  dataSourceTree: DataConnectType.Data[];
  setTableParams: (arg0: any) => void;
  setDataSourceTree: (val: DataConnectType.Data[]) => void;
  setCheckDatasource: (val?: DataConnectType.Data) => void;
}

const GroupSidebar = (props: GroupSidebarPropsType): JSX.Element => {
  const { allDataSource, dataSourceTree, setTableParams, setDataSourceTree, setCheckDatasource } = props;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const onSelect = (selectedKeys: any[], info?: any): void => {
    console.log(selectedKeys, info, 'selectedKeys');
    setSelectedKeys(selectedKeys);
    if (selectedKeys.length === 0) {
      setCheckDatasource(undefined);
      setTableParams({});

      return;
    }
    const { paramType } = info.node;

    setCheckDatasource(info.node);
    if (paramType === 'data_source_id' || paramType === 'data_source_type') {
      setTableParams({ [paramType]: selectedKeys[0] });
    }
    if (paramType === 'excel_file_name') {
      setTableParams({ [paramType]: selectedKeys[0].split('☎☎')[0], data_source_id: info.node.props.data_source_id });
    }
  };

  // 页面展示的分组（因为前端处理分组搜索逻辑）
  const [searchVal, setSearchVal] = useState<string>('');

  const handleSearchGroup = (val: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchVal(val.target.value);
  };

  const curDatasource = useMemo(() => {
    if (searchVal) {
      return allDataSource.filter((val) => val.title.includes(searchVal));
    }

    return dataSourceTree;
  }, [allDataSource, dataSourceTree, searchVal]);

  const onLoadData = async (treeNode: any): Promise<void> => {
    if (treeNode.props.children?.length > 0) {
      return;
    }

    const excelDataSourceTree = dataSourceTree.find((val) => val.key === 'excel');
    if (excelDataSourceTree) {
      const res = await ScanManagementApi.getExcelFiles(treeNode.props.catalog_name);
      const children: DataConnectType.Data[] =
        (res.data.map((item) => ({
          title: item,
          key: `${item}☎☎${treeNode.props.id}`,
          paramType: 'excel_file_name',
          isLeaf: true,
          excel_file_name: item,
          data_source_id: treeNode.props.id,
          catalog_name: treeNode.props.catalog_name,
          icon: treeNode.props.icon,
          ...DATABASE_ICON_MAP.excel,
        })) as unknown as DataConnectType.Data[]) || [];
      const newExcelDataSourceTree = excelDataSourceTree?.children?.map((val) => {
        if (val.id === treeNode.props.id) {
          return {
            ...val,
            children,
          };
        }

        return val;
      });

      excelDataSourceTree.children = newExcelDataSourceTree as any;
    }

    setDataSourceTree([...dataSourceTree]);
  };

  return (
    <div className={styles['group-list']}>
      <div className={styles['group-list-title']}>
        <b>
          {intl.get('DataView.scannedDataSources')}
          <Tooltip placement="right" title={intl.get('DataView.dataViewScanManagerTip')}>
            <ExclamationCircleOutlined style={{ color: 'rgba(0,0,0,0.65)', marginLeft: 5, verticalAlign: '20%' }} />
          </Tooltip>
        </b>
        {/* <Tooltip placement="right" title={'选择数据源扫描'}>
          <Icon type="scan" style={{ cursor: 'pointer' }} onClick={selDatasource} />
        </Tooltip> */}
      </div>
      <Input.Search allowClear placeholder={intl.get('DataView.pleaseInputDatasource')} onChange={handleSearchGroup} />
      <div className={styles.divider}></div>
      {/* “所有数据视图”分组 */}
      <div
        className={`${styles['group-item']} ${!(selectedKeys.length > 0) && styles['group-item-active']}`}
        onClick={(): void => {
          onSelect([]);
        }}
      >
        {intl.get('Global.all')}
      </div>
      <div className={styles['divider-line']}></div>
      {curDatasource.length > 0 ? (
        <Tree blockNode showIcon selectedKeys={selectedKeys} onSelect={onSelect} treeData={curDatasource} loadData={onLoadData} />
      ) : (
        <Empty className={styles['box-empty']} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default GroupSidebar;
