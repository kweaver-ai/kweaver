import _ from 'lodash';
import { v4 as generateUuid } from 'uuid';
import classNames from 'classnames';

/**
 * 当前路径文件列表转换为select Tree
 * @param curPathFilesList [] 当前路径文件数据
 * @returns treeData
 */
export const genTreeDataFromTableData = (curPathFilesList: any, pathKey?: string) => {
  const treeData = _.map(curPathFilesList, item => {
    const isLeaf = item.type === 'file';

    return {
      ...item,
      id: item.id,
      pId: pathKey || 0,
      value: item.id,
      title: (
        <div className={classNames('ad-ellipsis', !isLeaf ? 'tree-p-node' : '')} style={{ width: 150 }} title={item.name}>
          {item.name}
        </div>
      ),
      isLeaf,
    };
  });

  return _.orderBy(treeData, ['type'], ['asc']);
};

export const genCurPathFiles = () => {
  const random = Math.random().toString(36).substring(2, 6);

  const addList = new Array(Math.floor(Math.random() * 10))
    .fill({
      key: '',
      id: '',
      name: `文件名称-${generateUuid().replace(/-/g, '_').slice(0, 3)}`,
      description: '文件描述',
      type: 'file',
      size: 12,
      create_user: '创建人',
      create_time: '2022-01-22 12:22:34',
      update_user: '编辑人编辑人编辑人编辑人编辑人编辑人编辑人',
      update_time: '2022-01-22 12:22:34',
    })
    .map((item, index) => {
      const _id = generateUuid().replace(/-/g, '_');
      return { ...item, key: _id, id: _id, type: Math.random() > 0.5 ? 'file' : 'dir' };
    })
    .concat({
      key: random,
      id: random,
      name: `文件名称-${generateUuid().replace(/-/g, '_').slice(0, 5)}`,
      description: '文件描述',
      type: 'dir',
      size: 12,
      create_user: '创建人',
      create_time: '2022-01-22 12:22:34',
      update_user: '编辑人编辑人编辑人编辑人编辑人编辑人编辑人',
      update_time: '2022-01-22 12:22:34',
    });

  return addList;
};

export const genTreeNode = (parentId: number, isLeaf = false) => {
  const random = Math.random().toString(36).substring(2, 6);
  return {
    id: random,
    pId: parentId,
    value: random,
    title: isLeaf ? 'file' : 'dir',
    isLeaf,
  };
};
