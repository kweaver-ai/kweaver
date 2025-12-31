import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import intl from 'react-intl-universal';
import { MinusCircleFilled, QuestionCircleFilled } from '@ant-design/icons';
import { Checkbox, Popover, Select, Table, TableColumnProps } from 'antd';
import { nanoid } from 'nanoid';
import InputWithError from '@/components/InputWithError';
import OntologyObjectType from '@/services/object/type';
import { IconFont } from '@/web-library/common';
import Fields from '@/web-library/utils/fields';
import styles from './index.module.less';

const types = Fields.DataType_All_Name.map((item) => ({ value: item, label: item }));

export const TYPE_OPTIONS = [...types, { value: 'metric', label: 'metric' }, { value: 'operator', label: 'operator' }];

const canAddIncrementalKeys = ['integer', 'unsigned integer', 'datetime', 'timestamp'];
const canPrimaryKeys = ['integer', 'unsigned integer', 'string'];
const canTitleKeys = ['integer', 'unsigned integer', 'string', 'text', 'float', 'decimal', 'date', 'time', 'datetime', 'timestamp', 'ip', 'boolean'];

const AttrDef = forwardRef(({ fields = [] }: { fields?: OntologyObjectType.Field[] }, ref) => {
  const [dataSource, setDataSource] = useState<OntologyObjectType.Field[]>([]);
  const [title, setTitle] = useState<string>('');
  const [primary_keys, setprimary_keys] = useState<string[]>([]);
  const [incremental_key, setincremental_key] = useState<string>('');

  useImperativeHandle(ref, () => ({
    validateFields: () => {
      return new Promise((resolve, reject) => {
        if (dataSource?.length === 0) {
          resolve([]);
          return;
        }
        if (!title) {
          reject(intl.get('Object.pleaseSelectTitle'));
          return;
        }
        if (primary_keys?.length === 0) {
          reject(intl.get('Object.pleaseSelectPrimaryKey'));
          return;
        }
        const errorFields = dataSource.filter((item) => item?.error?.name || item?.error?.display_name);
        if (errorFields?.length > 0) {
          reject();
        } else {
          resolve(dataSource);
        }
      });
    },
    getFields: () => dataSource,
  }));

  useEffect(() => {
    setDataSource(
      fields.map((item) => {
        if (item.display_key) {
          setTitle(item.name);
        }
        const error = { name: '', display_name: '' };
        error.name = validateInput(item.name, 'name', item.id, fields);
        error.display_name = validateInput(item.display_name, 'display_name', item.id, fields);
        return {
          ...item,
          error,
          primary_key: !!item.primary_key,
        };
      })
    );
  }, [fields]);

  const handleDeleteRow = (id: string) => {
    const newDataSource = dataSource.filter((item) => item.id !== id);
    setDataSource(
      newDataSource.map((item) => ({
        ...item,
        error: {
          name: validateInput(item.name, 'name', item.id, newDataSource),
          display_name: validateInput(item.display_name, 'display_name', item.id, newDataSource),
        },
      }))
    );
  };

  const handleAddRow = () => {
    setDataSource([
      {
        id: nanoid(),
        name: '',
        display_name: '',
        type: undefined,
        comment: '',
        primary_key: false,
        display_key: false,
        error: { name: '', display_name: '' },
      },
      ...dataSource,
    ]);
  };

  useEffect(() => {
    setprimary_keys(dataSource.filter((item) => item.primary_key).map((item) => item.display_name || ''));
    setTitle(dataSource.find((item) => item.display_key)?.display_name || '');
    setincremental_key(dataSource.find((item) => item.incremental_key)?.display_name || '');
  }, [dataSource]);

  const validateInput = (value: string, key: string, recordId: any, currentDataSource?: any[]): string => {
    if (!value) {
      return intl.get('Object.pleaseInputAttributeName');
    }
    if (value.length > 40) {
      return intl.get('Global.maxLength40');
    }
    const currentData = currentDataSource || dataSource;
    if (currentData.some((item: any) => item[key] === value && item.id !== recordId)) {
      return intl.get('Global.nameCannotRepeat');
    }
    if (key === 'name' && !/^[a-z0-9][a-z0-9_-]*$/.test(value)) {
      return intl.get('Global.idPatternError');
    }
    return '';
  };

  const columns: TableColumnProps<OntologyObjectType.Field>[] = [
    {
      title: '',
      dataIndex: 'id',
      width: 40,
      render: (_, record) => {
        return <MinusCircleFilled style={{ color: 'rgba(0, 0, 0, 0.25)' }} onClick={() => handleDeleteRow(record?.id || '')} />;
      },
    },
    {
      title: (
        <>
          <span style={{ color: 'red' }}>*</span>
          <span>{intl.get('Global.attributeName')}</span>
        </>
      ),
      key: 'name',
      dataIndex: 'name',
      width: 280,
      ellipsis: true,
      render: (text, record) => {
        return (
          <InputWithError
            autoFocus={record.id === dataSource[0].id}
            error={record?.error?.name || ''}
            defaultValue={text}
            onBlur={(e) => {
              record.name = e.target.value;

              const error = validateInput(e.target.value, 'name', record.id);
              if (error) {
                record.error['name'] = error;
              } else {
                delete record.error['name'];
              }

              if ((!record.display_name || record.displayNameAdd) && e.target.value) {
                record.display_name = e.target.value;
                record.displayNameAdd = true;

                const displayNameError = validateInput(e.target.value, 'display_name', record.id);
                if (displayNameError) {
                  record.error['display_name'] = displayNameError;
                } else {
                  delete record.error['display_name'];
                }
              }
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : item)));
            }}
          />
        );
      },
    },
    {
      title: (
        <>
          <span style={{ color: 'red' }}>*</span>
          <span>{intl.get('Global.attributeDisplayName')}</span>
        </>
      ),
      key: 'display_name',
      dataIndex: 'display_name',
      width: 280,
      render: (text, record) => {
        return (
          <InputWithError
            // autoFocus={record.id === dataSource[0].id}
            error={record?.error?.display_name || ''}
            defaultValue={text}
            key={!text || record.displayNameAdd ? 'display_name' + text : record.id}
            onBlur={(e) => {
              const error = validateInput(e.target.value, 'display_name', record.id);
              if (error) {
                record.error['display_name'] = error;
              } else {
                delete record.error['display_name'];
              }
              record.display_name = e.target.value;
              if (e.target.value !== record.name) {
                delete record.displayNameAdd;
              }
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : item)));
            }}
          />
        );
      },
    },
    {
      title: intl.get('Global.attributeType'),
      dataIndex: 'type',
      width: 200,
      render: (text: string, record: OntologyObjectType.Field) => {
        return (
          <Select
            style={{
              width: '100%',
            }}
            placeholder={intl.get('Global.pleaseSelect')}
            defaultValue={text}
            onChange={(e) => {
              record.type = e;
              record.display_key = false;
              record.incremental_key = false;
              record.primary_key = false;
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : item)));
            }}
            options={TYPE_OPTIONS}
          />
        );
      },
    },
    {
      title: intl.get('Global.description'),
      width: 280,
      key: 'comment',
      dataIndex: 'comment',
      render: (text, record) => {
        return (
          <InputWithError
            error={''}
            defaultValue={text}
            onBlur={(e) => {
              record.comment = e.target.value;
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : item)));
            }}
          />
        );
      },
    },
    {
      title: intl.get('Global.primaryKey'),
      width: 100,
      align: 'center',
      render: (_, record) => {
        return (
          <Checkbox
            disabled={!(record.type && canPrimaryKeys.includes(record.type))}
            checked={record.primary_key}
            onChange={(e) => {
              record.primary_key = e.target.checked;
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : item)));
            }}
          />
        );
      },
    },
    {
      title: intl.get('Global.title'),
      align: 'center',
      width: 100,
      render: (_, record) => {
        return (
          <Checkbox
            disabled={!(record.type && canTitleKeys.includes(record.type))}
            checked={record.display_key}
            onChange={(e) => {
              record.display_key = e.target.checked;
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : { ...item, display_key: false })));
            }}
          />
        );
      },
    },
    {
      title: intl.get('Object.incremental'),
      align: 'center',
      width: 100,
      render: (_, record) => {
        return (
          <Checkbox
            disabled={!(record.type && canAddIncrementalKeys.includes(record.type))}
            checked={record.incremental_key}
            onChange={(e) => {
              record.incremental_key = e.target.checked;
              setDataSource((prev) => prev.map((item) => (item.id === record.id ? record : { ...item, incremental_key: false })));
            }}
          />
        );
      },
    },
  ];

  return (
    <div className={styles.attrDefBox}>
      <div className={styles.titleBox}>
        <div className={styles.title}>{intl.get('Object.attribute')}</div>
        <div className={styles.addBtn} onClick={() => handleAddRow()}>
          <IconFont type="icon-dip-add" />
          <div>{intl.get('Global.add')}</div>
        </div>
      </div>
      <div className={styles.keyTitleBox}>
        <div className={styles.keyTitleItem}>
          <div className={styles.keyTitleItemTop}>
            <div>
              <span style={{ color: 'rgba(255, 0, 0, 0.85)', marginRight: 2 }}>*</span>
              <span>{intl.get('Global.primaryKey')}</span>
            </div>
            <Popover content={intl.get('Object.primaryKeyTip')} placement="topRight">
              <QuestionCircleFilled className={styles.questionIcon} />
            </Popover>
          </div>
          <div className={styles.keyTitleItemBottom}>
            {primary_keys.map((item: string) => (
              <div className={styles.keyItem} key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.keyTitleItem}>
          <div className={styles.keyTitleItemTop}>
            <div>
              <span style={{ color: 'rgba(255, 0, 0, 0.85)', marginRight: 2 }}>*</span>
              <span>{intl.get('Global.title')}</span>
            </div>
            <Popover content={intl.get('Object.titleTip')}>
              <QuestionCircleFilled className={styles.questionIcon} />
            </Popover>
          </div>
          <div className={styles.keyTitleItemBottom}>{title && <div>{title}</div>}</div>
        </div>
        <div className={styles.keyTitleItem}>
          <div className={styles.keyTitleItemTop}>
            <div>
              <span>{intl.get('Object.incremental')}</span>
            </div>
            <Popover content={intl.get('Object.incrementalTip')}>
              <QuestionCircleFilled className={styles.questionIcon} />
            </Popover>
          </div>
          <div className={styles.keyTitleItemBottom}>{incremental_key && <div>{incremental_key}</div>}</div>
        </div>
      </div>
      <Table rowKey="id" style={{ width: '100%' }} scroll={{ y: 'calc(100vh - 400px)' }} columns={columns} dataSource={dataSource} pagination={false} />
    </div>
  );
});

AttrDef.displayName = 'AttrDef';

export default AttrDef;
