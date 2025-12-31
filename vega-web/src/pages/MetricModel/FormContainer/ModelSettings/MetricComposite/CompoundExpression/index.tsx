import { useRef, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Spin, Menu, MenuProps } from 'antd';
import _ from 'lodash';
import MonacoEditor from '@/components/MonacoEditor';
import { TEMPLATE_REGEX } from '@/hooks/useConstants';
import { Input } from '@/web-library/common';
import styles from './index.module.less';

/** 替换字符串为对象中的字段 */
const replaceTemplate = (string: string, object: any, field: string) => {
  if (!string) return undefined;
  return string.replace(TEMPLATE_REGEX, (match, key) => {
    return !!object?.[key] ? `{{${object?.[key]?.[field]}}}` : match;
  });
};

const CompoundExpression = (props: any) => {
  const { value, onChange } = props;
  const { loading, menuItems, menuItemsKV, getMetricList } = props;
  const monacoRef: any = useRef<any>(null);

  const editValue = useMemo(() => {
    return replaceTemplate(value, menuItemsKV, 'name');
  }, [value, menuItemsKV]);

  // 按名称筛选指标
  const onChangeInput = _.debounce((data: any) => {
    const value = data.target.value;
    getMetricList(value);
  }, 300);

  /** 点击 menu item */
  const onMenuClick = (data: any) => {
    const key = data.key;
    const item = menuItemsKV[key];
    monacoRef.current.onInsertText(`{{${item.name}}}`);
  };

  const onChangeEditor = (data: any) => {
    if (onChange) onChange(_.trim(data));
  };

  const items: MenuProps['items'] = _.map(menuItems, (item: any) => {
    const { id, name } = item;
    return { key: id, label: name, title: name, data: item };
  });

  return (
    <div className={styles['compound-expression-root']}>
      <div className={styles['compound-expression-list']}>
        <div className="g-p-4 g-pb-0">
          <Input.Search allowClear placeholder={intl.get('Global.search')} onChange={onChangeInput} />
        </div>
        <div style={{ height: 'calc(100% - 52px)', width: '100%', padding: '8px 0', overflowY: 'auto' }}>
          <Spin spinning={loading}>
            <Menu mode="inline" items={items} style={{ minHeight: 330 }} onClick={onMenuClick} />
          </Spin>
        </div>
      </div>
      <div className={styles['compound-expression-code']}>
        <MonacoEditor.Compound
          ref={monacoRef}
          value={editValue}
          width={508}
          height={368}
          placeholder={intl.get('MetricModel.youCanClickLeftSideToReference')}
          onChange={onChangeEditor}
        />
      </div>
    </div>
  );
};

export default CompoundExpression;
