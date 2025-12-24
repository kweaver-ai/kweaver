import React, { useState, useCallback, useEffect, useContext, useMemo, useRef } from 'react';
import { Input, Form, InputNumber } from 'antd';
import { DatabaseConnectionConfig } from './database-connection-config';
import { TargetTableConfig } from './target-table-config';
import { FieldMappingTable } from './field-mapping-table';
import styles from './database-config-panel.module.less';
import { FormItem } from '../../components/editor/form-item';
import { API, MicroAppContext } from '@applet/common';
import EditorWithMentions from '../ai/editor-with-mentions';

// 导入数据转换工具函数
const createFieldMappingsFromColumns = (columns: any[]) => {
  return columns.map((col: any, idx: number) => {
    const name = col?.column_name || col?.name || col?.column || col?.field || `col_${idx + 1}`;
    const rawType = col?.data_type || col?.type || col?.column_type || '';
    const parsed: { base: string; length?: number; scale?: number } = { base: rawType.split('(')[0] };
    const lengthMatch = rawType.match(/\((\d+)(?:,(\d+))?\)/);
    if (lengthMatch) {
      parsed.length = parseInt(lengthMatch[1]);
      if (lengthMatch[2]) parsed.scale = parseInt(lengthMatch[2]);
    }

    return {
      id: `${Date.now()}_${idx}`,
      sourceField: name,
      sourceType: parsed.base || rawType,
      sourceLength: parsed.length || undefined,
      sourceScale: parsed.scale || undefined,
      targetField: name,
      targetType: parsed.base || 'varchar',
      targetLength: parsed.length || 255,
      targetScale: parsed.scale || undefined,
      comment: col?.comment || '',
      isPrimaryKey: col?.is_pk === 1 || col?.primary_key === 1 || col?.key === 'PRI' || false,
      isNotNull: col?.is_nullable === 'NO' || col?.nullable === false || false,
      selected: false,
      isNew: false,
    };
  });
};

const { TextArea } = Input;

interface DatabaseConfigData {
  connection: any;
  targetTable: any;
  fieldMappings: any[];
  targetTableColumns?: TargetTableColumn[];
  data?: any;
  sync_options?: {
    batch_size?: number;
    truncate_before_write?: boolean;
  };
}

interface TargetTableColumn {
  column_name: string;
  data_type: string;
  precision?: number;
  scale?: number;
  comment?: string;
  is_nullable?: string;
}

interface DatabaseConfigPanelProps {
  onSave?: (data: DatabaseConfigData) => void;
  onPreview?: (data: DatabaseConfigData) => void;
  onChange?: (data: DatabaseConfigData) => void;
  initialData?: DatabaseConfigData;
  connectionForm?: any;
  targetTableForm?: any;
  sourceForm?: any;
  t?: (key: string, defaultValue?: string) => string;
}

