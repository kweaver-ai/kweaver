import React, { useEffect, useState } from 'react';
import { getKnowledgeSourceDetail } from '@/apis/knowledge-data';
import AdTree from '@/components/AdTree';
import { AdTreeDataNode, adTreeUtils } from '@/utils/handle-function';
import DipIcon from '@/components/DipIcon';
import styles from './index.module.less';
import { nanoid } from 'nanoid';

// 以前的知识网络现在叫知识空间
// 以前的知识图谱现在叫知识网络
const KNSpaceTree = ({ dataSource, knSpaceList }: any) => {
  const { kg_id, fields, field_properties } = dataSource || {};
  const [treeProps, setTreeProps] = useState({
    treeData: [] as AdTreeDataNode[],
  });
  useEffect(() => {
    if (kg_id) {
      getKnowledgeNetworkDetails();
    }
  }, [kg_id]);
  const getKnowledgeNetworkDetails = async () => {
    const { res } = await getKnowledgeSourceDetail({ id: kg_id });
    if (res) {
      const newRes = res || {};
      const knNetDetailsData = { ...newRes, kg_id };
      const { knw_id, entity } = knNetDetailsData; // knw_id 是知识空间的id
      const knSpaceData = knSpaceList.find((item: any) => item.id === knw_id);
      if (knSpaceData) {
        // 1. 构造知识空间根节点
        let treeDataSource = adTreeUtils.createAdTreeNodeData([knSpaceData], {
          titleField: (record: any) => (
            <div className="dip-flex-align-center" title={record.knw_name}>
              <DipIcon type="icon-dip-color-putongwenjianjia" />
              <span style={{ whiteSpace: 'nowrap' }} className="dip-ml-8">
                {record.knw_name}
              </span>
            </div>
          ),
          keyField: () => nanoid(),
          isLeaf: false,
        });

        treeDataSource.forEach(treeNode => {
          // 2. 构造知识空间下面的知识网络节点
          const knNetTreeData = adTreeUtils.createAdTreeNodeData([knNetDetailsData], {
            titleField: (record: any) => (
              <div className="dip-flex-align-center" title={record.graph_name}>
                <DipIcon type="icon-dip-KG" />
                <span className="dip-ml-8">{record.graph_name}</span>
              </div>
            ),
            keyField: 'kg_id',
            isLeaf: false,
            parentKey: treeNode.key as string,
            keyPath: treeNode.keyPath,
          });
          treeDataSource = adTreeUtils.addTreeNode(treeDataSource, knNetTreeData);

          knNetTreeData.forEach(knNetTreeNode => {
            // 3. 构造知识网络节点下面的对象节点
            // 只显示Agent身上配置的对象
            const filterEntity = entity.filter((entityItem: any) => fields.includes(entityItem.name));
            const objectTreeData = adTreeUtils.createAdTreeNodeData(filterEntity, {
              titleField: (record: any) => (
                <div className="dip-flex-align-center" title={`${record.alias} (${record.name})`}>
                  <div className={styles.dot} style={{ background: record.color }} />
                  <div className="dip-ml-8 dip-flex-item-full-width dip-ellipsis">
                    {record.alias}
                    <span className="dip-ml-8">({record.name})</span>
                  </div>
                </div>
              ),
              keyField: 'name',
              isLeaf: false,
              parentKey: knNetTreeNode.key as string,
              keyPath: knNetTreeNode.keyPath,
            });
            treeDataSource = adTreeUtils.addTreeNode(treeDataSource, objectTreeData);

            // 4. 构造对象节点下面的属性节点
            // 只显示Agent身上配置的对象身上的属性
            objectTreeData.forEach(objectTreeNode => {
              const parentKey = objectTreeNode.key as string;
              const filterProperties = objectTreeNode.sourceData.properties.filter((propItem: any) =>
                field_properties[parentKey].includes(propItem.name)
              );
              // Agent配置身上可能会存在"实体vid"，但是"实体vid"在对象身上的属性中并没有，是Agent配置硬添加的一个
              if (field_properties[parentKey].includes('实体vid')) {
                filterProperties.unshift({
                  type: 'string',
                  name: '实体vid',
                });
              }
              const propTreeData = adTreeUtils.createAdTreeNodeData(filterProperties, {
                titleField: (record: any) => {
                  if (record.name === '实体vid') {
                    return record.name;
                  }
                  return (
                    <div className="dip-flex-align-center dip-ellipsis" title={`${record.alias} (${record.name})`}>
                      {record.alias}
                      <span className="dip-ml-8">({record.name})</span>
                    </div>
                  );
                },
                keyField: (record: any) => `${objectTreeNode.key}-${record.name}`,
                isLeaf: true,
                parentKey,
                keyPath: objectTreeNode.keyPath,
              });
              treeDataSource = adTreeUtils.addTreeNode(treeDataSource, propTreeData);
            });
          });
        });
        setTreeProps(prevState => ({
          ...prevState,
          treeData: treeDataSource,
        }));
      }
    }
  };

  return <AdTree selectable={false} treeData={treeProps.treeData} />;
};

export default KNSpaceTree;
