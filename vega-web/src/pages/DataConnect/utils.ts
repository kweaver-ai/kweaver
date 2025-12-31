import intl from 'react-intl-universal';
import { DATABASE_ICON_MAP } from '@/hooks/useConstants';
import dataConnectType from '@/services/dataConnect/type';

// 为了保持向后兼容，导出别名
export const dataBaseIconList: { [key: string]: any } = DATABASE_ICON_MAP;

// 需要 Schema 配置的数据库类型列表
export const SCHEMA_REQUIRED_TYPES = ['oracle', 'postgresql', 'sqlserver', 'hologres', 'gaussdb', 'opengauss', 'kingbase'] as const;

// 需要 User ID 配置的数据源类型列表
export const USER_ID_REQUIRED_TYPES = ['excel', 'anyshare7', 'tingyun'] as const;

// 扫描状态颜色映射
const SCAN_STATUS_COLOR_MAP: Record<string, 'default' | 'processing' | 'success' | 'error'> = {
  unscanned: 'default',
  init: 'default',
  running: 'processing',
  wait: 'default',
  success: 'success',
  fail: 'error',
} as const;

export const getConnector = (type: string, connectors: dataConnectType.Connector[]): dataConnectType.Connector | undefined => {
  return connectors.find((val) => val.olk_connector_name === type);
};

export const getConnectorTypes = (connectors: dataConnectType.Connector[]): string[] => {
  const types = connectors
    .map((val) => val.type)
    .reduce((prev: string[], val) => {
      if (!prev.includes(val)) {
        prev.push(val);
      }

      return prev;
    }, []);

  return types;
};

export const getConnectorIcon = (val: dataConnectType.Connector): string => {
  const cur = dataBaseIconList[val.olk_connector_name] || dataBaseIconList[val.type];

  return cur?.coloredName;
};

// 编码 Unicode 字符串为 Base64
export const encodeUnicode = (str: string | number | boolean): string => {
  const fromCharCode = (_: any, p1: any): string => String.fromCharCode(`0x${p1}` as any);

  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, fromCharCode));
};

export const transformAndMapDataSources = (dataSources: dataConnectType.Data[]): dataConnectType.Data[] => {
  const newDataSources: dataConnectType.Data[] = dataSources.map((item) => ({
    ...item,
    ...dataBaseIconList[item.type],
    // isLeaf: item.type !== 'excel'
  }));
  // 找出dataSources中存在的type
  const existingTypes = dataSources
    .map((item) => item.type)
    .reduce((prev: dataConnectType.Data[], val) => {
      const prevTypes = prev.map((item) => item.type);
      const dataBaseIcon = dataBaseIconList[val];

      if (!prevTypes.includes(val) && dataBaseIcon) {
        prev.push({
          type: val,
          ...dataBaseIcon,
          title: dataBaseIcon.show,
          key: val,
          paramType: 'data_source_type',
        } as dataConnectType.Data);
      }

      return prev;
    }, []);

  const dataSourcesTree: dataConnectType.Data[] = [];

  // 将dataSources中的数据插入到对应的children中
  existingTypes.forEach((item) => {
    const children = newDataSources.filter((val) => val.type === item.type);
    const cur: dataConnectType.Data = {
      ...item,
      icon: children[0]?.icon,
      children,
    };

    dataSourcesTree.push(cur);
  });
  return dataSourcesTree;
};

export const getScanStatusColor = (val: string): { label: string; color: 'default' | 'processing' | 'success' | 'error' } => {
  const labelMap: Record<string, string> = {
    unscanned: intl.get('DataConnect.unscanned'),
    init: intl.get('DataConnect.initializing'),
    running: intl.get('DataConnect.running'),
    wait: intl.get('DataConnect.wait'),
    success: intl.get('DataConnect.success'),
    fail: intl.get('DataConnect.fail'),
  };
  const label = labelMap[val] || intl.get('DataConnect.unscanned');
  const color = SCAN_STATUS_COLOR_MAP[val] || 'default';

  return {
    label,
    color,
  };
};
