import styles from './index.module.less';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import ScrollBarContainer from '@/components/ScrollBarContainer';
import { useDipChatStore } from '@/components/DipChat/store';
import KNSpaceTree from './KNSpaceTree';
import MetricTree from './MetricTree';
import { getKnowledgeSourceList } from '@/apis/knowledge-data';
import _ from 'lodash';
import DocTree from './DocTree';
import ContentDataTree from './ContentDataTree';
import KNExperimentalTree from './KNExperimentalTree';
const DataSourceArea = ({ onPreviewFile }: any) => {
  const {
    dipChatStore: { agentDetails },
  } = useDipChatStore();
  const [knSpaceList, setKnSpaceList] = useState([]);
  const { data_source } = agentDetails?.config || {};
  const knSpaceTreeDataSource = data_source?.kg ?? [];
  const knExperimentalDataSource = data_source?.knowledge_network ?? [];
  const docTreeDataSource = data_source?.doc ?? [];
  const metricTreeDataSource = data_source?.metric ?? [];

  useEffect(() => {
    getKnSpaceList();
  }, []);

  const getKnSpaceList = async () => {
    const params = { size: 1000, page: 1, rule: 'update', order: 'desc' };
    const { res } = (await getKnowledgeSourceList(params)) || {};
    if (res) {
      setKnSpaceList(res.df ?? []);
    }
  };

  /** 渲染AS文档树 */
  const renderASDocTree = () => {
    const treeDataSource = docTreeDataSource.filter((item: any) => item.ds_id !== '0');
    return treeDataSource.map((item: any) => (
      <DocTree key={item.ds_id} dataSource={item} onPreviewFile={onPreviewFile} />
    ));
  };

  /** 渲染内容数据湖树 */
  const renderContentDataTree = () => {
    const treeDataSource = docTreeDataSource.filter((item: any) => item.ds_id === '0');
    return treeDataSource.map((item: any) => (
      <ContentDataTree key={item.ds_id} dataSource={item} onPreviewFile={onPreviewFile} />
    ));
  };

  const renderKNExperimentalTree = () => {
    return knExperimentalDataSource.map((item: any) => (
      <KNExperimentalTree key={item.knowledge_network_id} dataSource={item} />
    ));
  };

  const renderContent = () => {
    return (
      <div>
        {!_.isEmpty(knSpaceList) &&
          knSpaceTreeDataSource.map((item: any) => (
            <KNSpaceTree key={item.kg_id} dataSource={item} knSpaceList={knSpaceList} />
          ))}
        {renderKNExperimentalTree()}
        {!_.isEmpty(metricTreeDataSource) && <MetricTree dataSource={metricTreeDataSource} />}
        {/* {renderASDocTree()}*/}
        {renderContentDataTree()}
      </div>
    );
  };
  return (
    <div className={classNames(styles.container, 'dip-flex-column')}>
      <div className="dip-pl-12 dip-pr-12">
        <span className="dip-font-weight-700">知识来源</span>
      </div>
      <ScrollBarContainer className="dip-flex-item-full-height dip-pl-12 dip-pr-12 dip-pt-8">
        {renderContent()}
      </ScrollBarContainer>
    </div>
  );
};

export default DataSourceArea;
