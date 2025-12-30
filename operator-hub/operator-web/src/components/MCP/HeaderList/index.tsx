import { useMemo } from 'react';
import { Button, Form, Input, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import styles from './index.module.less';

interface HeaderListProps {
  value?: Record<string, string>;
  onChange?: (data: Record<string, string>) => void;
}

const HeaderList = ({ value, onChange }: HeaderListProps) => {
  const [form] = Form.useForm();

  // 初始化表单的值。将对象转换为数组格式
  const initialValues = useMemo(() => {
    // 将对象转换为数组格式 [{key: '', value: ''}, ...]
    const headersArray = value ? Object.entries(value).map(([key, val]) => ({ key, value: val })) : [];

    return {
      headers: headersArray,
    };
  }, []);

  // 使用 Form.List 管理动态表单项
  const onValuesChange = (changedValues, allValues) => {
    // 确保当 form 内部的值变化时，通过 onChange 传给父组件
    if (changedValues.headers) {
      // 过滤掉 key 为空字符串的项
      const filteredData = allValues.headers.filter(item => item && item.key);

      // 将数组转换为对象格式 {key1: value1, key2: value2, ...}
      const headersObject = filteredData.reduce((acc, item) => {
        if (item.key) {
          acc[item.key] = item.value || '';
        }
        return acc;
      }, {});

      onChange?.(headersObject);
    }
  };

  // Antd Form 依赖 Form.Item 渲染，因此我们用 div 结构来模拟表头
  const HeaderRow = () => (
    <div className={styles['header-row']}>
      <span className={styles['key-col']}>Key</span>
      <span className={styles['value-col']}>Value</span>
      <span className={styles['operation-col']}>操作</span>
    </div>
  );

  return (
    <Form
      name="header_list_form"
      form={form}
      onValuesChange={onValuesChange}
      initialValues={initialValues}
      autoComplete="off"
      // 禁用 antd 默认的 label/wrapper 布局，让我们可以自己控制布局
      layout="vertical"
      className={styles['header-list-container']}
    >
      {/* 渲染表头 */}
      {form.getFieldValue('headers')?.length > 0 && <HeaderRow />}

      <Form.List name="headers">
        {(fields, { add, remove }) => (
          <>
            {/* 列表内容 */}
            <div
              className={classNames({
                'dip-mb-12': fields.length > 0,
              })}
            >
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className={styles['data-row']}>
                  {/* Key 输入框 */}
                  <Form.Item {...restField} name={[name, 'key']} className={styles['key-col']}>
                    <Input placeholder="请输入" />
                  </Form.Item>

                  {/* Value 输入框 */}
                  <Form.Item {...restField} name={[name, 'value']} className={styles['value-col']}>
                    <Input placeholder="请输入" />
                  </Form.Item>

                  {/* 操作 - 删除按钮 */}
                  <div className={styles['operation-col']}>
                    <Typography.Link onClick={() => remove(name)}>删除</Typography.Link>
                  </div>
                </div>
              ))}
            </div>

            {/* 添加按钮 */}
            <Button
              type="link"
              onClick={() => add({ key: '', value: '' }, fields.length)} // 确保添加到末尾
              icon={<PlusOutlined />}
              className={styles['add-button']}
            >
              添加
            </Button>
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default HeaderList;
