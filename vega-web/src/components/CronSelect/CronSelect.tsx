/**
 * @file 基于 BaseCronSelect 封装的选择器（输入框 + 气泡面板）组合版
 */
import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { useControllableValue } from 'ahooks';
import { Input, Popover } from 'antd';
import getLocaleValue from '@/utils/get-locale-value/getLocaleValue';
import BaseCronSelect from './BaseCronSelect';
import styles from './index.module.less';
import english from './locale/en-US';
import chinese from './locale/zh-CN';
import type { CronSelectProps } from './types';

export const getIntl = getLocaleValue.bind(null, chinese, english);

const CronSelect = React.memo<CronSelectProps>((props): JSX.Element => {
  const { inputProps, cronSelectProps, value, onChange } = props;

  const [visible, setVisible] = useControllableValue(props, {
    defaultValue: false,
    valuePropName: 'visible',
    trigger: 'onVisibleChange',
  });

  const handleClose = (): void => setVisible(false);

  const content = (
    <BaseCronSelect
      {...cronSelectProps}
      value={value}
      onChange={(value): void => {
        onChange && onChange(value);
        setVisible(false);
      }}
      onClose={handleClose}
    />
  );

  return (
    <Input
      {...inputProps}
      value={value}
      onChange={(e): void => {
        onChange && onChange(e.target.value);
      }}
      allowClear
      placeholder={getIntl('pleaseInput')}
      addonAfter={
        <Popover destroyOnHidden content={content} trigger="click" open={visible} overlayClassName={styles['ar-cron-wrapper']}>
          <EditOutlined onClick={() => setVisible(!visible)} />
        </Popover>
      }
    />
  );
});

export default CronSelect;
