import AdTree from '@/components/AdTree';
import React, { useEffect, useState } from 'react';
import { AdTreeDataNode, adTreeUtils } from '@/utils/handle-function';
import { getKnExperimentDetailsById } from '@/apis/knowledge-data';
import DipIcon from '@/components/DipIcon';

const KNExperimentalTree = ({ dataSource }: any) => {
  const { knowledge_network_id } = dataSource || {};
  const [treeProps, setTreeProps] = useState({
    treeData: [] as AdTreeDataNode[],
  });
  useEffect(() => {
    if (knowledge_network_id) {
      getTreeData();
    }
  }, []);

  const getTreeData = async () => {
    const res = await getKnExperimentDetailsById(knowledge_network_id);
    if (res) {
      const treeDataSource = adTreeUtils.createAdTreeNodeData([res], {
        keyField: 'id',
        titleField: (record: any) => (
          <div className="dip-flex-align-center" title={record.name}>
            <DipIcon type="icon-dip-KG" />
            <span style={{ whiteSpace: 'nowrap' }} className="dip-ml-8">
              {record.name}
            </span>
          </div>
        ),
        isLeaf: true,
      });
      setTreeProps(prevState => ({
        ...prevState,
        treeData: treeDataSource,
      }));
    }
  };

  return <AdTree selectable={false} treeData={treeProps.treeData} />;
};

export default KNExperimentalTree;
