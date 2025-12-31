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

export const dataBaseIconList: { [key: string]: any } = {
  mysql: {
    outlinedName: 'icon-MySQL',
    coloredName: 'icon-dip-color-mysql-wubaisebeijingban',
    show: 'MySQL',
  },
  maria: {
    outlinedName: 'icon-MariaDB',
    coloredName: 'icon-dip-color-Mariadb-wubaisebeijingban',
    show: 'MariaDB',
  },
  postgresql: {
    outlinedName: 'icon-PostgreSQL',
    coloredName: 'icon-dip-color-postgre-wubaisebeijingban',
    show: 'PostgreSQL',
  },
  sqlserver: {
    outlinedName: 'icon-a-SQLServer',
    coloredName: 'icon-dip-color-a-sqlserver-wubaisebeijingban',
    show: 'SQL Server',
  },
  oracle: {
    outlinedName: 'icon-Oracle2',
    coloredName: 'icon-dip-color-oracle-wubaisebeijingban',
    show: 'Oracle',
  },
  'hive-hadoop2': {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive(hadoop2)',
  },
  'hive-jdbc': {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive',
  },
  hive: {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive',
  },
  clickhouse: {
    outlinedName: 'icon-a-ClickHouse',
    coloredName: 'icon-dip-color-ClickHouse-wubaisebeijingban',
    show: 'ClickHouse',
  },
  doris: {
    outlinedName: 'icon-a-DORISHeise',
    coloredName: 'icon-dip-color-DORIS-wubaisebeijingban',
    show: 'Apache Doris',
  },
  hologres: {
    outlinedName: 'icon-holgres-heise',
    coloredName: 'icon-dip-color-hologres-caise',
    show: 'Holgres',
  },
  'inceptor-jdbc': {
    outlinedName: 'icon-inceptor-heise',
    coloredName: 'icon-dip-color-inceptor-caise',
    show: 'TDH inceptor',
  },
  opengauss: {
    outlinedName: 'icon-opengauss-heise',
    coloredName: 'icon-dip-color-opengauss-caise',
    show: 'OpenGauss',
  },
  gaussdb: {
    outlinedName: 'icon-gaussdb-heise',
    coloredName: 'icon-dip-color-gaussdb-caise',
    show: 'GaussDB',
  },
  dameng: {
    outlinedName: 'icon-dameng-heise',
    coloredName: 'icon-dip-color-dameng',
    show: 'DM',
  },
  excel: {
    outlinedName: 'icon-xls',
    coloredName: 'icon-dip-color-excel1',
    show: 'Excel',
  },
  mongodb: {
    outlinedName: 'icon-mongodb',
    coloredName: 'icon-dip-color-mongodb-caise',
    show: 'MongoDB',
  },
  tingyun: {
    outlinedName: 'icon-dip-color-tingyun',
    coloredName: 'icon-dip-color-tingyun',
    show: '听云',
  },
  anyshare7: {
    outlinedName: 'icon-dip-color-AS',
    coloredName: 'icon-dip-color-AS',
    show: 'AnyShare 7.0',
  },
  maxcompute: {
    outlinedName: 'icon-dip-color-MaxCompute',
    coloredName: 'icon-dip-color-MaxCompute',
    show: 'MaxCompute',
  },
  index_base: {
    outlinedName: 'icon-dip-suoyin',
    coloredName: 'icon-dip-suoyin',
    show: 'Index Base',
  },
  opensearch: {
    outlinedName: 'icon-dip-color-Opensearch',
    coloredName: 'icon-dip-color-Opensearch',
    show: 'OpenSearch',
  },
};

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
