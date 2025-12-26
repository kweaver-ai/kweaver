import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Dropdown, type TreeDataNode } from 'antd';
import { LoadingOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Tree, IconFont, Button, DragLine } from '@/common';

import List from './List';
import ContentHeader from './ContentHeader';
import PromptPreview from './PromptPreview';
import Debug from './Debug';

import CopyAndMoveModal from './CopyAndMoveModal';
import CreateAndEditProjectModal from './CreateAndEditProjectModal';
import CreateAndEditPromptModal from './CreateAndEditPromptModal';

import styles from './index.module.less';

const TitleOperate = (props: any) => {
  const { item, menus, onChange } = props;
  return (
    <Dropdown
      trigger={['hover']}
      placement='bottomRight'
      getPopupContainer={(triggerNode: any) => triggerNode.parentNode}
      menu={{ items: menus, onClick: (data: any) => onChange(data, item) }}
    >
      <Button.Icon
        size='small'
        icon={<IconFont className='g-rotate-90' type='icon-dip-ellipsis' style={{ fontSize: 12 }} />}
        onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => event.stopPropagation()}
      />
    </Dropdown>
  );
};

/**
 * ✓ 1、新建分组后，没有展开树结构
 * ✓ 2、移动后，移动的document信息丢失
 * ✓ 3、提示词搜索
 * ✓ 4、markdown 组件和样式
 * ✓ 5、移动和复制的树形选择组件，调整
 * ✓ 6、变量收起再打开，图片和视频资源会重新上传
 */
