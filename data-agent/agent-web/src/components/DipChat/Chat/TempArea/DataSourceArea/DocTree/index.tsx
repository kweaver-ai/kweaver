import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AdTreeDataNode, adTreeUtils } from '@/utils/handle-function';
import AdTree from '@/components/AdTree';
import { getChildrenFile, getDocsSourceListByDsId } from '@/apis/knowledge-data';
import DipIcon from '@/components/DipIcon';
import { FileTypeIcon, getFileExtension, getLastDocId } from '@/utils/doc';
import _ from 'lodash';

const DocTree = ({ dataSource, onPreviewFile }: any) => {
  const { ds_id, fields } = dataSource || {};
  const [treeProps, setTreeProps] = useState({
    treeData: [] as AdTreeDataNode[],
  });
  const rootNodeKeys = useRef<string[]>([]);
  useEffect(() => {
    if (ds_id) {
      getDocTree();
    }
  }, [ds_id]);
  const getDocTree = async () => {
    const { res } = await getDocsSourceListByDsId({
      ds_id: ds_id,
      data_source: 'as7',
      postfix: 'all',
    });
    if (res && res.output?.length > 0) {
      rootNodeKeys.current = res.output.map((item: any) => item.docid);
      console.log(res.output, '所有的根节点');
      const treeDataSource = adTreeUtils.createAdTreeNodeData(res.output, {
        titleField: (record: any) => (
          <div className="dip-flex-align-center" title={record.name}>
            <DipIcon type="icon-dip-color-putongwenjianjia" />
            <span style={{ whiteSpace: 'nowrap' }} className="dip-ml-8">
              {record.name}
            </span>
          </div>
        ),
        keyField: 'docid',
        isLeaf: false,
      });
      setTreeProps(prevState => ({
        ...prevState,
        treeData: treeDataSource,
      }));
    }
  };

  // 根据gns可以获取到文件以及文件所在文件夹的key
  const selectedTreeNodeKeys = useMemo(() => {
    const keys: string[] = [];
    fields.forEach((item: any) => {
      if (item.source) {
        // 将字符串按 / 分割，但保留 gns:// 前缀
        const parts = item.source.split('/').filter(Boolean);
        // 构建基础路径
        let basePath = parts[0] + '//' + parts[1];
        keys.push(basePath);
        // 如果还有更多部分，继续构建完整路径
        if (parts.length > 2) {
          for (let i = 2; i < parts.length; i++) {
            basePath += '/' + parts[i];
            keys.push(basePath);
          }
        }
      }
    });
    return _.uniq(keys);
  }, [fields]);

  const onLoadData = (nodeData: AdTreeDataNode) => {
    return new Promise<any>(async resolve => {
      const { res } = await getChildrenFile({
        docid: nodeData.key as string,
        ds_id: ds_id,
        postfix: 'all',
      });
      if (res && res.output?.length > 0) {
        let filterData = [];
        // selectedTreeNodeKeys里面有rootNodeKeys.current的话
        // 看 selectedTreeNodeKeys 是否在 rootNodeKeys.current 里面， 在的话说明选中的是根节点， 是根节点  不要过滤
        const isRootNodeSelected = selectedTreeNodeKeys.some(key => rootNodeKeys.current.includes(key));
        if (isRootNodeSelected) {
          filterData = res.output;
        } else {
          filterData = res.output.filter((item: any) => selectedTreeNodeKeys.includes(item.docid));
        }
        console.log(res.output, 'res.output');
        console.log(selectedTreeNodeKeys, 'selectedTreeNodeKeys');

        const childTreeData = adTreeUtils.createAdTreeNodeData(filterData, {
          titleField: (record: any) => (
            <div
              className="dip-flex-align-center"
              title={record.name}
              onClick={() => {
                console.log(record, '预览的文件');
                if (record.type === 'file') {
                  onPreviewFile?.({
                    id: getLastDocId(record.docid),
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
          ),
          keyField: 'docid',
          isLeaf: (record: any) => record.type !== 'dir',
          parentKey: nodeData.key as string,
          keyPath: nodeData.keyPath,
        });
        const treeDataSource = adTreeUtils.addTreeNode(treeProps.treeData, childTreeData);
        setTreeProps(prevState => ({
          ...prevState,
          treeData: treeDataSource,
        }));
        resolve(true);
      } else {
        resolve(false);
      }
    });
  };

  return <AdTree loadData={onLoadData as any} selectable={false} treeData={treeProps.treeData} />;
};
export default DocTree;
