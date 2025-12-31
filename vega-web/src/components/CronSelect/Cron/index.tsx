/** 生成 cron 字符串的 React 组件 */
import React, { useEffect, useMemo, useState } from 'react';
import { useDeepCompareEffect, useSetState } from 'ahooks';
import { Button, Card, Tabs } from 'antd';
import classNames from 'classnames';
import { compact, defaultTo, map, zipObject } from 'lodash';
import { getIntl } from '../CronSelect';
import DayConfigPanel from './components/DayConfigPanel';
import HourPane from './components/HourPane';
import MinutePane from './components/MinutePane';
import MonthPane from './components/MonthPane';
import SecondPane from './components/SecondPane';
import WeekPane from './components/WeekPane';
import YearPane from './components/YearPanel';
import { DEFAULTS } from './constants';
import { ContextProvider } from './Context';
import styles from './index.module.less';
import { CronFieldName, getOptionsWithDefaultValue, validateCronField } from './utils';
import type { CronFieldValues, CronProps } from './types';

const { SECOND, MINUTE, HOUR, DAY, MONTH, WEEK, YEAR } = CronFieldName;
const Footer = React.memo<{ children: React.ReactNode }>(({ children }) => <footer className={styles['react-cron-select-footer']}>{children}</footer>);

const Cron = React.memo<CronProps>((props): JSX.Element => {
  const { className, style, value: propsValue, onOk, footer, getCronFns, options: propsOptions } = props;

  const options = getOptionsWithDefaultValue(propsOptions);
  const { defaultTab, panelTitle, showPreviewValue, panesShow, showFooter, onOkBtnProps } = options;

  const [currentTab, setCurrentTab] = useState<CronFieldName>(defaultTab);
  const [state, setState] = useSetState<CronFieldValues>(DEFAULTS);

  const { second, minute, hour, day, month, week, year } = state;

  const cronValue = useMemo(() => [second, minute, hour, day, month, week].join(' '), [second, minute, hour, day, month, week]);

  const parseValueToView = async (): Promise<any> => {
    if (!propsValue) return {};

    const values = propsValue.split(' ');
    const cronFields = Object.keys(DEFAULTS) as CronFieldName[];
    const defaults = Object.values(DEFAULTS);

    const validatedValues = map(defaults, (val, index) => (validateCronField(values[index], cronFields[index]) ? values[index] : val));

    // 处理 week 字段的特殊情况，如果 day 字段不是 '*'，week 字段应为 '?'
    if (validatedValues[3] !== '*' && validatedValues[5] === '*') validatedValues[5] = '?';
    const result = zipObject(cronFields, validatedValues);
    setState(result as CronFieldValues);

    return { propsValue, ...result };
  };

  useEffect(() => {
    getCronFns && getCronFns({ onParse: parseValueToView, getValue: () => cronValue });
  }, [cronValue]);

  useDeepCompareEffect(() => {
    parseValueToView();
  }, [propsValue]);

  const handleTabsChange: any = (activeKey: any) => {
    setCurrentTab(activeKey as any);
  };

  const handleChange = (value: string, type: CronFieldName) => {
    if (type === 'day') {
      const values = value !== '?' ? { week: '?' } : { week };
      setState({ day: value, week: values.week });
      return;
    }

    if (type === 'week') {
      const values = value !== '?' ? { day: '?' } : { day };
      setState({ week: value, day: values.day });
      return;
    }

    const newValue = { [type]: value } as CronFieldValues;

    setState(newValue);
  };

  const handleGenerate = (): void => {
    onOk && onOk(cronValue);
  };

  const renderDefaultFooter = (): React.ReactNode => {
    if (!showFooter) return null;

    return (
      <React.Fragment>
        <Button type="default" onClick={parseValueToView}>
          解析到UI
        </Button>
        <Button {...onOkBtnProps} type="primary" onClick={handleGenerate}>
          生成
        </Button>
      </React.Fragment>
    );
  };

  const renderPane = (Component: React.ComponentType<any>, v: string | undefined, key: CronFieldName): JSX.Element => (
    <Component value={v} onChange={(v: string): void => handleChange(v, key)} key={key} />
  );

  const tabItems = useMemo((): any => {
    const items = compact([
      panesShow.second && {
        label: getIntl('second'),
        key: SECOND,
        value: SECOND,
        children: renderPane(SecondPane, second, SECOND),
      },
      panesShow.minute && {
        label: getIntl('minute'),
        key: MINUTE,
        value: MINUTE,
        children: renderPane(MinutePane, minute, MINUTE),
      },
      panesShow.hour && {
        label: getIntl('hour'),
        key: HOUR,
        value: HOUR,
        children: renderPane(HourPane, hour, HOUR),
      },
      panesShow.day && {
        label: getIntl('day'),
        key: DAY,
        value: DAY,
        children: renderPane(DayConfigPanel, day, DAY),
      },
      panesShow.week && {
        label: getIntl('week'),
        key: WEEK,
        value: WEEK,
        children: renderPane(WeekPane, week, WEEK),
      },
      panesShow.month && {
        label: getIntl('month'),
        key: MONTH,
        value: MONTH,
        children: renderPane(MonthPane, month, MONTH),
      },
      panesShow.year && {
        label: getIntl('year'),
        key: YEAR,
        value: YEAR,
        children: renderPane(YearPane, year, YEAR),
      },
    ]);

    return items;
  }, [panesShow]);

  return (
    <Card
      className={classNames(styles['react-cron-select'], className)}
      style={defaultTo(style, { width: 630 })}
      styles={{ body: { padding: '4px 24px 0' } }}
      title={panelTitle}
      extra={showPreviewValue && <b>{cronValue}</b>}
    >
      {/* 配置面板选项 */}
      <Tabs activeKey={currentTab} items={tabItems} onChange={handleTabsChange} />

      {/* 配置面板页脚 */}
      <Footer>{footer || renderDefaultFooter()}</Footer>
    </Card>
  );
});

const withContextComponentWrapper = React.memo<CronProps>(
  (props): JSX.Element => (
    // options 配置注入 Context 中共享到上下文, 方便后续组件维护
    // 根组件直接消费 props => options 即可, Context 中的数据主要应用于 Child Component 中
    <ContextProvider value={props?.options}>
      <Cron {...props} />
    </ContextProvider>
  )
);

withContextComponentWrapper.displayName = 'Cron';

export default withContextComponentWrapper;