const Prompt = () => {
  const { modal, message } = HOOKS.useGlobalContext();
  const [width, setWidth] = useState(420);

  const [fetching, setFetching] = useState(false);
  const [promptList, setPromptList] = useState<any[]>([]); // 提示词列表
  const [promptFolder, setPromptFolder] = useState<any[]>([]); // 提示词列表分组
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]); // 树形结构数据
  const [selectedKeys, setSelectedKeys] = useState<any[]>([]); // 树形结构选中的叶子节点
  const [selectedPrompt, setSelectedPrompt] = useState<any>({}); // 选中的提示词
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // 树形结构展开的节点

  const [variables, setVariables] = useState<any[]>([]); // 提示词变量
  const [CAM_ModalData, setCAM_ModalData] = useState<any>({ open: false, type: 'copy', sourceData: null }); // 复制提示词弹窗数据
  const [CAE_ProjectModalData, setCAE_ProjectModalData] = useState<any>({ open: false, type: 'create', parentData: null, sourceData: null }); // 创建和编辑分组弹窗
  const [CAE_PromptModalData, setCAE_PromptModalData] = useState<any>({ open: false, type: 'create', parentData: null, sourceData: null }); // 创建和编辑提示词弹窗

  const promptListRef = useRef(promptList);
  promptListRef.current = promptList;
  const selectedKeysRef = useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;

  /** debug 切换 */
  const onTriggerDebug = () => setWidth(420);
  const onCloseDebug = () => setWidth(0);

  /** debug 宽度调整 */
  const onChangeWidth = (x: number) => setWidth(width - x);

  useEffect(() => {
    getPromptProjectList();
  }, []);

  const onChangeFetch = (fetch: boolean) => setFetching(fetch);

  /** 获取提示词列表 */
  const getPromptProjectList = async () => {
    onChangeFetch(true);
    try {
      const _result = await SERVICE.prompt.promptProjectGetList({ page: 1, size: 1000 });

      const promptList = _.map(_result?.res?.data, (item: any) => {
        item.id = item.prompt_item_id;
        item.type = 'folder';
        item.name = item.prompt_item_name;
        item.children = item.prompt_item_types;
        delete item.prompt_item_id;
        delete item.prompt_item_name;
        delete item.prompt_item_types;
        if (item?.children?.length > 0) {
          _.forEach(item.children, (child: any) => {
            child.type = 'folder';
            child.is_built_in = item.is_built_in;
          });
        }
        return item;
      });
      setPromptFolder(promptList);

      const result = await getPromptList('1510000000000000001-1520000000000000001');
      const insetResult: any = handlerPromptListInset('1510000000000000001-1520000000000000001', result, promptList);
      onChangeFetch(false);

      // 默认展开的 folder
      if (_.isEmpty(expandedKeys)) onChangeExpanded(['1510000000000000001', '1510000000000000001-1520000000000000001']);

      // 默认选中的 document
      if (_.isEmpty(selectedKeys)) {
        let selected: any = null;
        const findFirst = (item: any) => {
          if (item?.children?.[0]) {
            findFirst(item.children[0]);
          } else {
            selected = item;
          }
        };
        findFirst(insetResult?.treeData[0]);
        onChangeSelected(selected.sourceData);
      }
    } catch (_error) {
      onChangeFetch(false);
    }
  };

  /** 获取提示词列表 */
  const getPromptList = async (id: string) => {
    try {
      const ids = id.split('-');
      const result = await SERVICE.prompt.promptGetList({
        prompt_item_id: ids[0],
        prompt_item_type_id: ids[1],
        rule: 'update_time',
        order: 'desc',
        deploy: 'all',
        prompt_type: 'all',
        page: 1,
        size: 1000,
      });

      return _.map(result?.res?.data, (item: any) => {
        item.id = item.prompt_id;
        item.type = 'document';
        item.name = item.prompt_name;
        return item;
      });
    } catch (error) {
      console.log('pages:Prompt/List function:getPromptListDetail', error);
    }
  };

  const menus: any = {
    folder: [
      { key: 'edit', label: intl.get('Prompt.side.edit') },
      { key: 'delete', label: intl.get('Prompt.side.delete') },
    ],
    document: [
      { key: 'edit', label: intl.get('Prompt.side.edit') },
      { key: 'debug', label: intl.get('Prompt.side.debug') },
      { key: 'copy', label: intl.get('Prompt.side.copy') },
      { key: 'move', label: intl.get('Prompt.side.move') },
      { key: 'delete', label: intl.get('Prompt.side.delete') },
    ],
    builtin: [
      { key: 'debug', label: intl.get('Prompt.side.debug') },
      { key: 'copy', label: intl.get('Prompt.side.copy') },
    ],
  };

  /** 设置提示词树型数据 */
  const constructTreeData = (promptList: any) => {
    const traversalItems: any = (items: any, parentData: any) => {
      return _.map(items, item => {
        const { id, name, type, is_built_in } = item;
        const key = parentData ? `${parentData._key}-${id}` : id;
        item._key = key;
        if (parentData) {
          // 把parent的数据加入节点
          const _parentData = _.cloneDeep(parentData);
          delete _parentData.children;
          item._parentData = _parentData;
        }
        const children = item?.children ? traversalItems(item.children, item) : [];
        const operate =
          type === 'document' ? (
            <TitleOperate item={item} menus={is_built_in ? menus.builtin : menus[type]} onChange={onChangeMenus} />
          ) : (
            <React.Fragment>
              <TitleOperate item={item} menus={is_built_in ? menus.builtin : menus[type]} onChange={onChangeMenus} />
              <Button.Icon
                size='small'
                title={parentData ? intl.get('Prompt.side.newPrompt') : intl.get('Prompt.side.newGroup')}
                icon={<IconFont type='icon-dip-add' />}
                onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                  event.stopPropagation();
                  parentData ? onOpenCAE_PromptModal('create', item) : onOpenCAE_ProjectModal('create', item);
                }}
              />
            </React.Fragment>
          );
        return {
          key,
          type,
          children,
          sourceData: item,
          title: <Tree.FolderAndDocumentTitle type={type} title={name} hasSwitcherIcon={true} operate={is_built_in && type === 'folder' ? null : operate} />,
        };
      });
    };

    return traversalItems(_.cloneDeep(promptList));
  };

  // 查找元素
  const findItem = (id: string, data: any) => {
    let result: any;
    const traversalItems = (items: any) => {
      _.forEach(items, item => {
        if (item?.id === id || item?.key === id) result = item;
        if (item.children) traversalItems(item.children);
      });
    };
    traversalItems(data);
    return result;
  };

  /** 向提示词列表插入数据 */
  const handlerPromptListInset = (key: any, data: any, list?: any) => {
    let result = _.cloneDeep(list ? list : promptListRef.current);
    const insetData = Array.isArray(data) ? data : [data];

    if (!key) {
      result = insetData;
    } else {
      const ids = key.split('-');
      const traversalItems = (items: any, index: number) => {
        if (!items || !ids[index]) return;
        _.forEach(items, item => {
          if (item.id !== ids[index]) return;
          if (index === ids.length - 1) {
            item.children = insetData;
          } else {
            traversalItems(item?.children, index + 1);
          }
        });
      };
      traversalItems(result, 0);
    }

    setPromptList(result);
    const treeData = constructTreeData(result);
    setTreeData(treeData);

    return { promptList: result, treeData };
  };

  /** 展开和收起树结构 */
  const onChangeExpanded = (value: string[]) => setExpandedKeys(_.uniq(value));

  /** 展开收起元素 */
  const onExpand = async (keys: any, info: any) => {
    onChangeExpanded(keys);

    const { key, type, children } = info.node;
    if (!info.expanded || !_.includes(key, '-') || type === 'document') return;

    const traversalItems = (items: any, loading: boolean) => {
      if (_.isEmpty(items)) return;
      _.forEach(items, item => {
        if (item.key === key && item?.title?.props) {
          item.title.props.hasSwitcherIcon = !!loading;
          item.title.props.switcherIcon = loading ? <LoadingOutlined /> : null;
        } else {
          traversalItems(item?.children, loading);
        }
      });
    };

    if (_.isEmpty(children)) {
      const newTreeData = _.cloneDeep(treeData);
      traversalItems(newTreeData, true);
      setTreeData(newTreeData);
    }

    try {
      const result = await getPromptList(key);
      handlerPromptListInset(key, result);
    } catch (_error) {
      const newTreeData = _.cloneDeep(treeData);
      traversalItems(newTreeData, false);
      setTreeData(newTreeData);
    }
  };

  /** 选择 prompt */
  const onChangeSelected: any = (value: any) => {
    // onCloseDebug();
    setSelectedPrompt(value);
    setSelectedKeys(value?._key ? [value._key] : []);
    setVariables(value.variables ? value.variables : []);
  };

  /** 打开复制和移动提示词弹窗 */
  const onOpenCopyModal = (type: 'copy' | 'move', sourceData = null) => setCAM_ModalData({ open: true, type, sourceData });
  /** 关闭复制和移动提示词弹窗 */
  const onCloseCopyModal = () => setCAM_ModalData({ open: false });
  /** 复制和移动提示词 OK */
  const onOkCopyModal = async (values: any) => {
    try {
      const { type, sourceData } = CAM_ModalData;
      const ids = values.project.split('-');
      if (type === 'copy') {
        const postData = {
          prompt_item_id: ids[0],
          prompt_item_type_id: ids[1],
          prompt_name: values.name,
          messages: sourceData.messages,
          // 后续需要删除
          icon: '5',
          prompt_desc: '',
          prompt_service_id: '1925064518048813056',
          prompt_type: 'completion',
          variables: sourceData.variables,
        };
        const result = await SERVICE.prompt.promptAdd(postData);
        if (result?.res?.prompt_id) {
          const parentKey = values.project;
          const key = `${parentKey}-${result.res.prompt_id}`;

          const promptList = await getPromptList(parentKey);
          const insetResult = handlerPromptListInset(parentKey, promptList);
          const keys = parentKey.split('-');
          onChangeExpanded([...expandedKeys, keys[0], parentKey]);
          const selected = findItem(key, insetResult.treeData);
          onChangeSelected(selected?.sourceData);
          message.success(intl.get('Prompt.copySuccess'));
        }
      }
      if (type === 'move') {
        const postData = {
          prompt_item_id: ids[0],
          prompt_item_type_id: ids[1],
          prompt_id: sourceData.id,
        };

        const result = await SERVICE.prompt.promptMove(postData);
        if (result.res) {
          const newPromptList = _.cloneDeep(promptListRef.current);
          const source = findItem(sourceData?._parentData.id, newPromptList);
          const target = findItem(ids[1], newPromptList);

          let index: any;
          _.forEach(source.children, (d: any, i: number) => {
            if (d.id === sourceData.id) index = i;
          });
          const temp = source.children.splice(index, 1);
          if (target.children) target.children.unshift(temp[0]);
          else target.children = temp;

          const insetResult = handlerPromptListInset('', newPromptList);
          setTimeout(async () => {
            const parentKey = values.project;
            const keys = parentKey.split('-');
            onChangeExpanded([...expandedKeys, keys[0], parentKey]);
            const newKey = `${parentKey}-${sourceData.id}`;
            const selected = findItem(newKey, insetResult.treeData);
            onChangeSelected(selected?.sourceData);
            message.success(intl.get('Prompt.moveSuccess'));
          }, 200);
        }
      }
    } catch (error) {
      console.log('pages:Prompt/List function:onOkCopyModal', error);
    }
  };

  /** 打开创建和编辑分组弹窗 */
  const onOpenCAE_ProjectModal = (type: string, parentData = null, sourceData = null) => setCAE_ProjectModalData({ open: true, type, parentData, sourceData });
  /** 关闭创建和编辑分组弹窗 */
  const onCloseCAE_ProjectModal = () => setCAE_ProjectModalData({ open: false, type: 'create', parentData: null, sourceData: null });
  /** 添加和编辑分组的 OK */
  const onOkCAE_ProjectModal = async (type: 'create' | 'edit', values: any) => {
    try {
      if (type === 'create') {
        let result: any;
        if (CAE_ProjectModalData.parentData) {
          result = await SERVICE.prompt.promptProject2Add({ prompt_item_id: CAE_ProjectModalData.parentData?.id, prompt_item_type: values.name });
        } else {
          result = await SERVICE.prompt.promptProjectAdd({ prompt_item_name: values.name });
        }
        const id = result?.res;

        if (id) {
          getPromptProjectList();
          onChangeExpanded([...expandedKeys, CAE_ProjectModalData?.parentData?._key, id]);
          message.success(intl.get('Prompt.createSuccess'));
        }
      }
      if (type === 'edit') {
        let result: any;
        if (CAE_ProjectModalData?.sourceData?._parentData) {
          result = await SERVICE.prompt.promptProject2Edit({ prompt_item_type: values.name, prompt_item_type_id: values.id });
        } else {
          result = await SERVICE.prompt.promptProjectEdit({ prompt_item_id: values.id, prompt_item_name: values.name });
        }
        if (result?.res) {
          getPromptProjectList();
          message.success(intl.get('Prompt.editSuccess'));
        }
      }
    } catch (error) {
      console.log('pages:Prompt/List function:onOkCAE_ProjectModal', error);
    }
  };

  /** 打开创建和编辑提示词弹窗 */
  const onOpenCAE_PromptModal = (type: string, parentData = null, sourceData = null) => setCAE_PromptModalData({ open: true, type, parentData, sourceData });
  /** 关闭创建和编辑提示词弹窗 */
  const onCloseCAE_PromptModal = () => setCAE_PromptModalData({ open: false, type: 'create', parentData: null, sourceData: null });
  /** 添加和编辑提示词的 OK */
  const onOkCAE_PromptModal = async (type: 'create' | 'edit', values: any) => {
    try {
      if (type === 'create') {
        const { parentData } = CAE_PromptModalData;
        const postData = {
          prompt_item_id: parentData?._parentData?.id,
          prompt_item_type_id: parentData?.id,
          prompt_name: values.name,
          messages: values.messages,
          variables: values.variables,
          // 后续需要删除
          icon: '5',
          prompt_desc: '',
          prompt_service_id: '1925064518048813056',
          prompt_type: 'completion',
        };

        const result = await SERVICE.prompt.promptAdd(postData);
        if (result?.res?.prompt_id) {
          const parentKey = `${parentData?._parentData?.id}-${parentData?.id}`;
          const key = `${parentKey}-${result.res.prompt_id}`;

          const promptList = await getPromptList(parentKey);
          const insetResult = handlerPromptListInset(parentKey, promptList);
          onChangeExpanded([...expandedKeys, parentKey]);
          const selected = findItem(key, insetResult.treeData);
          onChangeSelected(selected?.sourceData);
          message.success(intl.get('Prompt.createSuccess'));
        }
      }
      if (type === 'edit') {
        const { sourceData } = CAE_PromptModalData;
        if (sourceData.prompt_name !== values.name) {
          await SERVICE.prompt.promptEditName({
            prompt_id: values.id,
            prompt_name: values.name,
            prompt_desc: '',
            icon: '5',
            prompt_item_id: sourceData?._parentData?._parentData.id,
            prompt_item_type_id: sourceData?._parentData.id,
          });
        }
        if (sourceData.messages !== values.messages) {
          await SERVICE.prompt.promptEdit({ prompt_id: values.id, messages: values.messages, variables: values.variables });
        }

        const parent = _.cloneDeep(findItem(sourceData._parentData.id, promptListRef.current));
        const children = _.map(parent.children, item => {
          if (item.id === sourceData.id) {
            item.name = values.name;
            item.prompt_name = values.name;
            item.messages = values.messages;
            item.variables = values.variables;
          }
          return item;
        });
        const insetResult = handlerPromptListInset(sourceData._parentData._key, children);
        const selected = findItem(sourceData._key, insetResult.treeData);
        onChangeSelected(selected.sourceData);
        message.success(intl.get('Prompt.editSuccess'));
      }
    } catch (error) {
      console.log('pages:Prompt/List function:onOkCAE_ProjectModal', error);
    }
  };

  /** 删除接口 */
  const onDelete = async (items: any) => {
    try {
      const item = items[0];
      const postData: any = {};
      if (item.type === 'document') {
        postData.prompt_id_list = [item.id];
      } else {
        if (item._parentData) postData.type_id = item.id;
        else postData.item_id = item.id;
      }

      const result = await SERVICE.prompt.promptProjectDelete(postData);
      if (result.res) {
        if (item.type === 'document') {
          const key = `${item._parentData._parentData.id}-${item._parentData.id}`;
          const result2 = await getPromptList(key);
          handlerPromptListInset(key, result2);
        } else {
          getPromptProjectList();
        }
        if (_.includes(selectedKeysRef.current[0], item.id)) onChangeSelected({});
        message.success(intl.get('Prompt.deleteSuccess'));
      }
    } catch (error) {
      console.log('pages:Prompt/List function:onDelete', error);
    }
  };

  /** 删除节点 */
  const onDeleteNode = (items: any) => {
    const names = _.map(items, item => `「${item?.name}」`).join('、');
    modal.confirm({
      title: intl.get('global.DeletePrompt'),
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: intl.get('global.areYouSureDelete-placeholder-cannotBeRestored', { names }),
      okText: intl.get('global.Ok'),
      cancelText: intl.get('global.Cancel'),
      onOk: () => onDelete(items),
    });
  };

  const onChangeMenus = async (menuData: any, promptData: any) => {
    menuData.domEvent.stopPropagation();
    switch (menuData.key) {
      case 'edit':
        if (promptData.type === 'folder') onOpenCAE_ProjectModal('edit', null, promptData);
        if (promptData.type === 'document') onOpenCAE_PromptModal('edit', null, promptData);
        break;
      case 'debug':
        onChangeSelected(promptData);
        onTriggerDebug();
        break;
      case 'copy':
        onOpenCopyModal('copy', promptData);
        break;
      case 'move':
        onOpenCopyModal('move', promptData);
        break;
      case 'delete':
        onDeleteNode([promptData]);
        break;
      default:
        break;
    }
  };

  const visibleDebug = !!width;

  return (
    <div className={styles['page-prompt']}>
      <div className={styles['page-prompt-list']}>
        <List
          fetching={fetching}
          treeData={treeData}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
          onChangeFetch={onChangeFetch}
          constructTreeData={constructTreeData}
          onChangeSelected={onChangeSelected}
          onChangeExpanded={onChangeExpanded}
          onOpenCAE_ProjectModal={onOpenCAE_ProjectModal}
        />
      </div>
      <div className={styles['page-prompt-content']}>
        <ContentHeader
          selectedPrompt={selectedPrompt}
          onTriggerDebug={onTriggerDebug}
          onOpenCopyModal={onOpenCopyModal}
          onDeleteNode={onDeleteNode}
          onOpenCAE_PromptModal={onOpenCAE_PromptModal}
        />
        <div className={styles['page-prompt-content-preview-and-debug']}>
          <div style={{ padding: '24px 0 24px 24px', overflow: 'hidden', width: `calc(100% - ${width}px)` }}>
            <PromptPreview selectedPrompt={selectedPrompt} />
          </div>
          <div
            style={{ width, overflow: 'hidden' }}
            className={classNames(styles['page-prompt-content-debug'], { 'g-visibility-visible': width !== 0, 'g-visibility-hidden': width === 0 })}
          >
            <DragLine className={styles['page-prompt-content-dragLine']} width={width} maxWidth={900} minWidth={300} onChange={onChangeWidth} />
            <div className='g-w-100 g-h-100' style={{ padding: width ? 24 : 0, overflowY: 'auto' }}>
              <Debug key={String(selectedKeys)} visible={visibleDebug} variables={variables} selectedPrompt={selectedPrompt} onCloseDebug={onCloseDebug} />
            </div>
          </div>
        </div>
      </div>
      <CopyAndMoveModal
        open={CAM_ModalData.open}
        type={CAM_ModalData.type}
        sourceData={CAM_ModalData.sourceData}
        promptFolder={promptFolder}
        onOk={onOkCopyModal}
        onCancel={onCloseCopyModal}
      />
      <CreateAndEditProjectModal
        open={CAE_ProjectModalData.open}
        type={CAE_ProjectModalData.type}
        sourceData={CAE_ProjectModalData.sourceData}
        onOk={onOkCAE_ProjectModal}
        onCancel={onCloseCAE_ProjectModal}
      />
      <CreateAndEditPromptModal
        open={CAE_PromptModalData.open}
        type={CAE_PromptModalData.type}
        sourceData={CAE_PromptModalData.sourceData}
        onOk={onOkCAE_PromptModal}
        onCancel={onCloseCAE_PromptModal}
      />
    </div>
  );
};

export default Prompt;