export const DatabaseConfigPanel: React.FC<DatabaseConfigPanelProps> = ({
  onChange,
  initialData = {
    connection: {},
    targetTable: {},
    fieldMappings: [],
    targetTableColumns: []
  },
  connectionForm,
  targetTableForm,
  sourceForm,
  t = (key, defaultValue) => defaultValue || key,
}) => {
  const [configData, setConfigData] = useState<DatabaseConfigData>(initialData);
  const [apiCache, setApiCache] = useState<Map<string, TargetTableColumn[]>>(new Map());
  const tableChangedRef = useRef(false);
  const [innerConnectionForm] = Form.useForm();
  const [innerTargetTableForm] = Form.useForm();
  const connectionFormInst = connectionForm || innerConnectionForm;
  const targetTableFormInst = targetTableForm || innerTargetTableForm;
  const { prefixUrl } = useContext(MicroAppContext);

  // 使用 useMemo 优化计算，避免不必要的重渲染
  const connectionId = useMemo(() => configData?.connection?.connectionId, [configData?.connection?.connectionId]);
  const isExistingTable = useMemo(() => configData?.targetTable?.tableMode === 'existing', [configData?.targetTable?.tableMode]);
  const tableName = useMemo(() =>
    isExistingTable ? configData?.targetTable?.existingTable : configData?.targetTable?.tableName,
    [isExistingTable, configData?.targetTable?.existingTable, configData?.targetTable?.tableName]
  );

  // 统一的配置更新函数，避免重复的状态更新
  const updateConfig = useCallback((updater: (prev: DatabaseConfigData) => DatabaseConfigData) => {
    setConfigData(prev => {
      const next = updater(prev);
      if (onChange) onChange(next);
      return next;
    });
  }, [onChange]);

  // 获取目标表的列信息（仅负责数据拉取）
  const fetchTargetTableColumns = useCallback(async (connId?: string, tblName?: string, existing?: boolean): Promise<TargetTableColumn[]> => {
    const targetConnectionId = connId || connectionId;
    const targetTableName = tblName || tableName;
    const targetIsExisting = existing !== undefined ? existing : isExistingTable;

    // 只有在已有表模式时才需要获取列信息
    if (!targetConnectionId || !targetTableName || !targetIsExisting) {
      return [];
    }

    const cacheKey = `${targetConnectionId}:${targetTableName}`;

    // 检查缓存
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey)!;
    }

    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/database/table/columns`,
        { params: { data_source_id: targetConnectionId, table_name: targetTableName } }
      );
      const entries = Array.isArray(data?.entries) ? data.entries : (Array.isArray(data) ? data : []);
      const columns: TargetTableColumn[] = entries.map((col: any) => ({
        column_name: col?.column_name || col?.name || col?.column || col?.field || '',
        data_type: col?.data_type || col?.type || col?.column_type || '',
        precision: col?.precision ?? col?.character_maximum_length ?? col?.data_length,
        scale: col?.scale ?? col?.numeric_scale,
        comment: col?.comment || '',
        is_nullable: col?.is_nullable || col?.nullable ? 'Y' : 'N'
      }));

      // 更新缓存
      setApiCache(prev => new Map(prev).set(cacheKey, columns));
      return columns;
    } catch (error) {
      console.error('获取目标表列信息失败:', error);
      return [];
    }
  }, [connectionId, tableName, isExistingTable, prefixUrl, apiCache]);


  const handleConnectionChange = useCallback((connectionData: any) => {
    updateConfig(prev => ({
      ...prev,
      connection: connectionData,
      fieldMappings: []
    }));
  }, [updateConfig]);

  const handleTargetTableChange = useCallback(async (targetTableData: any) => {
    // 检查是否是真正的表切换（表名或表模式发生了变化）
    const prevTableName = configData.targetTable?.existingTable || configData.targetTable?.tableName;
    const prevTableMode = configData.targetTable?.tableMode;
    const newTableName = targetTableData?.existingTable || targetTableData?.tableName;
    const newTableMode = targetTableData?.tableMode;

    const isTableChanged = prevTableName !== newTableName || prevTableMode !== newTableMode;

    let newColumns: TargetTableColumn[] = [];
    let newFieldMappings: any[] = [];

    if (isTableChanged) {
      // 标记表已发生变化
      tableChangedRef.current = true;
      // 获取新表的列信息
      const newTableNameForFetch = newTableMode === 'existing' ? targetTableData?.existingTable : targetTableData?.tableName;
      newColumns = await fetchTargetTableColumns(configData.connection?.connectionId, newTableNameForFetch, newTableMode === 'existing');

      // 基于新列信息创建字段映射
      if (newColumns.length > 0 && newTableMode === 'existing') {
        newFieldMappings = createFieldMappingsFromColumns(newColumns);
      }
    }

    updateConfig(prev => ({
      ...prev,
      targetTable: targetTableData,
      // 更新字段映射
      fieldMappings: isTableChanged ? newFieldMappings : prev.fieldMappings,
      // 更新列信息
      targetTableColumns: isTableChanged ? newColumns : prev.targetTableColumns
    }));
  }, [updateConfig, configData.targetTable, configData.connection?.connectionId, fetchTargetTableColumns]);

  const handleFieldMappingsChange = useCallback((fieldMappings: any[]) => {
    updateConfig(prev => ({ ...prev, fieldMappings }));
  }, [updateConfig]);

  const handleSourceChange = useCallback((_changed: any, all: any) => {
    const { data, sync_options } = sourceForm.getFieldsValue();
    updateConfig(prev => ({
      ...prev,
      data: data,
      sync_options: sync_options || { batch_size: 1000, truncate_before_write: false }
    }));
  }, [updateConfig]);

  return (
    <div className={styles.databaseConfigPanel}>
      <div className={styles.sourceData}>
        <Form form={sourceForm} layout="horizontal" initialValues={{ 
          data: configData?.data, 
          sync_options: configData?.sync_options || { batch_size: 1000, truncate_before_write: false } 
        }} onFieldsChange={handleSourceChange}>
          <FormItem
            label={t('databaseConfig.sourceData', '源数据')}
            name="data"
            type="string"
            rules={[
              {
                transform(value) {
                  return value?.trim();
                },
                required: true,
                message: t("emptyMessage"),
              },
            ]}
            required
          >
            <EditorWithMentions
              onChange={(data) => sourceForm.setFieldValue("data", data)}
              parameters={configData?.data}
              itemName="data"
            />
          </FormItem>
          <FormItem
            label={t('databaseConfig.batchSize', '批量写入大小')}
            name={["sync_options", "batch_size"]}
            required
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
          >
            <InputNumber min={1} max={100000} style={{ width: '100%' }} />
          </FormItem>
        </Form>
      </div>
      
      <DatabaseConnectionConfig
        initialValues={configData.connection}
        onChange={handleConnectionChange}
        form={connectionFormInst}
        t={t}
      />

      <TargetTableConfig
        initialValues={configData.targetTable}
        onChange={handleTargetTableChange}
        dataSourceId={configData?.connection?.connectionId}
        form={targetTableFormInst}
        t={t}
      />

      <FieldMappingTable
        sourceFields={configData.fieldMappings}
        dataSourceId={connectionId}
        tableName={tableName}
        isNewTargetTable={!isExistingTable}
        targetTableColumns={configData.targetTableColumns || []}
        onChange={handleFieldMappingsChange}
        t={t}
      />
    </div>
  );
};
