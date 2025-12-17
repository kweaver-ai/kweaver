import React, { useEffect, useState } from 'react';
import { AdTreeDataNode, adTreeUtils } from '@/utils/handle-function';
import { FieldEnum, getDocInfoByObjectIdBatch, listDir } from '@/apis/efast';
import { FileTypeIcon, getFileExtension, getFileIcon, getLastDocId } from '@/utils/doc';
import AdTree from '@/components/AdTree';
import _ from 'lodash';
import DipIcon from '@/components/DipIcon';

const ContentDataTree = ({ dataSource, onPreviewFile }: any) => {
  const { fields } = dataSource || {};
  const [treeProps, setTreeProps] = useState({
    treeData: [] as AdTreeDataNode[],
  });
  useEffect(() => {
    if (fields?.length > 0) {
      getTreeData();
    }
  }, [fields]);
  const getTreeData = async () => {
    const docids = fields.map((item: any) => getLastDocId(item.source)!);
    // 先获取文档库的类型
    const res = await getDocInfoByObjectIdBatch(docids, [FieldEnum.DocId, FieldEnum.DocLibType, FieldEnum.Size]);
    if (res) {
      const data = fields.map((item: any) => {
        const target = res.find((resItem: any) => resItem.doc_id === item.source);
        return {
          ...item,
          doc_lib_type: target.doc_lib_type,
          size: target.size,
        };
      });
      const treeDataSource = adTreeUtils.createAdTreeNodeData(data, {
        titleField: (record: any) => {
          const Icon = getFileIcon({
            size: record.size,
            doc_lib_type: record.doc_lib_type,
            doc_type: record.source.replace('gns://', '').split('/').length > 1 ? [] : ['doc_lib'],
          });
          return (
            <div className="dip-flex-align-center" title={record.name}>
              <Icon />
              <span style={{ whiteSpace: 'nowrap' }} className="dip-ml-8">
                {record.name}
              </span>
            </div>
          );
        },
        keyField: 'source',
        isLeaf: false,
      });
      setTreeProps(prevState => ({
        ...prevState,
        treeData: treeDataSource,
      }));
    }
  };
  const onLoadData = (nodeData: AdTreeDataNode) => {
    return new Promise<any>(async resolve => {
      const key = nodeData.key as string;
      const res = await listDir({ docid: _.last(key.split('-'))!, limit: 100 });
      if (res) {
        const { dirs, files } = res;
        const data = [
          ...dirs.map(item => ({ ...item, type: 'dir' })),
          ...files.map(item => ({ ...item, type: 'file' })),
        ];
        const childTreeData = adTreeUtils.createAdTreeNodeData(data, {
          titleField: (record: any) => {
            return (
              <div
                className="dip-flex-align-center"
                title={record.name}
                onClick={() => {
                  if (record.type === 'file') {
                    onPreviewFile?.({
                      id: getLastDocId(record.id),
                      name: record.name,
                    });
                  }
                }}
              >
                {record.type === 'dir' ? (
                  <DipIcon type="icon-dip-color-putongwenjianjia" />
                ) : (
                  <FileTypeIcon extension={getFileExtension(record.name)} fontSize={14} />
                )}
                <span className="dip-ml-8 dip-flex-item-full-width dip-ellipsis">{record.name}</span>
              </div>
            );
          },
          keyField: 'id',
          isLeaf: (record: any) => record.size !== -1,
          parentKey: nodeData.key as string,
          keyPath: nodeData.keyPath,
        });
        const treeDataSource = adTreeUtils.addTreeNode(treeProps.treeData, childTreeData);
        setTreeProps(prevState => ({
          ...prevState,
          treeData: treeDataSource,
        }));
      }
      resolve(true);
    });
  };
  return <AdTree loadData={onLoadData as any} selectable={false} treeData={treeProps.treeData} />;
};

export default ContentDataTree;
