import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { message, Popover } from 'antd';
import SearchInput from '../../SearchInput';
import AdTree from '@/components/AdTree';
import LoadingMask from '@/components/LoadingMask';
import UniversalModal from '@/components/UniversalModal';
import { type AdTreeDataNode, adTreeUtils } from '@/utils/handle-function';
import { getToolBoxListFromMarks, getBoxToolList, getGlobalMarketToolList } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useLatestState } from '@/hooks';
import ToolIcon from '@/assets/images/tool-mcp.svg';
import NoResultIcon from '@/assets/images/noResult.svg';
import { getInputParamsFromOpenAPISpec } from '../utils';
import './style.less';

const ToolModal = ({ onCancel, value, onConfirm }: any) => {
  const microWidgetProps = useMicroWidgetProps();
  const [treeProps, setTreeProps, getTreeProps] = useLatestState({
    treeData: [] as AdTreeDataNode[],
    checkedKeys: [] as any,
    checkedNodes: [] as AdTreeDataNode[],
    loadedKeys: [] as any,
    expandedKeys: [] as any,
    // 搜索用到的属性
    searchText: '' as string,
  });

  const [searchTreeProps, setSearchTreeProps, getSearchTreeProps, resetSearchTreeProps] = useLatestState({
    treeData: [] as AdTreeDataNode[],
    expandedKeys: [] as any,
    checkedKeys: [] as any,
    checkedNodes: [] as AdTreeDataNode[],
    loadedKeys: [] as any,
  });

  const [loading, setLoading] = useState(true);
  const agentBoxId = 'built-in-agent';
  // 缓存工具箱信息，用于后续获取工具时使用
  const [toolBoxCache, setToolBoxCache] = useState<Record<string, any>>({});

  useEffect(() => {
    getTooBox();
  }, []);

  const getTooBox = async () => {
    try {
      const response = await getToolBoxListFromMarks({
        page: 1,
        all: true,
        status: 'published',
      });
      // const response = await getToolBoxListNew({
      //   page: 1,
      //   page_size: 100,
      //   sort_by: 'create_time',
      //   sort_order: 'desc',
      //   status: 'published', // 只获取已发布的工具箱
      // });

      if (response && response.data) {
        // 将新接口返回的数据转换为组件期望的格式
        const toolBoxData = response.data.map((item: any) => ({
          ...item,
          type: 'tool-box',
          // 兼容旧字段名
          box_id: item.box_id,
          box_name: item.box_name,
          box_desc: item.box_desc,
          box_svc_url: item.box_svc_url,
          create_time: item.create_time,
          update_time: item.update_time,
          create_user: item.create_user,
          update_user: item.update_user,
        }));

        // 缓存工具箱信息
        const cache: Record<string, any> = {};
        toolBoxData.forEach((item: any) => {
          cache[item.box_id] = item;
        });
        setToolBoxCache(cache);

        let treeData = adTreeUtils.createAdTreeNodeData(toolBoxData, {
          titleField: 'box_name',
          keyField: 'box_id',
          isLeaf: false,
        });

        if (value) {
          const checkedKeys = value.filter((item: any) => item.box_id !== agentBoxId).map((item: any) => item.tool_id);
          const expandedKeys = _.uniq(value.map((item: any) => item.box_id));
          const toolBoxNodes = treeData.filter(item => expandedKeys.includes(item.key));

          for (let i = 0; i < toolBoxNodes.length; i++) {
            const toolBoxNode = toolBoxNodes[i];
            const childTreeData = await getToolTreeNode(toolBoxNode);
            if (childTreeData) {
              treeData = adTreeUtils.addTreeNode(treeData, childTreeData as any);
            }
          }

          const checkedNodes = adTreeUtils.getTreeNodeByKey(treeData, checkedKeys);

          setTreeProps(prevState => ({
            ...prevState,
            checkedKeys,
            expandedKeys,
            loadedKeys: expandedKeys,
            treeData,
            checkedNodes,
          }));
          setLoading(false);
          return;
        }

        setLoading(false);
        setTreeProps(prevState => ({
          ...prevState,
          treeData,
        }));
      }
    } catch (error: any) {
      setLoading(false);
      const { Description, ErrorDetails } = error?.response || error?.data || error || {};
      (ErrorDetails || Description) && message.error(ErrorDetails || Description);
    }
  };

  const selectedTools = useMemo(() => {
    const flatTreeData = adTreeUtils.flatTreeData(treeProps.treeData);
    const toolBox = treeProps.checkedNodes.filter(item => item.sourceData?.type === 'tool-box');
    let tools = treeProps.checkedNodes.filter(item => item.sourceData?.type === 'tool');
    if (toolBox.length > 0) {
      const toolBoxKeys = toolBox.map(item => item.key);
      flatTreeData.forEach(item => {
        if (toolBoxKeys.includes(item.parentKey!) && !treeProps.searchText) {
          tools = [...tools, item];
        }
      });
    }

    tools = [...tools];
    return _.uniqBy(tools, 'key');
  }, [treeProps.treeData, treeProps.checkedNodes]);

  const onOk = async () => {
    if (selectedTools.length === 0) {
      message.error('请添加工具');
      return;
    }

    const newValue = selectedTools.map(item => {
      const tool_type = item.sourceData?.type === 'mcp-tool' ? 'mcp' : item.sourceData?.type || 'agent';
      const tempTool: any = {
        tool_type,
        tool_id: item.key,
        tool_name: item.title,
        box_id: item.sourceData?.box_id,
        box_name: item.sourceData?.box_name,
        description: item.sourceData?.tool_desc,
        use_rule: item.sourceData?.use_rule,
      };

      return tempTool;
    });

    onConfirm(
      newValue.map(item => {
        return item;
      })
    );
  };

  const renderParam = (param: any) => {
    return (
      <div style={{ width: 428, padding: '16px', maxHeight: '400px', overflow: 'auto' }}>
        {param?.map((item: any, index: number) => (
          <div
            key={item.input_name}
            className={classNames('dip-font-12', {
              'dip-mb-16': index !== param.length - 1,
            })}
          >
            <div>
              <span className="dip-c-bold">{item.input_name}</span>
              <span className="dip-ml-8 dip-c-text-lower">{item.input_type}</span>
              {item.required && (
                <span className="dip-ml-8" style={{ color: '#ff7a45' }}>
                  必填
                </span>
              )}
            </div>
            {item.input_desc && (
              <div className="dip-ellipsis-2 dip-mt-8 dip-c-text-lower" title={item.input_desc}>
                {item.input_desc}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const titleRender = (nodeData: AdTreeDataNode) => {
    const desc = nodeData.sourceData?.box_desc || nodeData.sourceData?.tool_desc;

    // 根据节点类型确定图标
    let IconComponent = null;
    if (nodeData.sourceData?.type === 'tool-box') {
      IconComponent = ToolIcon;
    }

    return (
      <span className="dip-flex-align-center dip-mt-8">
        {IconComponent && <IconComponent style={{ width: '32px', height: '32px', minWidth: '32px' }} />}
        <span className="dip-flex-column dip-ml-8">
          <span className="dip-ellipsis" title={nodeData.title}>
            {nodeData.title}
          </span>
          <span style={{ fontSize: 12 }} className="dip-c-text-lower dip-ellipsis" title={desc}>
            {desc || <span className="dip-c-subtext">暂无描述</span>}
          </span>
          {(nodeData.sourceData?.type === 'tool' || nodeData.sourceData?.type === 'mcp-tool') && (
            <div className="dip-flex dip-mt-8" style={{ gap: 8 }}>
              {nodeData.sourceData?.tool_input?.slice(0, 3).map((inputItem: any) => (
                <span
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                  title={inputItem.input_name}
                  className="dip-pl-8 dip-pr-8 dip-font-12"
                  key={inputItem.input_name}
                >
                  {inputItem.input_name}
                </span>
              ))}
              {nodeData.sourceData?.tool_input?.length > 0 && (
                <Popover
                  overlayClassName="ToolModal-param-tip"
                  content={renderParam(nodeData.sourceData?.tool_input)}
                  trigger={['hover']}
                  destroyOnHidden
                  placement="bottomLeft"
                  getPopupContainer={() => microWidgetProps?.container}
                >
                  <span className="dip-c-link dip-font-12">参数</span>
                </Popover>
              )}
            </div>
          )}
        </span>
      </span>
    );
  };

  const getToolTreeNode = async (nodeData: AdTreeDataNode) => {
    try {
      const boxId = nodeData.key as string;
      const response = await getBoxToolList(boxId, {
        page: 1,
        page_size: 100,
        status: 'enabled', // 只获取启用的工具
        all: true, // 获取所有工具
      });

      if (response && response.tools) {
        // 从缓存中获取工具箱信息
        const toolBoxInfo = toolBoxCache[boxId] || nodeData.sourceData;
        const global_headers = toolBoxInfo.global_headers || {};

        const headers = Object.keys(global_headers).map(headerItem => ({
          input_name: headerItem,
          input_type: 'string',
        }));

        // 将新接口返回的工具数据转换为组件期望的格式
        const toolData = response.tools.map((item: any) => {
          const allInputs = getInputParamsFromOpenAPISpec(item.metadata?.api_spec);

          return {
            // 新接口字段映射到旧格式
            tool_id: item.tool_id,
            tool_name: item.name,
            tool_desc: item.description,
            tool_path: item.metadata?.path || '',
            tool_method: item.metadata?.method || 'GET',
            tool_input: allInputs,
            // 兼容字段
            type: 'tool',
            box_name: nodeData.title,
            box_id: nodeData.key as string,
            create_time: item.create_time,
            update_time: item.update_time,
            is_build_in: false,
            use_rule: item?.use_rule,
          };
        });

        // 合并headers到tool_input
        const finalToolData = toolData.map((tool: any) => ({
          ...tool,
          tool_input: _.uniqBy([...tool.tool_input, ...headers], 'input_name'),
        }));

        const childTreeData = adTreeUtils.createAdTreeNodeData(finalToolData, {
          titleField: 'tool_name',
          keyField: 'tool_id',
          parentKey: nodeData.key as string,
          keyPath: nodeData.keyPath,
        });
        return childTreeData;
      }
    } catch (error: any) {
      const { Description, ErrorDetails } = error?.response || error?.data || error || {};
      (ErrorDetails || Description) && message.error(ErrorDetails || Description);
      return false;
    }
  };

  const loadData = (nodeData: AdTreeDataNode) =>
    new Promise(resolve => {
      const getTreeData = async () => {
        const childTreeData = await getToolTreeNode(nodeData);

        if (childTreeData) {
          const treeData = adTreeUtils.addTreeNode(treeProps.treeData, childTreeData as any);
          setTreeProps(prevState => ({
            ...prevState,
            treeData,
          }));
          resolve(true);
        } else {
          resolve(false);
        }
      };
      getTreeData();
    });

  const handleSearch = async (e: any) => {
    const value = e.target.value;

    if (value) {
      try {
        // 使用新接口进行搜索
        const response = await getGlobalMarketToolList({
          tool_name: value, // 按工具箱名称搜索
          all: true,
          sort_by: 'create_time',
          sort_order: 'desc',
          status: 'enabled', // 只获取启用的工具
        });

        if (response && response.data) {
          const toolBoxData = response.data.map((item: any) => ({
            ...item,
            type: 'tool-box',
            // 保持字段兼容性
            box_id: item.box_id,
            box_name: item.box_name,
            box_desc: item.box_desc,
            box_svc_url: item.box_svc_url,
            create_time: item.create_time,
            update_time: item.update_time,
            create_user: item.create_user,
            update_user: item.update_user,
          }));

          const treeData = adTreeUtils.createAdTreeNodeData(toolBoxData, {
            titleField: 'box_name',
            keyField: 'box_id',
            isLeaf: false,
          });

          const boxIds = response.data.map((item: any) => item.box_id);

          // 为每个工具箱加载工具
          for (const nodeData of treeData) {
            const toolBoxInfo = nodeData?.sourceData;
            const toolData = toolBoxInfo?.tools.map((item: any) => {
              const allInputs = getInputParamsFromOpenAPISpec(item.metadata?.api_spec);
              return {
                // 新接口字段映射到旧格式
                tool_id: item.tool_id,
                tool_name: item.name,
                tool_desc: item.description,
                tool_path: item.metadata?.path || '',
                tool_method: item.metadata?.method || 'GET',
                tool_input: allInputs,
                // 兼容字段
                type: 'tool',
                box_name: nodeData.title,
                box_id: nodeData.key as string,
                create_time: item.create_time,
                update_time: item.update_time,
                is_build_in: false,
                use_rule: item?.use_rule,
              };
            });

            const global_headers = toolBoxInfo.global_headers || {};
            const headers = Object.keys(global_headers).map(headerItem => ({
              input_name: headerItem,
              input_type: 'string',
            }));
            // 合并headers到tool_input
            const finalToolData = toolData.map((tool: any) => ({
              ...tool,
              tool_input: _.uniqBy([...tool.tool_input, ...headers], 'input_name'),
            }));
            const childTreeData = adTreeUtils.createAdTreeNodeData(finalToolData, {
              titleField: 'tool_name',
              keyField: 'tool_id',
              parentKey: nodeData.key as string,
              keyPath: nodeData.keyPath,
            });
            nodeData.children = childTreeData;
          }

          // 获取之前选中的节点
          const previousCheckedKeys = getTreeProps().checkedKeys;
          const previousCheckedNodes = getTreeProps().checkedNodes;

          setTreeProps(prevState => ({
            ...prevState,
            searchText: value,
          }));
          setSearchTreeProps(prevState => ({
            ...prevState,
            treeData: treeData,
            expandedKeys: boxIds,
            loadedKeys: boxIds,
            // 保留所有之前选中的节点状态
            checkedKeys: previousCheckedKeys,
            checkedNodes: previousCheckedNodes,
          }));
        }
      } catch (error) {
        console.error('搜索失败:', error);
        // 搜索失败时显示空结果
        setTreeProps(prevState => ({
          ...prevState,
          searchText: value,
        }));
        setSearchTreeProps(prevState => ({
          ...prevState,
          treeData: [],
          expandedKeys: [],
          loadedKeys: [],
          checkedKeys: getTreeProps().checkedKeys,
          checkedNodes: getTreeProps().checkedNodes,
        }));
      }
    } else {
      setTreeProps(prevState => ({
        ...prevState,
        searchText: '',
      }));
      resetSearchTreeProps();
    }
  };

  const renderToolTree = () => {
    return (
      <div className="dip-h-100 dip-flex-column" style={{ marginTop: '16px' }}>
        <SearchInput style={{ width: '100%' }} placeholder="搜索工具名称" onChange={handleSearch} debounce />
        <div className="dip-flex-item-full-height" style={{ overflowY: 'auto' }}>
          {treeProps.searchText && searchTreeProps.treeData.length == 0 ? (
            <div className="dip-column-center">
              {/* <img src={require('@/assets/images/noResult.svg').default} alt="nodata" /> */}
              <NoResultIcon />
              <div className="dip-mt-8 dip-c-text-lower">暂无描述</div>
            </div>
          ) : (
            <AdTree
              className="ToolModal-tree"
              expandAction={false}
              selectable={false}
              treeData={treeProps.searchText ? searchTreeProps.treeData : treeProps.treeData}
              checkable
              titleRender={titleRender as any}
              checkedKeys={treeProps.checkedKeys}
              onCheck={(checkedKeys, { node, checkedNodes }) => {
                if (!treeProps.searchText && (node as AdTreeDataNode).sourceData?.type === 'tool-box') {
                  const loadedKeys = getTreeProps().loadedKeys;
                  if (!loadedKeys.includes(node.key)) {
                    // 树节点的展开会自动触发loadData方法dd
                    setTreeProps(prevState => ({
                      ...prevState,
                      expandedKeys: [...prevState.expandedKeys, node.key],
                    }));
                  }
                }

                // 获取之前选中的节点
                const previousCheckedNodes = getTreeProps().checkedNodes;

                // 在搜索状态下，合并之前选中的节点
                if (treeProps.searchText) {
                  // 获取搜索结果树数据
                  const searchTreeData = getSearchTreeProps().treeData;
                  // 找出不在搜索结果中的之前选中的节点
                  const previousNodesNotInSearch = previousCheckedNodes.filter(
                    prevNode =>
                      !searchTreeData.some(
                        (searchNode: AdTreeDataNode) =>
                          searchNode.key === prevNode.key ||
                          searchNode.children?.some((child: AdTreeDataNode) => child.key === prevNode.key)
                      )
                  );

                  // 合并当前选中的节点和之前选中的节点
                  let mergedCheckedKeys = Array.isArray(checkedKeys)
                    ? [...checkedKeys, ...previousNodesNotInSearch.map(node => node.key)]
                    : checkedKeys;
                  let mergedCheckedNodes: any = [...(checkedNodes as AdTreeDataNode[]), ...previousNodesNotInSearch];

                  mergedCheckedNodes = _.filter(mergedCheckedNodes, (item: any) => {
                    if (!item?.isLeaf) mergedCheckedKeys = _.filter(mergedCheckedKeys, key => key !== item.value);
                    return item?.isLeaf;
                  });

                  setTreeProps(prevState => {
                    const data = {
                      ...prevState,
                      checkedKeys: mergedCheckedKeys,
                      checkedNodes: mergedCheckedNodes,
                    };
                    return data;
                  });
                  setSearchTreeProps(prevState => {
                    const data = {
                      ...prevState,
                      checkedKeys: mergedCheckedKeys,
                      checkedNodes: mergedCheckedNodes,
                    };
                    return data;
                  });
                } else {
                  setTreeProps(prevState => ({
                    ...prevState,
                    checkedKeys,
                    checkedNodes: checkedNodes as AdTreeDataNode[],
                  }));
                }
              }}
              loadData={loadData as any}
              loadedKeys={treeProps.searchText ? searchTreeProps.loadedKeys : treeProps.loadedKeys}
              onLoad={loadedKeys => {
                setTreeProps(prevState => ({ ...prevState, loadedKeys }));
              }}
              expandedKeys={treeProps.searchText ? searchTreeProps.expandedKeys : treeProps.expandedKeys}
              onExpand={expandedKeys => {
                if (treeProps.searchText) {
                  setSearchTreeProps(prevState => ({ ...prevState, expandedKeys }));
                } else {
                  setTreeProps(prevState => ({ ...prevState, expandedKeys }));
                }
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <UniversalModal
      width={843}
      onCancel={onCancel}
      className="ToolModal"
      open
      title={'添加工具'}
      footerData={[
        { label: '确定', type: 'primary', onHandle: onOk, isDisabled: loading },
        { label: '取消', onHandle: () => onCancel() },
      ]}
      footerExtra={
        <span>
          已选择{selectedTools.length}个工具
          {selectedTools.length > 30 ? (
            <span style={{ color: 'red' }}> 选择的工具不能超过30个</span>
          ) : (
            <> (您还可以选择{30 - selectedTools.length}个工具)</>
          )}
        </span>
      }
    >
      <div className="dip-w-100" style={{ minHeight: '400px' }}>
        {loading ? (
          <div className="dip-position-r" style={{ height: 300 }}>
            <LoadingMask loading />
          </div>
        ) : (
          <>{renderToolTree()}</>
        )}
      </div>
    </UniversalModal>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <ToolModal {...restProps} />;
};
