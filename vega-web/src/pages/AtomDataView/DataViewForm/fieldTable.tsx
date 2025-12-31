import intl from 'react-intl-universal';
import { Table, Input, Form, Button, Select } from 'antd';
import AtomDataViewType from '@/services/atomDataView/type';
import HOOKS from '@/hooks';
import styles from './index.module.less';

interface TProps {
  dataSource?: AtomDataViewType.Field[];
  page: number;
  setPage: (val: number) => void;
  isEdit: boolean;
  editingKey?: string;
  setEditingKey: (val?: string) => void;
  onChange: (val: AtomDataViewType.Field[]) => void;
}

const EditableTable = ({ isEdit, page, setPage, dataSource = [], editingKey, setEditingKey, onChange }: TProps): JSX.Element => {
  const [form] = Form.useForm();
  const { message } = HOOKS.useGlobalContext();
  const { EXCEL_DATA_TYPES } = HOOKS.useConstants();
  const cancel = (): void => {
    setEditingKey();
  };

  const dataSourceNames = (field: keyof AtomDataViewType.Field): string[] => {
    return dataSource.filter((val) => val.original_name !== editingKey).map((val) => val[field]) as string[];
  };

  const businessNameValidator = (_: unknown, value: string, callback: (arg0?: string) => void): void => {
    if (!value) {
      callback(intl.get('Global.cannotBeNull'));
    }

    if (value && value.length > 255) {
      callback(intl.get('DataView.displayNameMaxLength'));
    }

    callback();
  };

  const technicalNameValidator = (_: unknown, value: string, callback: (arg0?: string) => void): void => {
    if (!value) {
      callback(intl.get('Global.cannotBeNull'));
    }

    if (value && value.length > 100) {
      callback(intl.get('DataView.fieldNameMaxLength'));
    }

    if (value && !/^[a-z_][a-z0-9_]{0,}$/.test(value)) {
      callback(intl.get('Global.idSpecialVerification'));
    }

    callback();
  };

  const save = (record: AtomDataViewType.Field): void => {
    form.validateFields().then((row) => {
      if (dataSourceNames('display_name').includes(row.display_name)) {
        message.error(intl.get('Global.nameCannotRepeat'));

        return;
      }
      if (dataSourceNames('name').includes(row.name)) {
        message.error(intl.get('Global.fieldNameCannotRepeat'));

        return;
      }
      const newData = dataSource.map((val) => {
        if (record.original_name === val.original_name) {
          return {
            ...val,
            ...row,
          };
        }

        return val;
      });

      onChange(newData);
      setEditingKey();
    });
  };

  const edit = (record: AtomDataViewType.Field): void => {
    setEditingKey(record.original_name);
    form.setFieldsValue(record);
  };

  // 知识条目项 Table 列中不确定的列
  const uncertainColumns: any = [
    {
      title: intl.get('Global.fieldDisplayName'),
      dataIndex: 'display_name',
      key: 'display_name',
      editable: true,
      rules: [{ validator: businessNameValidator }],
      width: 100,
    },
    {
      title: intl.get('Global.fieldName'),
      dataIndex: 'name',
      key: 'name',
      rules: [{ validator: technicalNameValidator }],
      editable: !isEdit,
      width: 100,
    },
    {
      title: intl.get('Global.fieldType'),
      dataIndex: 'type',
      key: 'type',
      editable: !isEdit,
      rules: [],
      width: 100,
      render: (text: string): JSX.Element | string => text || '--',
    },
    {
      title: intl.get('Global.fieldComment'),
      dataIndex: 'comment',
      key: 'comment',
      rules: [],
      editable: true,
      width: 200,
    },
  ];

  // 知识条目项 Table 列中确定的列
  const certainColumns = [
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operate',
      key: 'operate',
      width: 120,
      render: (_: unknown, record: AtomDataViewType.Field): JSX.Element => {
        return record.original_name === editingKey ? (
          <span style={{ marginTop: '10px' }}>
            <Button type="link" onClick={(): void => save(record)} style={{ marginRight: 12 }}>
              {intl.get('Global.save')}
            </Button>
            <Button type="link" onClick={(): void => cancel()}>
              {intl.get('Global.cancel')}
            </Button>
          </span>
        ) : (
          <div>
            <Button disabled={!!editingKey} onClick={(): void => edit(record)} type="link" style={{ marginRight: 12 }}>
              {intl.get('Global.edit')}
            </Button>
          </div>
        );
      },
    },
  ];

  const dictItemColumns = [...uncertainColumns, ...certainColumns];

  const columns: any = dictItemColumns.map((col) => {
    const renderItem = (text: string, record: AtomDataViewType.Field, colProps: { dataIndex: string; rules: any }): JSX.Element | string => {
      const { dataIndex, rules } = colProps;
      const getInput = (): JSX.Element => {
        if (dataIndex === 'type') {
          return (
            <Select>
              {EXCEL_DATA_TYPES.map((item) => (
                <Select.Option value={item.value} key={item.value}>
                  {`${item.value} (${item.label})`}
                </Select.Option>
              ))}
            </Select>
          );
        }

        return <Input />;
      };

      if (record.original_name === editingKey) {
        return (
          <Form.Item style={{ margin: 0 }} name={dataIndex} initialValue={record[dataIndex as keyof AtomDataViewType.Field]} rules={rules}>
            {getInput()}
          </Form.Item>
        );
      }

      return text || '--';
    };

    if (col.editable) {
      return {
        ...col,
        render: (text: string, record: AtomDataViewType.Field): JSX.Element | string => renderItem(text, record, col),
      };
    }

    return col;
  });

  return (
    <Form form={form} component={false}>
      <Table
        rowKey="original_name"
        size="small"
        columns={columns}
        dataSource={dataSource}
        className={styles['dict-box']}
        scroll={{ y: 360 }}
        onChange={(pagination): void => setPage(pagination.current ?? 1)}
        pagination={
          dataSource.length <= 10
            ? false
            : {
                current: page,
                total: dataSource.length,
                size: 'small',
                disabled: !!editingKey,
                onChange: cancel,
              }
        }
      />
    </Form>
  );
};

export default EditableTable;
