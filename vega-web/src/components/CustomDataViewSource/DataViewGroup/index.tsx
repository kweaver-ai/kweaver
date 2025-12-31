import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import connectApi from '@/services/dataConnect/index';
import scanApi from '@/services/scanManagement/index';
import { IconFont } from '@/web-library/common';
import { dataBaseIconList, TDatasource, transformAndMapDataSources } from '../utils';
import styles from './index.module.less';

const getIconCom = (type: string): JSX.Element => {
  const cur = dataBaseIconList[type];
  if (cur) {
    return <IconFont type={cur.coloredName} />;
  }
  return <IconFont type="icon-dip-color-postgre-wubaisebeijingban" />;
};

const DataViewGroup: React.FC<{ onSelect: (selectedKeys: any, info?: any) => void; selectedKeys: any[]; queryType: string }> = ({
  onSelect,
  selectedKeys,
  queryType,
}) => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const getTreeData = async (): Promise<void> => {
    const res = await connectApi.getDataSourceList({
      // type: queryType
    });
    const cur: TDatasource[] = res.entries
      .filter((val) => val.metadata_obtain_level != 4)
      .map((val: { bin_data: any; name: any; id: any; type: string }) => ({
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

  const onLoadData = async (treeNode: any): Promise<void> => {
    if (treeNode.props.children?.length > 0) {
      return;
    }

    const excelDataSourceTree = treeData.find((val) => val.key === 'excel');

    if (excelDataSourceTree) {
      const res = await scanApi.getExcelFiles(treeNode.props.catalog_name);
      const children: TDatasource[] =
        (res.data.map((item) => ({
          title: item,
          key: `${item}☎☎${treeNode.props.id}`,
          paramType: 'excelFileName',
          isLeaf: true,
          excelFileName: item,
          dataSourceId: treeNode.props.id,
          catalogName: treeNode.props.catalog_name,
          icon: treeNode.props.icon,
          ...dataBaseIconList.excel,
        })) as TDatasource[]) || [];
      const newExcelDataSourceTree = excelDataSourceTree?.children.map((val: any) => {
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

    setTreeData([...treeData]);
  };

  useEffect(() => {
    onSelect([]);
    getTreeData();
  }, [queryType]);

  return (
    <div className={styles['data-group-box']}>
      <div className={`${styles['all-item']} ${!(selectedKeys.length > 0) && styles['all-item-active']}`} onClick={() => onSelect([])}>
        {intl.get('Global.all')}
      </div>
      <Tree
        blockNode
        defaultExpandAll
        treeData={treeData}
        loadData={onLoadData}
        selectedKeys={selectedKeys}
        onSelect={(selectedKeys, info) => onSelect(selectedKeys, info)}
        showIcon
        switcherIcon={<DownOutlined style={{ fontSize: '12px' }} />}
      />
    </div>
  );
};

export default DataViewGroup;
