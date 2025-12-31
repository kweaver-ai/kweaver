import { useState, useEffect, FC, useMemo } from 'react';
import intl from 'react-intl-universal';
import { DownOutlined } from '@ant-design/icons';
import { Modal, Tree, Empty, Tabs } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import api from '@/services/tool';
import HOOKS from '@/hooks';
import { IconFont, Input } from '@/web-library/common';
import styles from './index.module.less';
import enUS from './locale/en-us.json';
import zhCN from './locale/zh-cn.json';
import zhTW from './locale/zh-tw.json';

interface DataNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: DataNode[];
}

interface AddToolModalProps {
  onCancel: () => void;
  onOk: (params: { type: 'tool' | 'mcp'; tool_id?: string; tool_name: string; box_id?: string; box_name?: string; mcp_id?: string; mcp_name?: string }) => void;
  initialValue?: {
    type: 'tool' | 'mcp';
    tool_id?: string;
    tool_name?: string;
    box_id?: string;
    box_name?: string;
    mcp_id?: string;
    mcp_name?: string;
  };
}

const formatTool = (tool: any, parent: any) => ({
  title: tool.name,
  key: tool.tool_id,
  isLeaf: true,
  description: tool.description,
  detail: tool,
  parent,
});

const formatBox = (box: any) => ({
  title: box.box_name,
  key: box.box_id,
  isLeaf: false,
  description: box.box_desc,
  detail: box,
  children: box.tools?.map((child: any) => formatTool(child, box)),
});

const formatMcpTool = (tool: any, parent: any) => ({
  title: tool.name,
  key: tool.name,
  isLeaf: true,
  description: tool.description,
  detail: tool,
  parent,
});

const formatMcp = (mcp: any) => ({
  title: mcp.name,
  key: mcp.mcp_id,
  isLeaf: false,
  description: mcp.description,
  detail: mcp,
});

const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }

    return node;
  });

