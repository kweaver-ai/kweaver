import { DATABASE_ICON_MAP, DATABASE_TYPES } from '@/hooks/useConstants';

export interface TDatasource {
  dataSourceId: string;
  id: string;
  lastScanTime: number;
  name: string;
  databaseName: string;
  status: number;
  type: string;
  outlinedName: string;
  catalogName: string;
  coloredName: string;
  show: string;
  title: string;
  key: string;
  icon: any;
  paramType: 'dataSourceType' | 'dataSourceId' | 'excelFileName';
  isLeaf: boolean;
  excelFileName: string;
  children: TDatasource[];
}

export const transformParams = (val: string): string => {
  return val;
};

// 复用 hooks 中的数据库类型列表
export const defaultDataBaseType = DATABASE_TYPES;

export class StaticDataType {
  public dataTypes = defaultDataBaseType;
}

// 复用 hooks 中的数据库图标映射
export const dataBaseIconList: { [key: string]: any } = DATABASE_ICON_MAP;

export const transformAndMapDataSources = (dataSources: TDatasource[]): TDatasource[] => {
  const newDataSources: TDatasource[] = dataSources.map((item) => ({
    ...item,
    ...dataBaseIconList[item.type],
    isLeaf: item.type !== 'excel',
  }));
  // 找出dataSources中存在的type
  const existingTypes = dataSources
    .map((item) => item.type)
    .reduce((prev: TDatasource[], val) => {
      const prevTypes = prev.map((item) => item.type);
      const dataBaseIcon = dataBaseIconList[val];

      if (!prevTypes.includes(val) && dataBaseIcon) {
        prev.push({
          type: val,
          ...dataBaseIcon,
          title: dataBaseIcon.show,
          key: val,
          paramType: 'dataSourceType',
        } as TDatasource);
      }

      return prev;
    }, []);

  const dataSourcesTree: TDatasource[] = [];

  // 将dataSources中的数据插入到对应的children中
  existingTypes.forEach((item) => {
    const children = newDataSources.filter((val) => val.type === item.type);
    const cur: TDatasource = {
      ...item,
      icon: children[0]?.icon,
      children,
    };

    dataSourcesTree.push(cur);
  });

  return dataSourcesTree;
};
