import { useState, useRef, useEffect, memo, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Table } from 'antd';
import { getKnExperimentDetailsById, getKnowledgeSourceDetail } from '@/apis/knowledge-data';
import { getMetricInfoByIds, getDataDictInfoByIds } from '@/apis/data-model';
import { AgentDetailType } from '@/apis/agent-factory/type';

interface Props {
  config: AgentDetailType | null;
}

const DataSourceViewerTable = memo(({ config }: Props) => {
  const metricNamesRef = useRef<Record<string, string>>({});
  const knEntryNamesRef = useRef<Record<string, string>>({});

  const [kgNames, setKgNames] = useState<{ [key: string]: string }>({});
  const [kgEntityMaps, setKgEntityMaps] = useState<{ [key: string]: { [name: string]: string } }>({});
  // 指标key->id的映射对象
  const [metricNames, setMetricNames] = useState<Record<string, string>>({});
  // kn_entry key->id 的映射对象
  const [knEntryNames, setKnEntryNames] = useState<Record<string, string>>({});
  // 业务知识网络实验版：id 到 name 映射对象
  const [knExperimentNames, setKnExperimentNames] = useState<Record<string, string>>({});

  const dataSource = useMemo(() => {
    const arr: any[] = [];

    // 添加知识网络数据源
    if (config?.config?.data_source?.kg) {
      config.config.data_source.kg.forEach((kg: any) => {
        arr.push({
          key: kg.kg_id,
          type: intl.get('dataAgent.config.businessKnowledgeNetwork'),
          name: kgNames[kg.kg_id] || '---',
          fields: kg.fields,
          kg_id: kg.kg_id, // 添加kg_id用于查找实体映射
        });
      });
    }

    // 添加知识网络试验版数据源
    if (config?.config?.data_source?.knowledge_network) {
      config.config.data_source.knowledge_network.forEach((kg: any) => {
        arr.push({
          key: kg.knowledge_network_id,
          type: `${intl.get('dataAgent.config.businessKnowledgeNetwork')}（试验版）`,
          name: knExperimentNames[kg.knowledge_network_id] || '---',
          fields: ['---'],
        });
      });
    }

    // 添加文档数据源
    if (config?.config?.data_source?.doc) {
      config.config.data_source.doc.forEach((doc: any) => {
        arr.push({
          key: doc.ds_id,
          type: intl.get('dataAgent.config.document'),
          name: doc.ds_id === '0' ? intl.get('dataAgent.config.docLib') : 'AnyShare',
          fields: doc.fields,
        });
      });
    }

    // 指标数据源
    if (config?.config?.data_source?.metric?.length) {
      const fields = config.config.data_source.metric.map(
        ({ metric_model_id }) => metricNames[metric_model_id] || '---'
      );
      arr.push({
        key: 'metric',
        type: intl.get('dataAgent.indicator'),
        name: intl.get('dataAgent.indicator'),
        fields,
      });
    }

    // kn_entry 数据源
    if (config?.config?.data_source?.kn_entry?.length) {
      const fields = config.config.data_source.kn_entry.map(({ kn_entry_id }) => knEntryNames[kn_entry_id] || '---');
      arr.push({
        key: 'kn_entry',
        type: intl.get('dataAgent.knowledgeEntry'),
        name: intl.get('dataAgent.knowledgeEntry'),
        fields,
      });
    }

    return arr;
  }, [config, kgNames, metricNames, knEntryNames, knExperimentNames]);

  const columns = useMemo(
    () => [
      {
        title: intl.get('dataAgent.config.type'),
        dataIndex: 'type',
        key: 'type',
        ellipsis: true,
      },
      {
        title: intl.get('dataAgent.config.knowledgeSourceName'),
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
      {
        title: intl.get('dataAgent.config.searchScope'),
        dataIndex: 'fields',
        key: 'fields',
        ellipsis: true,
        render: (fields: any, record: any) => {
          if (!fields || !Array.isArray(fields)) return '';

          return fields
            .map((field: any) => {
              let displayName = field.name || field;

              // 如果是kg类型，尝试获取实体别名
              if (record.kg_id && kgEntityMaps[record.kg_id]) {
                const entityAlias = kgEntityMaps[record.kg_id][displayName];
                if (entityAlias) {
                  displayName = `${entityAlias}(${displayName})`;
                }
              }

              return displayName;
            })
            .join(', ');
        },
      },
    ],
    [kgEntityMaps]
  );

  // 获取知识网络名称和实体信息
  const fetchKgNames = async (kgIds: string[]) => {
    try {
      const kgNameMap: { [key: string]: string } = {};
      const kgEntityMapAll: { [key: string]: { [name: string]: string } } = {};

      // 并行获取所有kg的基本信息
      const promises = kgIds.map(async kgId => {
        try {
          const response = await getKnowledgeSourceDetail({ id: kgId });
          if (response?.res?.graph_name) {
            kgNameMap[kgId] = response.res.graph_name;
          } else {
            kgNameMap[kgId] = '---';
          }

          // 构建实体名称到别名的映射
          if (response?.res?.entity) {
            const entityMap: { [name: string]: string } = {};
            response.res.entity.forEach((entity: any) => {
              if (entity.name && entity.alias) {
                entityMap[entity.name] = entity.alias;
              }
            });
            kgEntityMapAll[kgId] = entityMap;
          }
        } catch (error) {
          console.error(`获取知识网络 ${kgId} 名称失败:`, error);
          kgNameMap[kgId] = '---';
          kgEntityMapAll[kgId] = {};
        }
      });

      await Promise.all(promises);
      setKgNames(kgNameMap);
      setKgEntityMaps(kgEntityMapAll);
    } catch (error) {
      console.error('获取知识网络名称失败:', error);
    }
  };

  // 获取metric名称
  const fetchMetricNames = async (metricIds: string[]) => {
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
    } catch {
      if (metricIds.length === 1) {
        // 仅一个失败，return
        return;
      }

      // 当批量，有可能部分还存在，故下面再分别获取
      metricIds.forEach(async id => {
        try {
          const [{ name }] = await getMetricInfoByIds({ ids: [id] });
          metricNamesRef.current = { ...metricNamesRef.current, [id]: name };
          setMetricNames(metricNamesRef.current);
        } catch {}
      });
    }
  };

  // 获取知识网络试验版名称
  const fetchKnExperimentNames = async (knIds: string[]) => {
    if (knIds.length > 0) {
      const res = await getKnExperimentDetailsById(knIds[0]);
      if (res) {
        setKnExperimentNames({ [res.id]: res.name });
      }
    }
  };

  // 获取kn_entry名称
  const fetchKnEntryNames = async (knEntryIds: string[]) => {
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
    } catch {
      if (knEntryIds.length === 1) {
        // 仅一个，直接return
        return;
      }

      // 当批量，有可能部分还存在，故下面再分别获取
      knEntryIds.forEach(async id => {
        try {
          const [{ name }] = await getDataDictInfoByIds([id]);
          knEntryNamesRef.current = { ...knEntryNamesRef.current, [id]: name };
          setKnEntryNames(knEntryNamesRef.current);
        } catch {}
      });
    }
  };

  const getDataSourceInfo = async (config: AgentDetailType | null) => {
    // 获取kg名称
    if (config?.config?.data_source?.kg) {
      const kgIds = config.config.data_source.kg.map((kg: any) => kg.kg_id);
      if (kgIds.length > 0) {
        await fetchKgNames(kgIds);
      }
    }

    // 获取指标名称
    if (config?.config?.data_source?.metric) {
      const metricIds = config.config.data_source.metric.map(({ metric_model_id }) => metric_model_id);
      if (metricIds.length) {
        fetchMetricNames(metricIds);
      }
    }

    // 获取kn_entry名称
    if (config?.config?.data_source?.kn_entry) {
      const knEntryIds = config.config.data_source.kn_entry.map(({ kn_entry_id }) => kn_entry_id);
      if (knEntryIds.length) {
        fetchKnEntryNames(knEntryIds);
      }
    }

    // 获取业务知识网络试验版名称
    if (config?.config?.data_source?.knowledge_network) {
      const kgIds = config.config.data_source.knowledge_network.map((kg: any) => kg.knowledge_network_id);
      if (kgIds.length > 0) {
        await fetchKnExperimentNames(kgIds);
      }
    }
  };

  useEffect(() => {
    getDataSourceInfo(config);
  }, [config]);

  return dataSource.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
      {intl.get('dataAgent.noKnowledgeSourceConfig')}
    </div>
  ) : (
    <Table columns={columns} dataSource={dataSource} pagination={false} size="small" />
  );
});

export default DataSourceViewerTable;