const AddToolModal: FC<AddToolModalProps> = ({ onCancel, onOk, initialValue }) => {
  const { message } = HOOKS.useGlobalContext();

  // 初始化国际化
  intl.load({ 'zh-cn': zhCN, 'en-us': enUS, 'zh-tw': zhTW });
  const getIntl = (key: string) => intl.get(`AddToolModal.${key}`);

  const [activeTab, setActiveTab] = useState<'tool' | 'mcp'>(initialValue?.type || 'tool');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(undefined);
  const [loadedKeys, setLoadedKeys] = useState<string[]>([]);
  const [mcpTreeData, setMcpTreeData] = useState<any[]>([]);
  const [mcpExpandedKeys, setMcpExpandedKeys] = useState<string[]>([]);
  const [mcpLoadedKeys, setMcpLoadedKeys] = useState<string[]>([]);
  const [mcpSelectedNode, setMcpSelectedNode] = useState<any>(undefined);
  const [searchValue, setSearchValue] = useState<string>('');

  // 在树形数据中查找节点
  const findNodeInTree = (tree: any[], key: string, targetKey: string): any => {
    for (const node of tree) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeInTree(node.children, key, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  // 获取工具箱列表(待后续补充懒加载)
  const fetchToolBoxList = async () => {
    try {
      const { data } = await api.getToolBoxList({ page: 1, page_size: 100, status: 'published', all: true });
      setTreeData(data.map((box: any) => formatBox(_.omit(box, 'tools'))));
      setExpandedKeys([]);
      setLoadedKeys([]);

      // 如果有初始值且是工具类型，需要展开对应的工具箱并选中工具
      if (initialValue?.type === 'tool' && initialValue.box_id) {
        // 展开对应的工具箱
        setExpandedKeys([initialValue.box_id]);
        setLoadedKeys([initialValue.box_id]);

        // 加载工具箱中的工具
        try {
          const { tools } = await api.getToolListByBoxId(initialValue.box_id, { page: 1, page_size: 100, status: 'enabled', all: true });
          const formatTools = tools.map((tool: any) => formatTool(tool, { box_id: initialValue.box_id, box_name: initialValue.box_name }));
          setTreeData((prevData) => updateTreeData(prevData, initialValue.box_id!, formatTools));

          // 查找并选中对应的工具
          if (initialValue.tool_id) {
            const selectedTool = formatTools.find((tool: any) => tool.key === initialValue.tool_id);
            if (selectedTool) {
              setSelectedNode(selectedTool);
            }
          }
        } catch (error) {
          console.error('加载工具箱工具失败:', error);
        }
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description);
      }
    }
  };

  const loadTool = async (node: any) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      const { key, children } = node;

      if (children) {
        resolve();
        return;
      }

      const { tools } = await api.getToolListByBoxId(key, { page: 1, page_size: 100, status: 'enabled', all: true });
      const formatTools = tools.map((tool: any) => formatTool(tool, node.detail));
      setTreeData(updateTreeData(treeData, key, formatTools));
      setLoadedKeys((prevKeys) => [...prevKeys, node.key]);
      resolve();
    });
  };

  const searchTool = async (searchValue: string) => {
    try {
      if (searchValue) {
        const { data } = await api.searchTool({ sort_by: 'create_time', sort_order: 'desc', tool_name: searchValue, status: 'enabled', all: true });

        setTreeData(data.map(formatBox));
        // 将搜索到的box展开
        const keys = data.map((box: any) => box.box_id);
        setExpandedKeys(keys);
        setLoadedKeys(keys);
      } else {
        fetchToolBoxList();
      }
    } catch {}
  };

  const debounceSearch = useMemo(() => _.debounce(searchTool, 300), []);

  // 获取MCP市场列表
  const fetchMcpMarketList = async (name?: string) => {
    try {
      const { data } = await api.getMcpMarketList({ page: 1, page_size: 100, status: 'published', name });
      setMcpTreeData((data || []).map(formatMcp));
      setMcpExpandedKeys([]);
      setMcpLoadedKeys([]);

      // 如果有初始值且是 MCP 类型，需要展开对应的 MCP 并选中工具
      if (initialValue?.type === 'mcp' && initialValue.mcp_id) {
        // 展开对应的 MCP
        setMcpExpandedKeys([initialValue.mcp_id]);
        setMcpLoadedKeys([initialValue.mcp_id]);

        // 加载 MCP 中的工具
        try {
          const { tools } = await api.getMcpTools(initialValue.mcp_id, { page: 1, page_size: 100, status: 'enabled', all: true });
          const formatTools = (tools || []).map((tool: any) => formatMcpTool(tool, { mcp_id: initialValue.mcp_id, name: initialValue.mcp_name }));
          setMcpTreeData((prevData) => updateTreeData(prevData, initialValue.mcp_id!, formatTools));

          // 查找并选中对应的工具
          if (initialValue.tool_name) {
            const selectedTool = formatTools.find((tool: any) => tool.key === initialValue.tool_name);
            if (selectedTool) {
              setMcpSelectedNode(selectedTool);
            }
          }
        } catch (error) {
          console.error('加载 MCP 工具失败:', error);
        }
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description);
      }
    }
  };

  // 加载MCP工具列表
  const loadMcpTools = async (node: any) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      const { key, children } = node;

      if (children) {
        resolve();
        return;
      }

      const { tools } = await api.getMcpTools(key, { page: 1, page_size: 100, status: 'enabled', all: true });
      const formatTools = (tools || []).map((tool: any) => formatMcpTool(tool, node.detail));
      setMcpTreeData(updateTreeData(mcpTreeData, key, formatTools));
      setMcpLoadedKeys((prevKeys) => [...prevKeys, node.key]);
      resolve();
    });
  };

  const debounceMcpSearch = useMemo(() => _.debounce((value: string) => fetchMcpMarketList(value), 300), []);

  useEffect(() => {
    if (activeTab === 'tool') {
      fetchToolBoxList();
    } else {
      fetchMcpMarketList();
    }
  }, [activeTab]);

  return (
    <Modal
      open
      centered
      maskClosable={false}
      title={getIntl('title')}
      width={800}
      okButtonProps={{ disabled: activeTab === 'tool' ? !selectedNode : !mcpSelectedNode }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
      onCancel={onCancel}
      onOk={() => {
        if (activeTab === 'tool') {
          const {
            parent: { box_id, box_name },
            detail: { tool_id, name },
          } = selectedNode;
          onOk({ type: activeTab, box_id, box_name, tool_id, tool_name: name });
        } else {
          const {
            parent: { mcp_id, name: mcp_name },
            detail: { name },
          } = mcpSelectedNode;
          onOk({ type: activeTab, mcp_id, mcp_name, tool_name: name });
        }
      }}
    >
      <div className={styles['add-tool-modal-root']}>
        <Tabs
          activeKey={activeTab}
          onChange={(key: any) => {
            setActiveTab(key);
            setSearchValue('');
          }}
          items={[
            {
              key: 'tool',
              label: getIntl('tool'),
              children: (
                <>
                  <Input.Search
                    placeholder={getIntl('searchToolPlaceholder')}
                    allowClear
                    value={searchValue}
                    onChange={(e: any) => {
                      setSearchValue(e.target.value);
                      debounceSearch(e.target.value);
                    }}
                  />
                  <Tree
                    showLine
                    switcherIcon={<DownOutlined />}
                    height={422}
                    treeData={treeData}
                    loadData={loadTool}
                    expandedKeys={expandedKeys}
                    loadedKeys={loadedKeys}
                    selectedKeys={selectedNode?.key ? [selectedNode.key] : []}
                    titleRender={(node) => (
                      <div className={styles['tree-title-line']}>
                        {!node.isLeaf && <IconFont type="icon-dip-color-suanzitool" style={{ fontSize: 22 }} />}
                        <div>
                          <div className={classNames(styles['tree-title'], styles['overflow-hidden'])} title={node.title}>
                            {node.title}
                          </div>
                          <div className={classNames(styles['overflow-hidden'], styles['tree-desc'])} title={node.description}>
                            {node.description}
                          </div>
                        </div>
                      </div>
                    )}
                    onSelect={(__, { node }) => {
                      if (!node.isLeaf) {
                        if (!node.expanded) {
                          setExpandedKeys((prev) => [...prev, node.key]);
                        } else {
                          setExpandedKeys((prev) => prev.filter((item) => item !== node.key));
                        }
                      } else {
                        setSelectedNode(node);
                      }
                    }}
                    onExpand={(keys) => setExpandedKeys(keys as string[])}
                  />
                  {treeData.length === 0 && <Empty style={{ marginTop: 20 }} />}
                </>
              ),
            },
            {
              key: 'mcp',
              label: getIntl('mcp'),
              children: (
                <>
                  <Input.Search
                    placeholder={getIntl('searchMcpPlaceholder')}
                    allowClear
                    value={searchValue}
                    onChange={(e: any) => {
                      setSearchValue(e.target.value);
                      debounceMcpSearch(e.target.value);
                    }}
                  />
                  <Tree
                    showLine
                    switcherIcon={<DownOutlined />}
                    height={422}
                    treeData={mcpTreeData}
                    loadData={loadMcpTools}
                    expandedKeys={mcpExpandedKeys}
                    loadedKeys={mcpLoadedKeys}
                    selectedKeys={mcpSelectedNode?.key ? [mcpSelectedNode.key] : []}
                    titleRender={(node) => (
                      <div className={styles['tree-title-line']}>
                        {!node.isLeaf && <IconFont type="icon-dip-color-suanzi" style={{ fontSize: 22 }} />}
                        <div>
                          <div className={classNames(styles['tree-title'], styles['overflow-hidden'])} title={node.title}>
                            {node.title}
                          </div>
                          <div className={classNames(styles['overflow-hidden'], styles['tree-desc'])} title={node.description}>
                            {node.description}
                          </div>
                        </div>
                      </div>
                    )}
                    onSelect={(__, { node }) => {
                      if (!node.isLeaf) {
                        if (!node.expanded) {
                          setMcpExpandedKeys((prev) => [...prev, node.key]);
                        } else {
                          setMcpExpandedKeys((prev) => prev.filter((item) => item !== node.key));
                        }
                      } else {
                        setMcpSelectedNode(node);
                      }
                    }}
                    onExpand={(keys) => setMcpExpandedKeys(keys as string[])}
                  />
                  {mcpTreeData.length === 0 && <Empty style={{ marginTop: 20 }} />}
                </>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default AddToolModal;
