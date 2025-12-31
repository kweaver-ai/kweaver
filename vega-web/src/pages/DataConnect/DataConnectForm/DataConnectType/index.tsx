import React from 'react';
import intl from 'react-intl-universal';
import { Input } from 'antd';
import dataConnectType from '@/services/dataConnect/type';
import { IconFont } from '@/web-library/common';
import { getConnectorIcon, getConnectorTypes } from '../../utils';
import styles from '../index.module.less';

const DataSourceType = ({
  checkDataSource,
  setCheckDataSource,
  connectors,
}: {
  checkDataSource?: dataConnectType.Connector;
  setCheckDataSource: (connector: dataConnectType.Connector) => void;
  connectors: dataConnectType.Connector[];
}): JSX.Element => {
  const [activeTab, setActiveTab] = React.useState<string>('');
  const [searchVal, setSearchVal] = React.useState<string>('');

  const handleTabClick = (tab: React.SetStateAction<string>): void => {
    setActiveTab(tab);
  };

  const types = getConnectorTypes(connectors);

  return (
    <div className={styles['data-source-type']}>
      <div className={styles.title}>{intl.get('DataConnect.dataSourceTypes')}</div>
      <div className={styles['box-tabs']}>
        <div className={styles.tabs}>
          <span className={`${!activeTab ? styles.active : ''}`} onClick={(): void => handleTabClick('')}>
            {intl.get('Global.all')}
          </span>
          {types.map(
            (tab): JSX.Element => (
              <span key={tab} className={`${activeTab === tab ? styles.active : ''}`} onClick={(): void => handleTabClick(tab)}>
                {intl.get(`DataConnect.${tab}`)}
              </span>
            )
          )}
        </div>
        <div className={styles['search-bar']}>
          <Input.Search placeholder={intl.get('DataConnect.searchTypeName')} onSearch={(val): void => setSearchVal(val)} />
        </div>
      </div>
      <div className={styles['box-context']}>
        {connectors
          .filter((val) => (val.type === activeTab || !activeTab) && val.show_connector_name.toLowerCase().includes(searchVal.toLowerCase()))
          .map(
            (tab): JSX.Element => (
              <div
                className={`${styles['context-item']} ${checkDataSource?.olk_connector_name === tab.olk_connector_name ? styles['context-item-active'] : ''}`}
                key={tab.olk_connector_name}
                onClick={(): void => setCheckDataSource(tab)}
              >
                <IconFont type={getConnectorIcon(tab)} />
                <span>{tab.show_connector_name}</span>
              </div>
            )
          )}
      </div>
    </div>
  );
};

export default DataSourceType;
