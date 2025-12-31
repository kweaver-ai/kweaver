import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Collapse } from 'antd';
import OntologyObjectType from '@/services/object/type';
import DataAttribute from './DataAttribute';
import styles from './index.module.less';
import LogicAttribute from './LogicAttribute';
import { transformAttrData, transformCanvasData, TransformCanvasDataParams } from './utils';

interface TMappingTabProps {
  sort: number;
  title: string;
  active: boolean;
  onOk: () => void;
}
const MappingTab = (props: TMappingTabProps) => {
  const { sort, title, active, onOk } = props;
  return (
    <dl className={`${styles['mapping-tab']} ${active ? styles['mapping-tab-active'] : ''}`} onClick={onOk}>
      <dt>{sort}</dt>
      <dd>{title}</dd>
    </dl>
  );
};

interface TProps {
  dataProperties: OntologyObjectType.DataProperty[];
  logicProperties: OntologyObjectType.LogicProperty[];
  fields: OntologyObjectType.Field[];
  basicValue: OntologyObjectType.BasicInfo;
  dataSource?: OntologyObjectType.DataSource;
  openDataViewSource?: () => void;
}

const Mapping = forwardRef((_props: TProps, ref) => {
  const { dataProperties = [], logicProperties = [], fields = [], basicValue, dataSource, openDataViewSource } = _props;
  const [activeTab, setActiveTab] = useState<'DataAttribute' | 'LogicAttribute'>('DataAttribute');
  const [allData, setAllData] = useState<OntologyObjectType.ViewField[]>([]);
  const [nodes, setNodes] = useState<OntologyObjectType.TNode[]>([]);
  const [edges, setEdges] = useState<OntologyObjectType.TEdge[]>([]);
  const [initEdges, setInitEdges] = useState<OntologyObjectType.TEdge[]>([]);
  const [logicFields, setLogicFields] = useState<OntologyObjectType.LogicProperty[]>([]);

  const getInitData = (val?: Partial<TransformCanvasDataParams>) => {
    const { nodes, edges, allData } = transformCanvasData({ dataProperties, logicProperties, fields, dataSource, basicValue, ...val });
    setAllData(allData);
    setNodes(nodes);
    if (!val) {
      setEdges(edges);
      setInitEdges(edges);
    }
  };

  useEffect(() => {
    getInitData();
    setLogicFields(logicProperties);
  }, [JSON.stringify(dataProperties), JSON.stringify(logicProperties), JSON.stringify(dataSource), JSON.stringify(basicValue)]);

  useImperativeHandle(ref, () => ({
    validateFields: () => {
      return new Promise((resolve, reject) => {
        let dataPropertiesCur: OntologyObjectType.DataProperty[] = [];
        if (nodes.length > 0) {
          dataPropertiesCur = transformAttrData({
            edges,
            nodes,
            logics: logicFields.map((val) => val.name),
          });
        }

        resolve({ dataProperties: dataPropertiesCur, logicProperties: logicFields });
      });
    },
  }));

  const changeActiveTab = (key: 'DataAttribute' | 'LogicAttribute') => {
    if (key === 'DataAttribute') {
      getInitData({ logicProperties: logicFields });
      setInitEdges(edges);
    }
    setActiveTab(key);
  };

  const items = [
    {
      key: 'attribute',
      label: <b>{intl.get('Object.configurationSteps')}</b>,
      children: (
        <>
          <MappingTab sort={1} title={intl.get('Global.dataProperty')} active={activeTab === 'DataAttribute'} onOk={() => changeActiveTab('DataAttribute')} />
          <MappingTab
            sort={2}
            title={intl.get('Object.logicProperty')}
            active={activeTab === 'LogicAttribute'}
            onOk={() => changeActiveTab('LogicAttribute')}
          />
        </>
      ),
    },
  ];

  const saveData = (edges: OntologyObjectType.TEdge[]) => {
    setEdges(edges);
  };

  const saveLogicAttrData = (data: OntologyObjectType.LogicProperty[]) => {
    setLogicFields(data);
  };

  // 其他数据属性（过滤边，逻辑属性，逻辑属性中所有被引用的属性）
  const otherData = useMemo(() => {
    const edgeNames = edges.map((val) => val.id.split('&&')[0]);
    const logicNames = logicFields.map((val) => val.name);
    const logicParametersNames = logicFields.map((val) => val.parameters?.map((item) => item.value)).flat();
    return allData.filter((item) => !edgeNames.includes(item.name) && !logicNames.includes(item.name) && !logicParametersNames.includes(item.name));
  }, [allData, edges, logicFields]);

  return (
    <div className={styles['mapping-box']}>
      <div className={styles['mapping-tabs']}>
        <Collapse expandIconPosition="end" defaultActiveKey={['attribute']} ghost items={items} />
      </div>
      <div className={styles['mapping-content']}>
        {activeTab === 'DataAttribute' && (
          <DataAttribute nodes={nodes} edges={initEdges} saveEdge={saveData} openDataViewSource={dataSource ? undefined : openDataViewSource} />
        )}
        {activeTab === 'LogicAttribute' && (
          <LogicAttribute basicValue={basicValue} allData={allData} logicFields={logicFields} otherData={otherData} saveLogicAttrData={saveLogicAttrData} />
        )}
      </div>
    </div>
  );
});

export default Mapping;
