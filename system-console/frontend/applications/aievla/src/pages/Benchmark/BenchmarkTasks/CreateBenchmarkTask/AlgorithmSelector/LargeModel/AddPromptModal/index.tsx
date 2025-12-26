import { useEffect, useMemo, useState, useRef } from 'react';

import _ from 'lodash';
import { message, Tree } from 'antd';
import intl from 'react-intl-universal';
import { DownOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import NoResult from '@/assets/images/empty.svg';
import SearchInput from '@/components/SearchInput';
import UniversalModal from '@/components/UniversalModal';

import * as promptServices from '@/services/prompt';

import { updateTreeData, onHandlePromptItemTypes, onHandleExpandKeys } from '../assistant';
import PromptDetails from './PromptDetails';

import './style.less';

const AddPromptModal = ({ onClose, onAddPrompt, treeNode, disabled }: any) => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<any[]>([]); // 展开项
  // 获取叶子节点时调接口更新treeData时expandedKeys也会重置,就会导致已经展开的数据又重新变为初始状态
  // 因此使用useRef，避免上述情况的发生
  const expandKeysRef = useRef<any>(); // 展开项
  const treeDataRef = useRef<any>();

  const [operated, setOperated] = useState(false); // 下拉框是否操作过
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<any>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    getPromptList();
    if (treeNode?.prompt_name) {
      setDetailsLoading(true);
      onSearch({ target: { value: treeNode?.prompt_name } }, 'expand');
    }
  }, []);

  /**
   * 确定
   */
  const onOk = () => {
    if (!selectedPrompt) {
      message.error(intl.get('benchmarkTask.atLeastOnePrompt'));
      return;
    }
    onAddPrompt(selectedPrompt);
  };

  /** 获取提示词分组 */
  const getPromptList = async () => {
    setOperated(false);
    try {
      const { res } =
        (await promptServices.promptProjectList({
          prompt_item_name: '',
          page: 1,
          size: 1000,
          is_management: true,
        })) || {};
      if (res) {
        onCommonParseToTreeData(res?.data);
      }
    } catch (err: any) {
      //
    }
  };

  /**
   * 异步加载树节点
   */
  const onLoadData = (data: any) => {
    return new Promise(async resolve => {
      if (data?.type !== 'category') return resolve(treeData);
      const resData = await onGetPromptList({
        prompt_item_id: data.pKey,
        prompt_item_type_id: data.key.split('-')[0],
        prompt_name: '',
        rule: 'create_time',
        order: 'desc',
        deploy: 'all',
        prompt_type: 'all',
        page: 1,
        size: 1000,
        is_management: true,
      });
      if (resData) {
        const children = onHandlePromptListTreeData(resData);
        const newTree = updateTreeData({
          treeDataSource: treeData,
          children,
          replaceKey: data.key.split('-')[0],
        });
        treeDataRef.current = [...newTree];
        setTreeData(newTree);
      }
      resolve(undefined);
    });
  };

  const selectedPrompt = useMemo(() => {
    return selectedNode;
  }, [selectedNode]);

  /** 搜索*/
  const onSearch = _.debounce(async (e: any, isExpand = false) => {
    const value = e?.target?.value;

    if (!value) {
      onClearExpand();
      getPromptList();
      return;
    }
    const resData =
      (await onGetPromptList({
        prompt_name: value,
        rule: 'create_time',
        order: 'desc',
        deploy: 'all',
        prompt_type: 'all',
        page: 1,
        size: 1000,
        is_management: true,
      })) || {};

    if (isExpand) {
      const searchData = resData?.[0];
      const expandKeys = [searchData?.prompt_item_id, searchData?.prompt_item_type_id];
      setExpandedKeys(expandKeys);
      expandKeysRef.current = expandKeys;
      setSelectedKeys([searchData?.prompt_id]);
      setSelectedNode(searchData);
    } else {
      const promptItemTypes = onHandlePromptItemTypes(resData);
      onCommonParseToTreeData(promptItemTypes, resData);
    }
    setDetailsLoading(false);
  }, 200);

  /**
   * 获取提示词分组
   */
  const onGetPromptList = async (data: any) => {
    try {
      const defaultBody = {
        prompt_name: '',
        rule: 'create_time',
        order: 'desc',
        deploy: 'all',
        prompt_type: 'all',
        page: 1,
        size: 1000,
        is_management: true,
        ...data,
      };
      const { res } = (await promptServices.promptList(defaultBody)) || {};
      return res?.data || [];
    } catch (err) {
      //
    }
  };

  /**
   * 整理树结构
   */
  const onCommonParseToTreeData = (data: any, PromptChildrenList?: any) => {
    const cloneDeepParese = _.cloneDeep(parseToTreeData(data));
    let tree = cloneDeepParese;
    let newExpandKeys = [];

    if (!_.isEmpty(PromptChildrenList)) {
      const children = onHandlePromptListTreeData(PromptChildrenList);
      const reduceChildren = _.reduce(
        _.cloneDeep(children),
        (pre: any, key: any) => {
          pre[key.sourceData.prompt_item_type_id] = key;
          return pre;
        },
        {},
      );
      const newTree = _.map(_.cloneDeep(tree), (item: any) => {
        _.map(item.children, (child: any) => {
          if (reduceChildren[child.key]) {
            child.children = [...(child.children || []), reduceChildren[child.key]];
          }
          return child;
        });
        return item;
      });
      tree = [...newTree];
      newExpandKeys = onHandleExpandKeys(cloneDeepParese);
      setExpandedKeys(newExpandKeys);
      expandKeysRef.current = newExpandKeys;
    }
    setTreeData(tree);
    treeDataRef.current = tree;
  };

  /**
   * 提示词分组树格式处理
   */
  const onHandlePromptListTreeData = (data: any) => {
    return _.map(data, item => {
      return {
        value: item?.prompt_name,
        valueId: item?.prompt_id,
        key: item?.prompt_id,
        title: (
          <div className='ad-ellipsis ad-w-100' style={{ maxWidth: 217, width: 217 }} title={item?.prompt_name} onClick={() => setSelectedNode(item)}>
            {item?.prompt_name}
          </div>
        ),
        isLeaf: true,
        type: 'prompt',
        sourceData: item,
        selected: true,
      };
    });
  };

  /**
   * 提示词项目列表数据转换成树组件数据
   * @param source 项目列表数据
   */
  const parseToTreeData = (source: any[]) => {
    return _.map(source, item => {
      const { prompt_item_id, prompt_item_name, prompt_item_types } = item;
      const children = _.map(prompt_item_types, category => {
        const { id, name } = category;
        return {
          key: id,
          value: `${id}-${prompt_item_id}`,
          pKey: prompt_item_id,
          type: 'category',
          title: (
            <div className='ad-ellipsis' style={{ maxWidth: 217, width: 217 }} onClick={() => onTreeExpand([`${id}`], true)} title={name}>
              {name}
            </div>
          ), // 显示设置为空, 否则浏览器tip会显示 --
          name,
          isLeaf: false,
          selectable: false,
          sourceData: {
            prompt_item_id,
            prompt_item_name,
            prompt_item_type_id: id,
            prompt_item_type_name: name,
          },
        };
      });
      return {
        key: prompt_item_id,
        value: prompt_item_id,
        type: 'project',
        title: (
          <div className='ad-ellipsis' style={{ maxWidth: 243, width: 243 }} title={prompt_item_name} onClick={() => onTreeExpand([`${prompt_item_id}`], true)}>
            {prompt_item_name}
          </div>
        ),
        name: prompt_item_name,
        selectable: false,
        children,
        sourceData: item,
      };
    });
  };

  /**
   * 展开
   */
  const onTreeExpand = (keys: any[], isPrevent = false) => {
    if (isPrevent && !_.isEmpty(expandKeysRef?.current)) {
      const isClose = _.includes(expandKeysRef?.current, `${keys?.[0]}`);
      const expandKeys = isClose ? _.filter(_.cloneDeep(expandKeysRef?.current), (item: any) => item !== `${keys?.[0]}`) : [...expandKeysRef?.current, ...keys];
      setExpandedKeys(expandKeys);
      expandKeysRef.current = expandKeys;
      return;
    }
    setExpandedKeys(keys);

    expandKeysRef.current = keys;
  };

  /**
   * 清空展开项
   */
  const onClearExpand = () => {
    const newUpdateKeys = [selectedNode?.prompt_item_id, selectedNode?.prompt_item_type_id];
    setExpandedKeys(newUpdateKeys);
    expandKeysRef.current = newUpdateKeys;
  };

  const onSelect = (keys: any) => {
    setSelectedKeys(keys);
  };

  return (
    <UniversalModal
      width={1000}
      title={intl.get('benchmarkTask.selectPrompt')}
      open
      onCancel={onClose}
      className='AddPromptModal'
      footerData={
        disabled
          ? null
          : [
              { label: intl.get('global.cancel'), onHandle: () => onClose() },
              { label: intl.get('global.ok'), type: 'primary', onHandle: onOk },
            ]
      }
    >
      <div className='ad-flex ad-w-100 ad-h-100'>
        <div className='AddPromptModal-tree ad-border-r'>
          <SearchInput
            prefix={<IconFont type='icon-sousuo' />}
            allowClear={true}
            placeholder={intl.get('benchmarkTask.searchPromptName')}
            className='ad-mb-5'
            onChange={(e: any) => {
              e.persist();
              onSearch(e);
            }}
          />
          {_.isEmpty(treeData) ? (
            <div className='noData-box'>
              <img src={NoResult} alt='nodata' />
              <div className={'admin-apiManagement-noData-text'}>{intl.get('global.noResult2')}</div>
            </div>
          ) : (
            <Tree
              style={{ width: 259 }}
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onSelect={onSelect}
              onExpand={(value: any) => onTreeExpand(value)}
              switcherIcon={<DownOutlined />}
              onFocus={() => {
                setTreeData([]);
                treeDataRef.current = [];
                expandKeysRef.current = [];
                setExpandedKeys([]);
                getPromptList();
              }}
              loadData={onLoadData}
              onClick={() => {
                if (!operated) return;
                getPromptList();
              }}
            />
          )}
        </div>
        <div className='AddPromptModal-detail ad-flex-item-full-width'>
          <PromptDetails prompt={selectedPrompt} detailsLoading={detailsLoading} />
        </div>
      </div>
    </UniversalModal>
  );
};

export default ({ open, ...restProps }: any) => {
  return open && <AddPromptModal {...restProps} />;
};
