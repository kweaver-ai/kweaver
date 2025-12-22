import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import _, { uniqBy } from 'lodash';
import intl from 'react-intl-universal';
import {
  Collapse,
  Button,
  Space,
  List,
  Tooltip,
  Popover,
  TreeDataNode,
  Modal,
  InputNumber,
  Row,
  Col,
  Slider,
} from 'antd';
import {
  QuestionCircleOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DownOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { apis } from '@aishu-tech/components/dist/dip-components.min';
import { FileTypeIcon } from '@/utils/doc';
import KnEntryIcon from '@/assets/icons/kn-entry.svg';
import DocLib from '@/assets/icons/doclib.svg';
import AnyShare from '@/assets/icons/anyshare.svg';
import NetworkIcon from '@/assets/icons/network.svg';
import KnowledgeIcon from '@/assets/icons/knowledge.svg';
import { getMetricInfoByIds, getDataDictInfoByIds } from '@/apis/data-model';
import {
  getKnowledgeSourceList,
  getGraphByKnw,
  getKnowledgeSourceDetail,
  getKnExperimentDetailsById,
} from '@/apis/knowledge-data';
import { useAgentConfig } from '../../AgentConfigContext';
import KnEntrySelector from '@/components/KnEntrySelector';
import KnowledgeNetworkSelector from '@/components/KnowledgeNetworkSelect/KnowledgeNetworkSelector';
import KnowledgeNetworkPreSelector from '@/components/KnowledgeNetworkSelect/KnowledgeNetworkPreSelector';
import AnyShareSelector from '@/components/AnyShareSelector';
import KnowledgeNetworkResultRange from '@/components/KnowledgeNetworkSelect/KnowledgeNetworkResultRange';
import DipIcon from '@/components/DipIcon';
import MetricSelector from '@/components/MetricSelector';
import SectionPanel from '../../common/SectionPanel';
import styles from '../ConfigSection.module.less';
import KnowledgeNetworkExperimentalSelect from '@/components/KnowledgeNetworkExperimentalSelect';
import { useDeepCompareEffect } from '@/hooks';
const { Panel } = Collapse;

// 文档高级配置接口
interface DocAdvancedConfig {
  document_threshold: number;
  retrieval_slices_num: number;
  max_slice_per_cite: number;
  rerank_topk: number;
  slice_head_num: number;
  slice_tail_num: number;
  documents_num: number;
  retrieval_max_length: number;
}

// 知识网络高级配置接口
interface KgAdvancedConfig {
  graph_rag_topk: number;
  long_text_length: number;
  reranker_sim_threshold: number;
  text_match_entity_nums: number;
  vector_match_entity_nums: number;
  retrieval_max_length: number;
}

// 默认文档配置
const defaultDocConfig: DocAdvancedConfig = {
  document_threshold: -5.5,
  retrieval_slices_num: 150,
  max_slice_per_cite: 16,
  rerank_topk: 15,
  slice_head_num: 0,
  slice_tail_num: 2,
  documents_num: 8,
  retrieval_max_length: 12288,
};

// 默认知识网络配置
const defaultKgConfig: KgAdvancedConfig = {
  graph_rag_topk: 25,
  long_text_length: 256,
  reranker_sim_threshold: -5.5,
  text_match_entity_nums: 60,
  vector_match_entity_nums: 60,
  retrieval_max_length: 12288,
};

interface Document {
  name: string;
  path: string;
  source: string;
  ds_id: string; // 数据源ID，用于区分文档来源
  type?: 'folder' | 'file'; // 仅外置AS数据源，用于区分文件、文件夹
}

interface KnowledgeSourceProps {
  style?: React.CSSProperties;
}

const KnowledgeSource: React.FC<KnowledgeSourceProps> = () => {
  const { state, actions } = useAgentConfig();

  // 检查是否可编辑知识来源-业务知识网络配置
  const canEditDataSourceKg = actions.canEditField('data_source.kg');
  // 检查是否可编辑知识来源-业务知识网络实验版配置
  const canEditDataSourceKgExperiment = actions.canEditField('data_source.knowledge_network');
  // 检查是否可编辑知识来源-文档高级配置
  const canEditDataSourceDoc = actions.canEditField('data_source.doc');
  // 检查是否可编辑知识来源-指标配置
  const canEditDataSourceMetric = actions.canEditField('data_source.metric');
  // 检查是否可编辑知识来源-知识条目配置
  const canEditDataSourceKnEntry = actions.canEditField('data_source.kn_entry');

  const [documents, setDocuments] = useState<Document[]>(() => {
    // 从所有数据源中合并文档，并添加ds_id信息
    const allDocs: Document[] = [];
    if (state.config?.data_source?.doc) {
      state.config.data_source.doc.forEach(docSource => {
        if (docSource.fields) {
          docSource.fields.forEach(field => {
            allDocs.push({
              ...field,
              ds_id: docSource.ds_id.toString(),
            });
          });
        }
      });
    }
    return allDocs;
  });

  const [activeKey, setActiveKey] = useState<string[]>([]); // 手风琴的激活面板key
  const [isExpanded, setIsExpanded] = useState(true);
  const [documentPopoverVisible, setDocumentPopoverVisible] = useState(false);
  const [knowledgeNetworkPopoverVisible, setKnowledgeNetworkPopoverVisible] = useState(false);
  const [knowledgeNetworkResultRangeVisible, setKnowledgeNetworkResultRangeVisible] = useState(false);
  const [preSelectorVisible, setPreSelectorVisible] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [resultRangeOptions, setResultRangeOptions] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);

  // 文档设置弹窗相关状态
  const [docSettingsVisible, setDocSettingsVisible] = useState(false);
  const [docConfig, setDocConfig] = useState<DocAdvancedConfig>(
    state.config?.data_source?.advanced_config?.doc || defaultDocConfig
  );

  // 知识网络设置弹窗相关状态
  const [kgSettingsVisible, setKgSettingsVisible] = useState(false);
  const [kgConfig, setKgConfig] = useState<KgAdvancedConfig>(
    state.config?.data_source?.advanced_config?.kg || defaultKgConfig
  );

  // AnyShare选择器状态
  const [anyShareSelectorVisible, setAnyShareSelectorVisible] = useState(false);

  const selectFnRef = useRef<any>(null);

  const kgData = useRef<any>({});
  const [networkName, setNetworkName] = useState<any>({});

  // 指标选择弹窗状态
  const [metricSelectorVisible, setMetricSelectorVisible] = useState<boolean>(false);
  // 指标：id 到 name 映射对象
  const [metricNames, setMetricNames] = useState<Record<string, string>>({});
  // 知识条目选择弹窗状态
  const [knEntrySelectorVisible, setKnEntrySelectorVisible] = useState<boolean>(false);
  // 知识条目：id 到 name 映射对象
  const [knEntryNames, setKnEntryNames] = useState<Record<string, string>>({});
  // 业务知识网络实验版选择弹窗状态
  const [knowledgeNetworkExperimentalOpen, setKnowledgeNetworkExperimentalOpen] = useState(false);
  // 业务知识网络实验版：id 到 name 映射对象
  const [knExperimentNames, setKnExperimentNames] = useState<Record<string, string>>({});

  // 无法获取到name的kg_id数组（无效的）
  const invalidKgIds = useRef<string[]>([]);
  // 无法获取到name的metric数组（无效的）
  const invalidMetricIds = useRef<string[]>([]);
  const metricNamesRef = useRef<Record<string, string>>({});
  // 无法获取到name的knEntry数组（无效的）
  const inValidKnEntryIds = useRef<string[]>([]);
  const knEntryNamesRef = useRef<Record<string, string>>({});
  // 无法获取到name的业务知识网络实验版kg_id数组（无效的）
  const invalidKgExperimentIds = useRef<string[]>([]);

  const getKgData = async () => {
    const kgs = state.config?.data_source?.kg;
    if (!kgs?.length) return;

    state.config?.data_source?.kg?.forEach(async item => {
      try {
        const { res } = await getKnowledgeSourceDetail({ id: item.kg_id });
        kgData.current = { ...kgData.current, [item!.kg_id]: res?.graph_name };
      } catch {
        // 请求失败（无法获取到业务知识网络的name）
        invalidKgIds.current = [...invalidKgIds.current, item!.kg_id];
      } finally {
        setNetworkName(kgData.current);
        actions.updateDataSourceInvalid('kg', invalidKgIds.current.length > 0);
      }
    });
  };

  useEffect(() => {
    getKgData();
  }, []);

  const initializeTreeData = async () => {
    try {
      const kgId = selectedNetworkId;
      if (!kgId) return;

      // 1. 根据 kg_id 获取知识图谱详情，从中获取 knw_id
      const kgDetail = await getKnowledgeSourceDetail({ id: kgId });
      const knwId = kgDetail?.res?.knw_id;

      if (!knwId) return;

      // 2. 根据 knw_id 获取该空间下的所有知识网络
      const networksResponse = await getGraphByKnw({
        knw_id: knwId,
        page: 1,
        size: 10000,
        order: 'desc',
        rule: 'create',
        filter: 'all',
        name: '',
      });

      // const networks = networksResponse?.res?.df?.filter(item => item.taskstatus === 'normal') || [];
      const networks = networksResponse?.res?.df || [];

      // 3. 构建完整的树结构
      const spaceDetail = await getKnowledgeSourceList({
        page: 1,
        size: 1000,
        rule: 'update',
        order: 'desc',
      });

      const currentSpace = spaceDetail?.res?.df?.find(space => space.id.toString() === knwId.toString());

      if (currentSpace) {
        const treeStructure = [
          {
            key: currentSpace.id.toString(),
            value: currentSpace.id.toString(),
            title: currentSpace.knw_name,
            selectable: false,
            isLeaf: false,
            children: networks.map((network: any) => ({
              key: network.id.toString(),
              value: network.id.toString(),
              title: network.name,
              selectable: true,
              isLeaf: true,
            })),
          },
        ];

        setTreeData(treeStructure);
      }
    } catch (error) {
      console.error('Failed to initialize tree data:', error);
    }
  };

  useEffect(() => {
    if (selectedNetworkId) {
      initializeTreeData();
    }
  }, [selectedNetworkId]);

  const handleDeleteDocument = (source: string) => {
    const updatedItems = documents.filter(document => document.source !== source);
    setDocuments(updatedItems);

    if (updatedItems.length > 0) {
      // 重新组织数据源配置
      const currentDocConfig = state.config?.data_source?.doc || [];
      const updatedDocConfig = currentDocConfig
        .map(docSource => {
          const sourceDocuments = updatedItems.filter(doc => doc.ds_id === docSource.ds_id);
          return {
            ...docSource,
            fields: sourceDocuments.map(doc => ({
              name: doc.name,
              path: doc.path,
              source: doc.source,
            })),
          };
        })
        .filter(docSource => docSource.fields.length > 0); // 过滤掉没有文档的数据源

      actions.updateSpecificField('config.data_source.doc', updatedDocConfig);
    } else {
      actions.updateMultipleFields({
        'config.data_source.doc': [],
        'config.data_source.advanced_config.doc': null,
      });
    }
  };

  const handleDeleteKnowledgeNetwork = (id: string) => {
    setKgConfig(defaultKgConfig);
    const newKg = _.filter(state.config?.data_source?.kg, item => item.kg_id !== id);
    if (newKg.length === 0) {
      actions.updateMultipleFields({
        'config.data_source.kg': newKg,
        'config.data_source.advanced_config.kg': null,
      });
      invalidKgIds.current = [];
    } else {
      actions.updateMultipleFields({
        'config.data_source.kg': newKg,
      });

      invalidKgIds.current = invalidKgIds.current.filter(item => id !== item);
    }

    actions.updateDataSourceInvalid('kg', invalidKgIds.current.length > 0);
  };

  const handleDeleteKnowledgeNetworkExperimental = (id: string) => {
    const newKg = _.filter(state.config?.data_source?.knowledge_network, item => item.knowledge_network_id !== id);
    actions.updateMultipleFields({
      'config.data_source.knowledge_network': newKg,
    });
  };

  const handleAddKnowledgeNetwork = () => {
    setPreSelectorVisible(true);
  };

  const handlePreSelectorCancel = () => {
    setPreSelectorVisible(false);
  };

  const handlePreSelectorConfirm = (networkId: string, name: string, treeData: TreeDataNode[]) => {
    kgData.current = { ...kgData.current, [networkId]: name };
    setNetworkName(kgData.current);
    setSelectedNetworkId(networkId);
    setPreSelectorVisible(false);
    setKnowledgeNetworkPopoverVisible(true);
    setTreeData(treeData);
  };

  const handleSaveKnowledgeNetwork = (knowledgeNetwork: any) => {
    const kgData = {
      kg_id: knowledgeNetwork.networks[0].id,
      fields: knowledgeNetwork.entities,
      field_properties: knowledgeNetwork.properties,
      output_fields: [],
    };

    const kg: any = _.cloneDeep(state.config?.data_source?.kg);
    let isUpdate = false;
    const newKg = _.map(kg, item => {
      if (item.kg_id === kgData.kg_id) {
        isUpdate = true;
        const output_fields = item.output_fields.filter((field: string) => knowledgeNetwork.entities.includes(field));
        return { ...kgData, output_fields };
      }
      return item;
    });
    actions.updateMultipleFields({
      'config.data_source.kg': isUpdate ? newKg : [...newKg, kgData],
      'config.data_source.advanced_config.kg': kgConfig,
    });

    setSelectedNetworkId(kgData.kg_id);
    setCheckedKeys(knowledgeNetwork.checkedKeys);

    // 新建并保存 || 切换知识网络
    // 设置：新增勾选，添加选项，勾选值不变；减少选项，选项变化，勾选值仍然不变
    // 去除掉不在选项中的resultRange即可
    setKnowledgeNetworkPopoverVisible(false);

    // 添加业务知识网络时，默认展开
    setActiveKey(prev => {
      if (prev.includes('knowledgeNetwork')) return prev;

      return [...prev, 'knowledgeNetwork'];
    });
  };

  const handleSaveKNExperiment = (selectedNet: any) => {
    const kg: any = _.cloneDeep(state.config?.data_source?.knowledge_network) || [];
    actions.updateMultipleFields({
      'config.data_source.knowledge_network': [
        ...kg,
        {
          knowledge_network_id: selectedNet.value,
        },
      ],
    });
    setKnowledgeNetworkExperimentalOpen(false);
    // 添加业务知识网络时，默认展开
    setActiveKey(prev => {
      if (prev.includes('knowledgeNetwork-experimental')) return prev;

      return [...prev, 'knowledgeNetwork-experimental'];
    });
  };

  // 处理文档设置弹窗打开
  const handleDocSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDocSettingsVisible(true);
  };

  // 处理文档高级配置变更
  const handleDocConfigChange = (field: keyof DocAdvancedConfig, value: number) => {
    const newDocConfig = {
      ...docConfig,
      [field]: value,
    };

    setDocConfig(newDocConfig);

    actions.updateSpecificField('config.data_source.advanced_config.doc', newDocConfig);
  };

  // 保存文档设置
  const handleDocSettingsSave = () => {
    actions.updateSpecificField('config.data_source.advanced_config.doc', docConfig);
    setDocSettingsVisible(false);
  };

  // 取消文档设置
  const handleDocSettingsCancel = () => {
    if (state.config?.data_source?.advanced_config?.doc) {
      setDocConfig({
        ...defaultDocConfig,
        ...state.config.data_source.advanced_config.doc,
      });
    } else {
      setDocConfig(defaultDocConfig);
    }
    setDocSettingsVisible(false);
  };

  // 处理知识网络设置弹窗打开
  const handleKgSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setKgSettingsVisible(true);
  };

  // 处理知识网络高级配置变更
  const handleKgConfigChange = (field: keyof KgAdvancedConfig, value: number) => {
    const newKgConfig = {
      ...kgConfig,
      [field]: value,
    };

    setKgConfig(newKgConfig);

    // 更新到全局配置中
    actions.updateSpecificField('config.data_source.advanced_config.kg', newKgConfig);
  };

  // 保存知识网络设置
  const handleKgSettingsSave = () => {
    // 更新到全局配置中
    actions.updateSpecificField('config.data_source.advanced_config.kg', kgConfig);
    setKgSettingsVisible(false);
  };

  // 取消知识网络设置
  const handleKgSettingsCancel = () => {
    // 重置为原始配置
    if (state.config?.data_source?.advanced_config?.kg) {
      setKgConfig({
        ...defaultKgConfig,
        ...state.config.data_source.advanced_config.kg,
      });
    } else {
      setKgConfig(defaultKgConfig);
    }
    setKgSettingsVisible(false);
  };

  // 弹窗内容组件
  const PopoverContent = ({ onSelect }: { onSelect: (option: 'documentLibrary' | 'anyshare') => void }) => (
    <div style={{ width: '180px', padding: '4px 0' }}>
      <div
        onClick={(e: any) => {
          e.stopPropagation();
          onSelect('documentLibrary');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <DocLib style={{ color: '#1890ff', fontSize: '16px', marginRight: '12px' }} />
        <span style={{ fontSize: '14px', color: '#333' }}>{intl.get('dataAgent.config.docLib')}</span>
      </div>
      <div
        onClick={(e: any) => {
          e.stopPropagation();
          onSelect('anyshare');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <AnyShare style={{ color: '#1890ff', fontSize: '16px', marginRight: '12px' }} />
        <span style={{ fontSize: '14px', color: '#333' }}>AnyShare</span>
      </div>
    </div>
  );

  const mergeDocDataSourceConfig = (updatedDsId: string, dsDocuments: Document[]) => {
    // 获取当前的doc配置
    const currentDocConfig = state.config?.data_source?.doc || [];

    // 查找是否存在相同ds_id的条目
    const existingIndex = currentDocConfig.findIndex(item => item.ds_id === updatedDsId);

    let updatedDocConfig;

    if (existingIndex !== -1) {
      // 存在相同ds_id，更新对应的fields
      updatedDocConfig = [...currentDocConfig];
      updatedDocConfig[existingIndex] = {
        ...updatedDocConfig[existingIndex],
        fields: dsDocuments.filter(doc => doc.ds_id === updatedDsId),
      };
    } else {
      // 不存在相同ds_id，添加新的条目
      updatedDocConfig = [
        ...currentDocConfig,
        {
          ds_id: updatedDsId,
          fields: dsDocuments.filter(doc => doc.ds_id === updatedDsId),
        },
      ];
    }

    return updatedDocConfig;
  };

  // 处理文档选择
  const handleSelectDocumentOption = (option: 'documentLibrary' | 'anyshare') => {
    setDocumentPopoverVisible(false);

    if (option === 'documentLibrary') {
      // 原有的文档库选择逻辑
      if (!selectFnRef.current) {
        selectFnRef.current = apis.selectFn({
          selectType: 2,
          multiple: true,
          onConfirm: (files: Array<{ id: string; name: string }>) => {
            if (files.length > 0) {
              const transformedFiles = files.map(file => ({
                name: file.name,
                path: file.name,
                source: file.id,
                ds_id: '0',
              }));
              const newDocuments = transformedFiles.filter(file => !documents.some(doc => doc.source === file.source));

              if (newDocuments.length > 0) {
                const updatedDocuments = [...documents, ...newDocuments];

                setDocuments(updatedDocuments);
                setActiveKey([...activeKey, 'documents']);

                const updatedDocConfig = mergeDocDataSourceConfig('0', updatedDocuments);

                actions.updateMultipleFields({
                  'config.data_source.doc': updatedDocConfig,
                  'config.data_source.advanced_config.doc': docConfig,
                });
              }
            }
          },
          onCancel: () => {
            // 用户取消选择
            selectFnRef.current = null;
          },
        });
      }
    } else if (option === 'anyshare') {
      // 打开AnyShare选择器
      setAnyShareSelectorVisible(true);
    }
  };

  // 处理AnyShare选择器确认
  const handleAnyShareConfirm = (selectedData: {
    dataSource: { id: string; name: string };
    selectedFiles: Array<{ name: string; path: string; source: string; ds_id: string }>;
  }) => {
    const { dataSource, selectedFiles } = selectedData;

    const newDocuments = selectedFiles.filter(file => !documents.some(doc => doc.source === file.source));

    if (newDocuments.length > 0) {
      const updatedDocuments = [...documents, ...newDocuments];

      setActiveKey([...activeKey, 'documents']);
      setDocuments(updatedDocuments);
      setAnyShareSelectorVisible(false);

      const updatedDocConfig = mergeDocDataSourceConfig(dataSource.id, updatedDocuments);

      actions.updateMultipleFields({
        'config.data_source.doc': updatedDocConfig,
        'config.data_source.advanced_config.doc': docConfig,
      });
    }
  };

  // 处理AnyShare选择器取消
  const handleAnyShareCancel = () => {
    setAnyShareSelectorVisible(false);
  };

  // 处理数据源的添加
  const addDataSource = (
    data: Array<{ id: string; name: string }>,
    {
      selectorVisibleSetter,
      statePath,
      activeKeyValue,
      idKey,
      namesSetter,
    }: {
      selectorVisibleSetter: (visible: boolean) => void;
      statePath: 'kn_entry' | 'metric';
      activeKeyValue: 'kn_entry' | 'metric';
      idKey: 'kn_entry_id' | 'metric_model_id';
      namesSetter: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    }
  ) => {
    selectorVisibleSetter(false);
    const oldData = state.config?.data_source?.[statePath] || [];
    const newData = data.map(({ id, name }) => ({ [idKey]: id, name }));
    // 去重，防止重复添加
    const allData = uniqBy([...oldData, ...newData], idKey);
    // 自动展开Panel
    setActiveKey(prev => [...prev, activeKeyValue]);

    // 当有新增指标时
    if (allData.length > oldData.length) {
      actions.updateMultipleFields({
        [`config.data_source.${statePath}`]: allData,
      });

      namesSetter(original =>
        data.reduce((prev, { id, name }) => {
          return { ...prev, [id]: name };
        }, original)
      );
    }
  };

  // 处理数据源的删除
  const deleteDataSource = (
    item: any,
    {
      canEdit,
      statePath,
      idKey,
      invalidIds,
      updateInvalidFn,
    }: {
      canEdit: boolean;
      statePath: 'metric' | 'kn_entry';
      idKey: 'metric_model_id' | 'kn_entry_id';
      invalidIds: React.MutableRefObject<any[]>;
      updateInvalidFn: (key: 'metric' | 'kn_entry', invalid: boolean) => void;
    }
  ) => {
    if (!canEdit) return;

    const currentArray = state.config?.data_source?.[statePath] || [];
    const filterData = currentArray.filter(entry => entry[idKey] !== item[idKey]);
    actions.updateMultipleFields({
      [`config.data_source.${statePath}`]: filterData,
    });
    invalidIds.current = invalidIds.current.filter(id => id !== item[idKey]);
    updateInvalidFn(statePath, invalidIds.current.length > 0);
  };

  const customExpandIcon = ({ isActive }: { isActive: boolean }) => <DownOutlined rotate={isActive ? 360 : 270} />;

  const renderDocumentHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Space>
        <span>{intl.get('dataAgent.config.document')}</span>
        <SettingOutlined
          style={{
            color: canEditDataSourceDoc ? '#8c8c8c' : '#d9d9d9',
            cursor: canEditDataSourceDoc ? 'pointer' : 'not-allowed',
          }}
          onClick={canEditDataSourceDoc ? handleDocSettingsClick : undefined}
        />
      </Space>
      <Popover
        content={<PopoverContent onSelect={handleSelectDocumentOption} />}
        trigger={canEditDataSourceDoc ? ['click'] : []}
        placement="bottomRight"
        open={canEditDataSourceDoc ? documentPopoverVisible : false}
        onOpenChange={canEditDataSourceDoc ? setDocumentPopoverVisible : undefined}
        overlayStyle={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px',
        }}
      >
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          disabled={!canEditDataSourceDoc}
          onClick={e => {
            e.stopPropagation();
          }}
          className="dip-c-link-75"
        >
          {intl.get('dataAgent.config.add')}
        </Button>
      </Popover>
    </div>
  );

  const renderKnowledgeNetworkHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Space>
        <span>{intl.get('dataAgent.config.businessKnowledgeNetwork')}</span>
        <SettingOutlined
          style={{
            color: canEditDataSourceKg ? '#8c8c8c' : '#d9d9d9',
            cursor: canEditDataSourceKg ? 'pointer' : 'not-allowed',
          }}
          onClick={canEditDataSourceKg ? handleKgSettingsClick : undefined}
        />
      </Space>
      <Button
        type="text"
        icon={<PlusOutlined />}
        size="small"
        disabled={!canEditDataSourceKg}
        onClick={e => {
          e.stopPropagation();
          if (canEditDataSourceKg) {
            handleAddKnowledgeNetwork();
          }
        }}
        className="dip-c-link-75"
      >
        {intl.get('dataAgent.config.add')}
      </Button>
    </div>
  );

  const renderKnowledgeNetworkExperimentalHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Space>
        <span>{intl.get('dataAgent.config.businessKnowledgeNetwork')}（试验版）</span>
      </Space>
      {(!state.config?.data_source?.knowledge_network ||
        state.config?.data_source?.knowledge_network?.length === 0) && (
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          disabled={!canEditDataSourceKgExperiment}
          onClick={e => {
            e.stopPropagation();
            if (canEditDataSourceKgExperiment) {
              setKnowledgeNetworkExperimentalOpen(true);
            }
          }}
          className="dip-c-link-75"
        >
          {intl.get('dataAgent.config.add')}
        </Button>
      )}
    </div>
  );

  const renderMetricHeader = () => (
    <div className="dip-w-100 dip-flex-space-between">
      <Space>
        <span>{intl.get('dataAgent.indicator')}</span>
      </Space>
      <Button
        type="text"
        icon={<PlusOutlined />}
        size="small"
        disabled={!canEditDataSourceMetric}
        onClick={e => {
          e.stopPropagation();
          if (canEditDataSourceMetric) {
            setMetricSelectorVisible(true);
          }
        }}
        className="dip-c-link-75"
      >
        {intl.get('dataAgent.config.add')}
      </Button>
    </div>
  );

  const selectedNetwork = _.find(state.config?.data_source?.kg, item => item.kg_id === selectedNetworkId);

  // 渲染配置项（带滑块和数值输入框）
  const renderConfigItem = (
    label: string,
    field: keyof DocAdvancedConfig,
    min: number = 0,
    max: number = 1000,
    step: number = 1,
    precision?: number
  ) => (
    <Col span={24} style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0, fontSize: 14, color: '#333' }}>{label}：</div>
        <div style={{ flex: 1 }}>
          <Slider
            value={docConfig[field]}
            onChange={value => handleDocConfigChange(field, value as number)}
            min={min}
            max={max}
            step={step}
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ width: 80, flexShrink: 0 }}>
          <InputNumber
            precision={precision}
            value={docConfig[field]}
            onChange={value => handleDocConfigChange(field, value as number)}
            min={min}
            max={max}
            step={step}
            style={{ width: '100%', fontSize: 12 }}
            size="small"
            controls={{
              upIcon: <span style={{ fontSize: 10 }}>▲</span>,
              downIcon: <span style={{ fontSize: 10 }}>▼</span>,
            }}
          />
        </div>
      </div>
    </Col>
  );

  // 渲染知识网络配置项（带滑块和数值输入框）
  const renderKgConfigItem = (
    label: string,
    field: keyof KgAdvancedConfig,
    min: number = 0,
    max: number = 1000,
    step: number = 1,
    precision?: number,
    description?: string
  ) => (
    <Col span={24} style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0, fontSize: 14, color: '#333' }}>{label}：</div>
        <div style={{ flex: 1 }}>
          <Slider
            value={kgConfig[field]}
            onChange={value => handleKgConfigChange(field, value as number)}
            min={min}
            max={max}
            step={step}
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ width: 80, flexShrink: 0 }}>
          <InputNumber
            precision={precision}
            value={kgConfig[field]}
            onChange={value => handleKgConfigChange(field, value as number)}
            min={min}
            max={max}
            step={step}
            style={{ width: '100%', fontSize: 12 }}
            size="small"
            controls={{
              upIcon: <span style={{ fontSize: 10 }}>▲</span>,
              downIcon: <span style={{ fontSize: 10 }}>▼</span>,
            }}
          />
        </div>
      </div>
      {description && (
        <div style={{ marginLeft: 216, fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{description}</div>
      )}
    </Col>
  );

  // 获取指标名称
  useEffect(() => {
    const getMetricName = async () => {
      const metric = state.config?.data_source?.metric;

      if (!metric?.length) return;

      const metricIds = metric.map(({ metric_model_id }) => metric_model_id);

      try {
        // 先批量获取metric的name
        const result = await getMetricInfoByIds({ ids: metricIds });

        const metricNames: Record<string, string> = result.reduce((prev, { id, name }) => {
          return {
            ...prev,
            [id]: name,
          };
        }, {});

        setMetricNames(metricNames);

        metricIds.forEach(id => {
          if (!metricNames[id]) {
            invalidMetricIds.current = [...invalidMetricIds.current, id];
          }
        });
        actions.updateDataSourceInvalid('metric', invalidMetricIds.current.length > 0);
      } catch {
        if (metricIds.length === 1) {
          // 仅一个，则失败
          invalidMetricIds.current = metricIds;
          actions.updateDataSourceInvalid('metric', invalidMetricIds.current.length > 0);
          return;
        }

        // 当批量，有可能部分还存在，故下面再分别获取
        metricIds.forEach(async id => {
          try {
            const [{ name }] = await getMetricInfoByIds({ ids: [id] });
            metricNamesRef.current = { ...metricNamesRef.current, [id]: name };
          } catch {
            invalidMetricIds.current = [...invalidMetricIds.current, id];
          } finally {
            setMetricNames(metricNamesRef.current);
            actions.updateDataSourceInvalid('metric', invalidMetricIds.current.length > 0);
          }
        });
      }
    };

    getMetricName();
  }, []);

  // 获取kn_entry名称
  useEffect(() => {
    const getKnEntryName = async () => {
      const knEntry = state.config?.data_source?.kn_entry;

      if (!knEntry?.length) return;

      const knEntryIds = knEntry.map(({ kn_entry_id }) => kn_entry_id);

      try {
        // 先批量获取metric的name
        const result = await getDataDictInfoByIds(knEntryIds);

        const knEntryNames: Record<string, string> = result.reduce((prev, { id, name }) => {
          return {
            ...prev,
            [id]: name,
          };
        }, {});

        setKnEntryNames(knEntryNames);

        knEntryIds.forEach(id => {
          if (!knEntryNames[id]) {
            inValidKnEntryIds.current = [...inValidKnEntryIds.current, id];
          }
        });
        actions.updateDataSourceInvalid('kn_entry', inValidKnEntryIds.current.length > 0);
      } catch {
        if (knEntryIds.length === 1) {
          // 仅一个，则失败
          inValidKnEntryIds.current = knEntryIds;
          actions.updateDataSourceInvalid('kn_entry', inValidKnEntryIds.current.length > 0);
          return;
        }

        // 当批量，有可能部分还存在，故下面再分别获取
        knEntryIds.forEach(async id => {
          try {
            const [{ name }] = await getDataDictInfoByIds([id]);
            knEntryNamesRef.current = { ...knEntryNamesRef.current, [id]: name };
          } catch {
            inValidKnEntryIds.current = [...inValidKnEntryIds.current, id];
          } finally {
            setKnEntryNames(knEntryNamesRef.current);
            actions.updateDataSourceInvalid('kn_entry', inValidKnEntryIds.current.length > 0);
          }
        });
      }
    };

    getKnEntryName();
  }, []);

  // 获取实验版业务知识网络名称
  useDeepCompareEffect(() => {
    const getData = async () => {
      const knData = state.config?.data_source?.knowledge_network || [];
      const knIds = knData.map(item => item.knowledge_network_id);
      if (knIds.length > 0) {
        // 目前业务知识网络实验版详情接口只支持一次查一个，并且当前只允许选一个，所以这里只取第一个
        // 后续如果允许选多个知识网络的时候，需要批量获取，让后端接口支持一次查多个
        const res = await getKnExperimentDetailsById(knIds[0]);
        if (res) {
          setKnExperimentNames({ [res.id]: res.name });
        } else {
          setKnExperimentNames({});
          invalidKgExperimentIds.current = knIds;
          actions.updateDataSourceInvalid('kg-experiment', invalidKgExperimentIds.current.length > 0);
        }
      } else {
        setKnExperimentNames({});
      }
    };
    getData();
    return () => {
      invalidKgExperimentIds.current = [];
      actions.updateDataSourceInvalid('kg-experiment', false);
    };
  }, [state.config?.data_source?.knowledge_network]);

  useEffect(() => {
    actions.updateDataSourceNameMapping('kg', networkName);
  }, [networkName]);

  useEffect(() => {
    actions.updateDataSourceNameMapping('metric', metricNames);
  }, [metricNames]);

  useEffect(() => {
    actions.updateDataSourceNameMapping('kn_entry', knEntryNames);
  }, [knEntryNames]);

  return (
    <SectionPanel
      title={
        <>
          <div>{intl.get('dataAgent.config.knowledgeSource')}</div>
          <Tooltip title={intl.get('dataAgent.config.knowledgeSourceTip')}>
            <QuestionCircleOutlined className="dip-font-14" />
          </Tooltip>
          {/* {renderProcessingStatusTag()} */}
        </>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      icon={<KnowledgeIcon />}
      description={intl.get('dataAgent.config.knowledgeDes')}
      className={'dip-border-line-b'}
      //   rightElement={
      //     <Button
      //       icon={<PlusOutlined />}
      //       type="text"
      //       disabled={!canAddMoreSources()}
      //       onClick={handleAddKnowledgeSource}
      //       className="dip-c-link-75"
      //     >
      //       添加
      //     </Button>
      //   }
    >
      <div className={styles['knowledge-config']}>
        <Collapse
          ghost
          expandIcon={customExpandIcon}
          activeKey={activeKey}
          style={{ background: 'transparent' }}
          onChange={(key: string | string[]) => {
            setActiveKey(key);
          }}
        >
          <Panel header={renderDocumentHeader()} key="documents" style={{ border: 'none' }}>
            <List
              size="small"
              dataSource={documents}
              renderItem={item => (
                <List.Item
                  style={{
                    padding: '8px 0',
                    border: 'none',
                  }}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      className="dip-c-subtext"
                      disabled={!canEditDataSourceDoc}
                      onClick={() => canEditDataSourceDoc && handleDeleteDocument(item.source)}
                      icon={<DipIcon type="icon-dip-trash" />}
                    />,
                  ]}
                >
                  <div className="dip-flex-align-center dip-ml-24 dip-gap-8 dip-overflow-hidden">
                    <FileTypeIcon name={item.name} size={item.type === 'file' ? undefined : -1} />
                    <span title={item.path} className="dip-flex-item-full-width dip-ellipsis">
                      {item.name}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Panel>

          <Panel header={renderKnowledgeNetworkHeader()} key="knowledgeNetwork" style={{ border: 'none' }}>
            <List
              size="small"
              dataSource={state.config?.data_source?.kg || []}
              renderItem={(item: any) => {
                const name1 = networkName[item.kg_id] || '';
                const name2 = ((treeData.flatMap(node => node.children || []) as any).find(
                  child => child.key === item.kg_id
                )?.title || '') as string;
                const name = name1 || name2;
                const checkedKeys = Object.entries(item?.field_properties).flatMap(([entityName, properties]) =>
                  properties.map(property => `${entityName}-${property}`)
                );
                const isInvalid = invalidKgIds.current.includes(item.kg_id);

                return (
                  <List.Item
                    key={item.kg_id}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                    }}
                    actions={[
                      // 无效时，屏蔽此按钮
                      isInvalid ? null : (
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          size="small"
                          disabled={!canEditDataSourceKg}
                          onClick={() => {
                            if (canEditDataSourceKg) {
                              setSelectedNetworkId(item.kg_id);
                              setCheckedKeys(checkedKeys);
                              setKnowledgeNetworkPopoverVisible(true);
                            }
                          }}
                          style={{ color: canEditDataSourceKg ? '#8c8c8c' : '#d9d9d9' }}
                        />
                      ),
                      // 无效时，屏蔽此按钮
                      isInvalid ? null : (
                        <Button
                          type="text"
                          icon={<ControlOutlined />}
                          size="small"
                          disabled={!canEditDataSourceKg}
                          onClick={() => {
                            if (canEditDataSourceKg) {
                              setSelectedNetworkId(item.kg_id);
                              setResultRangeOptions(item?.fields);
                              setKnowledgeNetworkResultRangeVisible(true);
                            }
                          }}
                          style={{ color: canEditDataSourceKg ? '#8c8c8c' : '#d9d9d9' }}
                        />
                      ),
                      <Button
                        type="text"
                        icon={<DipIcon type="icon-dip-trash" />}
                        size="small"
                        disabled={!canEditDataSourceKg}
                        onClick={() => {
                          canEditDataSourceKg && handleDeleteKnowledgeNetwork(item.kg_id);
                        }}
                        className="dip-c-subtext"
                      />,
                    ].filter(Boolean)}
                  >
                    <div className="dip-flex-align-center dip-ml-24 dip-gap-8 dip-overflow-hidden">
                      <NetworkIcon
                        style={{ color: '#1890ff', width: 16, height: 16 }}
                        className="dip-flex dip-flex-shrink-0"
                      />
                      <span
                        title={name}
                        className={classNames('dip-ellipsis', {
                          'dip-text-color-error': isInvalid,
                        })}
                      >
                        {isInvalid ? '---' : name.split('/')[1] || name}
                      </span>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Panel>

          <Panel
            header={renderKnowledgeNetworkExperimentalHeader()}
            key="knowledgeNetwork-experimental"
            style={{ border: 'none' }}
          >
            <List
              size="small"
              dataSource={state.config?.data_source?.knowledge_network || []}
              renderItem={(item: any) => {
                return (
                  <List.Item
                    key={item.knowledge_network_id}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                    }}
                    actions={[
                      <Button
                        type="text"
                        icon={<DipIcon type="icon-dip-trash" />}
                        size="small"
                        disabled={!canEditDataSourceKgExperiment}
                        onClick={() => {
                          canEditDataSourceKgExperiment &&
                            handleDeleteKnowledgeNetworkExperimental(item.knowledge_network_id);
                        }}
                        className="dip-c-subtext"
                      />,
                    ].filter(Boolean)}
                  >
                    <div className="dip-flex-align-center dip-ml-24 dip-gap-8 dip-overflow-hidden">
                      <NetworkIcon
                        style={{ color: '#1890ff', width: 16, height: 16 }}
                        className="dip-flex dip-flex-shrink-0"
                      />
                      <span title={knExperimentNames[item.knowledge_network_id]} className={classNames('dip-ellipsis')}>
                        {knExperimentNames[item.knowledge_network_id]}
                      </span>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Panel>

          <Panel header={renderMetricHeader()} key="metric" style={{ border: 'none' }}>
            <List
              size="small"
              dataSource={state.config?.data_source?.metric || []}
              renderItem={(item: any) => {
                const isInvalid = invalidMetricIds.current.includes(item.metric_model_id);
                const name = item.name || metricNames[item.metric_model_id];

                return (
                  <List.Item
                    key={item.metric_model_id}
                    className="dip-pt-8 dip-pb-8 dip-pl-0 dip-pr-0"
                    style={{ border: 'none' }}
                    actions={[
                      <Button
                        type="text"
                        icon={<DipIcon type="icon-dip-trash" />}
                        size="small"
                        disabled={!canEditDataSourceMetric}
                        onClick={() => {
                          deleteDataSource(item, {
                            canEdit: canEditDataSourceMetric,
                            statePath: 'metric',
                            idKey: 'metric_model_id',
                            invalidIds: invalidMetricIds,
                            updateInvalidFn: actions.updateDataSourceInvalid,
                          });
                        }}
                        className="dip-c-subtext"
                      />,
                    ].filter(Boolean)}
                  >
                    <div className="dip-flex-align-center dip-ml-24 dip-gap-8 dip-overflow-hidden">
                      <DipIcon type={'icon-dip-color-zhibiaometirc'} className="dip-font-16" />
                      <span
                        title={name}
                        className={classNames('dip-ellipsis', {
                          'dip-text-color-error': isInvalid,
                        })}
                      >
                        {isInvalid ? '---' : name}
                      </span>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Panel>

          <Panel
            header={
              <div className="dip-w-100 dip-flex-space-between">
                <Space>
                  <span>{intl.get('dataAgent.knowledgeEntry')}</span>
                </Space>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  disabled={!canEditDataSourceKnEntry}
                  onClick={e => {
                    e.stopPropagation();
                    if (canEditDataSourceKnEntry) {
                      setKnEntrySelectorVisible(true);
                    }
                  }}
                  className="dip-c-link-75"
                >
                  {intl.get('dataAgent.config.add')}
                </Button>
              </div>
            }
            key="kn_entry"
            style={{ border: 'none' }}
          >
            <List
              size="small"
              dataSource={state.config?.data_source?.kn_entry || []}
              renderItem={(item: any) => {
                const isInvalid = inValidKnEntryIds.current.includes(item.kn_entry_id);
                const name = item.name || knEntryNames[item.kn_entry_id];

                return (
                  <List.Item
                    key={item.kn_entry_id}
                    className="dip-pt-8 dip-pb-8 dip-pl-0 dip-pr-0"
                    style={{ border: 'none' }}
                    actions={[
                      <Button
                        type="text"
                        icon={<DipIcon type="icon-dip-trash" />}
                        size="small"
                        disabled={!canEditDataSourceKnEntry}
                        onClick={() => {
                          deleteDataSource(item, {
                            canEdit: canEditDataSourceKnEntry,
                            statePath: 'kn_entry',
                            idKey: 'kn_entry_id',
                            invalidIds: inValidKnEntryIds,
                            updateInvalidFn: actions.updateDataSourceInvalid,
                          });
                        }}
                        className="dip-c-subtext"
                      />,
                    ].filter(Boolean)}
                  >
                    <div className="dip-flex-align-center dip-ml-24 dip-gap-8 dip-overflow-hidden">
                      <KnEntryIcon className="dip-flex dip-font-16 dip-flex-shrink-0" />
                      <span
                        title={name}
                        className={classNames('dip-ellipsis', {
                          'dip-text-color-error': isInvalid,
                        })}
                      >
                        {isInvalid ? '---' : name}
                      </span>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Panel>
        </Collapse>

        {preSelectorVisible && (
          <KnowledgeNetworkPreSelector
            treeData={treeData}
            onCancel={handlePreSelectorCancel}
            onConfirm={handlePreSelectorConfirm}
          />
        )}

        {knowledgeNetworkPopoverVisible && (
          <KnowledgeNetworkSelector
            entityCheckedKeys={checkedKeys}
            visible={knowledgeNetworkPopoverVisible}
            networkId={selectedNetworkId}
            newtworkTreeData={treeData}
            onCancel={(canDelete: any) => {
              if (typeof canDelete === 'boolean') {
                if (canDelete) handleDeleteKnowledgeNetwork(selectedNetworkId);
              } else {
                if (checkedKeys.length === 0) handleDeleteKnowledgeNetwork(selectedNetworkId);
              }
              setCheckedKeys([]);
              setKnowledgeNetworkPopoverVisible(false);
            }}
            onSave={handleSaveKnowledgeNetwork}
            onUpdateTreeData={setTreeData}
          />
        )}

        {knowledgeNetworkResultRangeVisible && (
          <KnowledgeNetworkResultRange
            networkId={selectedNetworkId}
            resultRangeOptions={resultRangeOptions}
            resultRange={selectedNetwork?.output_fields}
            onCancel={() => setKnowledgeNetworkResultRangeVisible(false)}
            onSave={value => {
              const newKg = _.map(state.config?.data_source?.kg, item => {
                if (item.kg_id === selectedNetworkId) item.output_fields = value;
                return item;
              });
              actions.updateMultipleFields({
                'config.data_source.kg': newKg,
              });
              // actions.updateSpecificField('config.data_source.kg[0].output_fields', value);
            }}
          />
        )}

        {/* 文档设置弹窗 */}
        <Modal
          title={intl.get('dataAgent.config.documentRetrievalSettings')}
          centered
          open={docSettingsVisible}
          onOk={handleDocSettingsSave}
          onCancel={handleDocSettingsCancel}
          maskClosable={false}
          width={720}
          okButtonProps={{ className: 'dip-min-width-72' }}
          cancelButtonProps={{ className: 'dip-min-width-72' }}
          footer={(_, { OkBtn, CancelBtn }) => (
            <>
              <Button
                style={{ float: 'left' }}
                className="dip-min-width-72"
                disabled={JSON.stringify(docConfig) === JSON.stringify(defaultDocConfig)}
                onClick={() => {
                  setDocConfig(defaultDocConfig);
                }}
              >
                {intl.get('dataAgent.restore')}
              </Button>
              <OkBtn />
              <CancelBtn />
            </>
          )}
        >
          <div style={{ padding: '20px 0' }}>
            <Row>
              {renderConfigItem(intl.get('dataAgent.config.retrievalSlicesNum'), 'retrieval_slices_num', 50, 200, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.rerankTopk'), 'rerank_topk', 10, 30, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.maxSlicePerCite'), 'max_slice_per_cite', 5, 20, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.sliceTailNum'), 'slice_tail_num', 0, 3, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.sliceHeadNum'), 'slice_head_num', 0, 3, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.documentsNum'), 'documents_num', 4, 10, 1, 0)}
              {renderConfigItem(intl.get('dataAgent.config.documentThreshold'), 'document_threshold', -10, 10, 0.1)}
              {renderConfigItem(
                intl.get('dataAgent.config.retrievalMaxLength'),
                'retrieval_max_length',
                1000,
                50000,
                100,
                0
              )}
            </Row>
          </div>
        </Modal>

        {/* 知识网络设置弹窗 */}
        <Modal
          title={intl.get('dataAgent.config.businessKnowledgeNetworkRetrievalSettings')}
          open={kgSettingsVisible}
          centered
          onOk={handleKgSettingsSave}
          onCancel={handleKgSettingsCancel}
          width={720}
          maskClosable={false}
          okButtonProps={{ className: 'dip-min-width-72' }}
          cancelButtonProps={{ className: 'dip-min-width-72' }}
          footer={(_, { OkBtn, CancelBtn }) => (
            <>
              <Button
                style={{ float: 'left' }}
                className="dip-min-width-72"
                disabled={JSON.stringify(kgConfig) === JSON.stringify(defaultKgConfig)}
                onClick={() => {
                  setKgConfig(defaultKgConfig);
                }}
              >
                {intl.get('dataAgent.restore')}
              </Button>
              <OkBtn />
              <CancelBtn />
            </>
          )}
        >
          <div style={{ padding: '20px 0' }}>
            <Row>
              {renderKgConfigItem(
                intl.get('dataAgent.config.textMatchEntityNums'),
                'text_match_entity_nums',
                40,
                100,
                1,
                0
              )}
              {renderKgConfigItem(
                intl.get('dataAgent.config.vectorMatchEntityNums'),
                'vector_match_entity_nums',
                40,
                100,
                1,
                0
              )}
              {renderKgConfigItem(intl.get('dataAgent.config.graphRagTopk'), 'graph_rag_topk', 10, 100, 1, 0)}
              {renderKgConfigItem(
                intl.get('dataAgent.config.longTextLength'),
                'long_text_length',
                50,
                1000,
                1,
                0,
                intl.get('dataAgent.config.longTextLengthDes')
              )}
              {renderKgConfigItem(
                intl.get('dataAgent.config.rerankerSimThreshold'),
                'reranker_sim_threshold',
                -10,
                10,
                0.1
              )}
              {renderKgConfigItem(
                intl.get('dataAgent.config.retrievalMaxLength'),
                'retrieval_max_length',
                1000,
                50000,
                100,
                0
              )}
            </Row>
          </div>
        </Modal>

        {/* AnyShare选择器 */}
        {anyShareSelectorVisible && (
          <AnyShareSelector
            visible={anyShareSelectorVisible}
            onCancel={handleAnyShareCancel}
            onConfirm={handleAnyShareConfirm}
          />
        )}

        {/* 指标添加弹窗 */}
        {metricSelectorVisible && (
          <MetricSelector
            onConfirm={metric =>
              addDataSource(metric, {
                selectorVisibleSetter: setMetricSelectorVisible,
                statePath: 'metric',
                activeKeyValue: 'metric',
                idKey: 'metric_model_id',
                namesSetter: setMetricNames,
              })
            }
            onCancel={() => setMetricSelectorVisible(false)}
          />
        )}

        {/* 知识条目添加弹窗 */}
        {knEntrySelectorVisible && (
          <KnEntrySelector
            onCancel={() => setKnEntrySelectorVisible(false)}
            onConfirm={knEntry =>
              addDataSource(knEntry, {
                selectorVisibleSetter: setKnEntrySelectorVisible,
                statePath: 'kn_entry',
                activeKeyValue: 'kn_entry',
                idKey: 'kn_entry_id',
                namesSetter: setKnEntryNames,
              })
            }
          />
        )}

        {/* 业务知识网络实验版弹窗*/}
        <KnowledgeNetworkExperimentalSelect
          open={knowledgeNetworkExperimentalOpen}
          onClose={() => {
            setKnowledgeNetworkExperimentalOpen(false);
          }}
          handleSaveKNExperiment={handleSaveKNExperiment}
        />
      </div>
    </SectionPanel>
  );
};

export default KnowledgeSource;
