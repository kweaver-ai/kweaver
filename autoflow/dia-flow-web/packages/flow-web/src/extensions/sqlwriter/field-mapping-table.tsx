import React, { useCallback, useContext } from 'react';
import { 
  Table, 
  Input, 
  Select, 
  Checkbox,
  Space
} from 'antd';
import styles from './field-mapping-table.module.less';

const { Option } = Select;

interface FieldMapping {
  id: string;
  sourceField: string;
  sourceType: string;
  sourceLength?: number;
  sourceScale?: number;
  targetField: string;
  targetType: string;
  targetLength?: number;
  targetScale?: number;
  comment: string;
  isPrimaryKey: boolean;
  isNotNull: boolean;
  selected: boolean;
  isNew?: boolean;
}

interface FieldMappingTableProps {
  sourceFields?: FieldMapping[];
  onChange?: (mappings: FieldMapping[]) => void;
  dataSourceId?: string;
  tableName?: string;
  isNewTargetTable?: boolean;
  targetTableColumns?: Array<{ column_name: string; data_type: string; precision?: number; scale?: number; comment?: string; is_nullable?: string }>;
  t?: (key: string, defaultValue?: string) => string;
}

const defaultSourceFields: FieldMapping[] = [
  { id: '1', sourceField: 'id', sourceType: 'varchar(255)', targetField: 'id', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '2', sourceField: 'name', sourceType: 'varchar(255)', targetField: 'name', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '3', sourceField: 'gender', sourceType: 'varchar(255)', targetField: 'gender', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '4', sourceField: 'birth_date', sourceType: 'varchar(255)', targetField: 'birth_date', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '5', sourceField: 'hire_date', sourceType: 'varchar(255)', targetField: 'hire_date', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '6', sourceField: 'education', sourceType: 'varchar(255)', targetField: 'education', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
  { id: '7', sourceField: 'major', sourceType: 'varchar(255)', targetField: 'major', targetType: 'varchar(255)', comment: '', isPrimaryKey: false, isNotNull: false, selected: false, isNew: false },
];

export const FieldMappingTable: React.FC<FieldMappingTableProps> = ({
  sourceFields = defaultSourceFields,
  onChange,
  dataSourceId,
  tableName,
  isNewTargetTable = false,
  targetTableColumns = [],
  t = (key, defaultValue) => defaultValue || key,
}) => {
  const mappings = sourceFields; // 直接使用 props 数据
  const isExistingTable = !!(dataSourceId && tableName) && !isNewTargetTable;
  const isTypeDisabled = (row?: FieldMapping) => isExistingTable;
  const isFieldDisabled = (row: FieldMapping | undefined, fieldType: 'targetField' | 'type' | 'comment' | 'constraints') => {
    if (!row) return false;
    if (isExistingTable && row.isNew) {
      // 已存在表模式下的新字段，只有目标字段可以编辑，其他字段都不可编辑
      return fieldType !== 'targetField';
    }
    // 其他情况保持原有逻辑
    return isExistingTable && !row.isNew;
  };
  const allowFreeTargetType = !!isNewTargetTable;
  
  const parseType = (t?: string): { base: string; length?: number; scale?: number } => {
    if (!t) return { base: '' };
    // 匹配 decimal(precision, scale) 或 decimal(precision) 或其他类型(length)
    const decimalMatch = String(t).match(/^(\w+)\s*\((\d+)(?:\s*,\s*(\d+))?\)/i);
    if (decimalMatch) {
      const base = decimalMatch[1];
      const length = Number(decimalMatch[2]);
      const scale = decimalMatch[3] ? Number(decimalMatch[3]) : undefined;
      if (isDecimalType(base)) {
        return { base, length, scale };
      } else {
        return { base, length };
      }
    }
    return { base: String(t) };
  };

  const formatType = (base?: string, length?: number, scale?: number): string => {
    if (!base) return '';
    if (isDecimalType(base)) {
      if (typeof length === 'number' && typeof scale === 'number') {
        return `${base}(${length},${scale})`;
      } else if (typeof length === 'number') {
        return `${base}(${length})`;
      }
    } else if (isLengthType(base) && typeof length === 'number') {
      return `${base}(${length})`;
    }
    return base;
  };

  const isLengthType = (base?: string) => {
    if (!base) return false;
    return /^(varchar|char|nvarchar|varchar2)$/i.test(base);
  };

  const isDecimalType = (base?: string) => {
    if (!base) return false;
    return /^(decimal|numeric|number)$/i.test(base);
  };

  // 获取未映射的目标表字段
  const getUnmappedTargetFields = useCallback(() => {
    if (!isExistingTable || !targetTableColumns.length) return [];

    const mappedTargetFields = mappings.map(m => m.targetField);
    return targetTableColumns.filter(col =>
      !mappedTargetFields.includes(col.column_name)
    );
  }, [isExistingTable, targetTableColumns, mappings]);
  
  const addField = useCallback(() => {
    const newItem: FieldMapping = {
      id: String(Date.now()),
      sourceField: '',
      sourceType: '',
      sourceLength: undefined,
      sourceScale: undefined,
      targetField: '',
      targetType: 'varchar',
      targetLength: 255,
      targetScale: undefined,
      comment: '',
      isPrimaryKey: false,
      isNotNull: false,
      selected: false,
      isNew: true,
    };
    const newMappings = [...mappings, newItem];
    if (onChange) onChange(newMappings);
  }, [mappings, onChange]);

  const handleFieldChange = useCallback((id: string, field: keyof FieldMapping, value: any) => {
    const newMappings = mappings.map(mapping =>
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    );
    if (onChange) {
      onChange(newMappings);
    }
  }, [mappings, onChange]);

  // 当选择目标字段时，自动填充类型信息和来源字段
  const handleTargetFieldChange = useCallback((id: string, targetField: string) => {
    const targetColumn = targetTableColumns.find(col => col.column_name === targetField);
    if (targetColumn) {
      const parsed = parseType(targetColumn.data_type);
      const lengthFromCol = isDecimalType(parsed.base) && typeof targetColumn.precision === 'number'
        ? targetColumn.precision
        : targetColumn.precision ?? parsed.length;

      const updates: Partial<FieldMapping> = {
        targetField,
        sourceField: targetField, // 自动填充来源字段
        targetType: parsed.base || targetColumn.data_type,
        targetLength: lengthFromCol,
        targetScale: targetColumn.scale ?? parsed.scale,
        comment: targetColumn.comment || '',
        isNotNull: targetColumn.is_nullable === 'NO' || targetColumn.is_nullable === 'N',
      };

      const newMappings = mappings.map(mapping =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      );
      if (onChange) onChange(newMappings);
    } else {
      handleFieldChange(id, 'targetField', targetField);
    }
  }, [targetTableColumns, parseType, isDecimalType, mappings, onChange, handleFieldChange]);


  

  const handleDeleteField = useCallback((id: string) => {
    const newMappings = mappings.filter(mapping => mapping.id !== id);
    if (onChange) {
      onChange(newMappings);
    }
  }, [mappings, onChange]);

  const columns = [
    {
      title: t('fieldMapping.sourceField', '来源字段'),
      dataIndex: 'sourceField',
      key: 'sourceField',
      width: 200,
      render: (text: string, record: FieldMapping) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'sourceField', e.target.value)}
          className={styles.targetFieldInput}
        />
      ),
    },
    // {
    //   title: '类型',
    //   dataIndex: 'sourceType',
    //   key: 'sourceType',
    //   width: 120,
    //   render: (text: string, record: FieldMapping) => {
    //     const parsed = parseType(text);
    //     const display = formatType(parsed.base, record.sourceLength ?? parsed.length);
    //     return (
    //       <span style={{ color: '#999' }}>{display ? `// ${display}` : '// -'}</span>
    //     );
    //   },
    // },
    {
      title: '',
      key: 'arrow',
      width: 50,
      render: () => (
        <div className={styles.arrow}>→</div>
      ),
    },
    {
      title: t('fieldMapping.targetField', '目标表字段'),
      dataIndex: 'targetField',
      key: 'targetField',
      width: 200,
      render: (text: string, record: FieldMapping) => {
        const isNewFieldInExistingTable = isExistingTable && record.isNew;

        if (isNewFieldInExistingTable) {
          const unmappedFields = getUnmappedTargetFields();

          return (
            <Select
              value={text}
              onChange={(value) => handleTargetFieldChange(record.id, value)}
              className={styles.targetFieldInput}
              style={{ width: '100%' }}
              placeholder={t('fieldMapping.selectTargetField', '选择目标字段')}
            >
              {unmappedFields.map(field => (
                <Option key={field.column_name} value={field.column_name}>
                  {field.column_name}
                </Option>
              ))}
            </Select>
          );
        }

        return (
          <Input
            value={text}
            onChange={(e) => handleFieldChange(record.id, 'targetField', e.target.value)}
            className={styles.targetFieldInput}
            disabled={isFieldDisabled(record, 'targetField')}
          />
        );
      },
    },
    {
      title: t('fieldMapping.type', '类型'),
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (text: string, record: FieldMapping) => {
        const parsed = parseType(record.targetType);
        const display = allowFreeTargetType ? record.targetType : formatType(parsed.base, record.targetLength ?? parsed.length, record.targetScale ?? parsed.scale);
        return (
          <Space>
            <Input
              value={display}
              onChange={(e) => {
                const v = e.target.value;
                if (allowFreeTargetType) {
                  handleFieldChange(record.id, 'targetType', v);
                  return;
                }
                const p = parseType(v);
                const updates: Partial<FieldMapping> = { targetType: p.base };
                if (isDecimalType(p.base)) {
                  if (typeof p.length === 'number') {
                    updates.targetLength = p.length;
                  }
                  if (typeof p.scale === 'number') {
                    updates.targetScale = p.scale;
                  } else {
                    updates.targetScale = undefined;
                  }
                } else if (isLengthType(p.base)) {
                  if (typeof p.length === 'number') {
                    updates.targetLength = p.length;
                  } else {
                    updates.targetLength = undefined;
                  }
                  updates.targetScale = undefined;
                } else {
                  updates.targetLength = undefined;
                  updates.targetScale = undefined;
                }
                handleFieldChange(record.id, 'targetType', updates.targetType);
                if ('targetLength' in updates) {
                  handleFieldChange(record.id, 'targetLength' as any, updates.targetLength as any);
                }
                if ('targetScale' in updates) {
                  handleFieldChange(record.id, 'targetScale' as any, updates.targetScale as any);
                }
              }}
              className={styles.commentInput}
              style={{ width: 140 }}
              disabled={isTypeDisabled(record)}
            />
          </Space>
        );
      },
    },
    {
      title: t('fieldMapping.comment', '注释'),
      dataIndex: 'comment',
      key: 'comment',
      width: 120,
      render: (text: string, record: FieldMapping) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'comment', e.target.value)}
          placeholder="-"
          className={styles.commentInput}
          disabled={isFieldDisabled(record, 'comment')}
        />
      ),
    },
    {
      title: t('fieldMapping.primaryKey', '主键'),
      dataIndex: 'isPrimaryKey',
      key: 'isPrimaryKey',
      width: 80,
      render: (checked: boolean, record: FieldMapping) => (
        <Checkbox
          checked={checked}
          onChange={(e) => handleFieldChange(record.id, 'isPrimaryKey', e.target.checked)}
          disabled={isFieldDisabled(record, 'constraints')}
        />
      ),
    },
    {
      title: t('fieldMapping.notNull', 'Not Null'),
      dataIndex: 'isNotNull',
      key: 'isNotNull',
      width: 120,
      render: (checked: boolean, record: FieldMapping) => (
        <Checkbox
          checked={checked}
          onChange={(e) => handleFieldChange(record.id, 'isNotNull', e.target.checked)}
          disabled={isFieldDisabled(record, 'constraints')}
        />
      ),
    },
    {
      title: t('fieldMapping.actions', '操作'),
      key: 'actions',
      width: 80,
      render: (_: any, record: FieldMapping) => (
        <a onClick={() => handleDeleteField(record.id)}>{t('fieldMapping.delete', '删除')}</a>
      ),
    },
  ];

  return (
    <div className={styles.mappingCard}>
      <div className={styles.mappingHeader}>
        <span className={styles.mappingTitle}>{t('fieldMapping.title', '字段映射')}</span>
        <a onClick={addField} className={styles.addFieldBtn}>{t('fieldMapping.addField', '新增字段')}</a>
      </div>
      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="id"
        pagination={false}
        scroll={{ x: 900 }}
        className={styles.mappingTable}
        size="small"
      />
    </div>
  );
};
