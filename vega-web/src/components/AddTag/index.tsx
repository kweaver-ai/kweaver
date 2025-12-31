import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { Button, IconFont, Input } from '@/web-library/common';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';

interface TagItemProps {
  data: { type?: string; displayName?: string; display_name?: string; comment?: string };
  disabled?: boolean;
  onDelete?: () => void;
}

const TagItem = (props: TagItemProps) => {
  const { data, disabled, onDelete } = props;
  const { type, displayName, display_name, comment } = data || {};
  const icon = type ? UTILS.formatIconByType(type) : '';

  return (
    <div className={styles['vega-form-tag-item']} title={comment}>
      <IconFont className="g-mr-1" type={icon} />
      <span className={classNames('g-ellipsis-1', { 'g-mr-2': !disabled })}>{displayName || display_name}</span>
      {!!onDelete && <Button.Icon size="small" disabled={disabled} icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={onDelete} />}
    </div>
  );
};

const AddTag = (props: any) => {
  const { value, onChange } = props;
  const { options, disabled, canSelect = true, onlyKey, constantValue } = props;

  const [showConstant, setShowConstant] = useState(true);
  const [filterOptions, setFilterOptions] = useState(_.cloneDeep(options));
  useEffect(() => {
    setFilterOptions(options);
  }, [options]);

  const optionsKV = _.keyBy(_.cloneDeep(options), 'name');
  const valueString = _.map(value, (item) => item?.name || item);

  /** 筛选待选项 */
  const onSearchChange = (data: any) => {
    const value = data.target.value;
    const newFiletFields = _.filter(_.cloneDeep(options), (item) => _.includes(item.name, value));
    setFilterOptions(newFiletFields);
  };

  /** 添加标签 */
  const onAdd = (data: any) => {
    const newValue = _.cloneDeep(value) || [];
    if (onlyKey) {
      newValue.push(data.name);
    } else {
      newValue.push({ name: data.name, type: data.type });
    }

    onChange(newValue);
  };

  /** 删除标签 */
  const onDelete = (data: any) => {
    let newValue = [];
    if (onlyKey) {
      newValue = _.filter(_.cloneDeep(value), (item: any) => item !== data);
    } else {
      newValue = _.filter(_.cloneDeep(value), (item: any) => item.name !== data.name);
    }
    onChange(newValue);
  };

  return (
    <div className={styles['vega-form-tag-root']}>
      {canSelect && (
        <Dropdown
          trigger={['click']}
          destroyOnHidden
          getPopupContainer={(triggerNode): HTMLElement => triggerNode.parentNode as HTMLElement}
          popupRender={() => (
            <div className="g-dropdown-menu-root" style={{ width: 260 }}>
              <Input.Search className="g-mt-2 g-mb-4" allowClear placeholder={intl.get('Global.search')} onChange={onSearchChange} />
              <div className={styles['vega-form-tag-options-container']}>
                {_.map(filterOptions, (item, index) => {
                  const icon = UTILS.formatIconByType(item?.type);
                  const selected = _.includes(valueString, item.name);
                  return (
                    <div
                      key={index}
                      className={classNames(styles['vega-form-tag-options'], { [styles['vega-form-tag-options-disabled']]: selected })}
                      onClick={() => {
                        if (!selected) onAdd(item);
                      }}
                      title={item.comment}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <IconFont className="g-mr-1 g-mt-1" type={icon} style={{ fontSize: 18 }} />
                        <div>
                          <div className="g-ellipsis-1">{item?.displayName}</div>
                          <div className="g-ellipsis-1 g-c-text-sub">{item?.name}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        >
          <Button className="g-mr-2 g-mb-2" disabled={disabled} icon={<IconFont type="icon-add" />}>
            {intl.get('Global.add')}
          </Button>
        </Dropdown>
      )}
      {!!constantValue && showConstant && <TagItem data={constantValue} disabled={disabled} onDelete={() => setShowConstant(false)} />}
      {_.map(value, (item, index) => {
        const data = onlyKey ? optionsKV[item] : optionsKV[item.name];
        return <TagItem key={index} data={data} disabled={disabled} onDelete={disabled ? undefined : () => onDelete(item)} />;
      })}
    </div>
  );
};

export default AddTag;
