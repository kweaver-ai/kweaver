// TODO: 开源社区Cory过来的，待重构
// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Col, Radio, Row } from 'antd';
import WeekSelect, { weekOptionsObj } from './WeekSelect';
import { getIntl } from '../../CronSelect';

const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;

const radioStyle = {
  display: 'block',
  paddingBottom: '6px',
};

const weekOptions = ['1', '2', '3', '4', '5', '6', '7'];

function WeekPane(props: any): JSX.Element {
  const { value, onChange } = props;
  const [currentRadio, setCurrentRadio] = useState(2);
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('2');
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('2');
  const [lastWeekOfMonth, setLastWeekOfMonth] = useState('2');
  const [selected, setSelected] = useState([]);

  const isFirstRender = React.useRef();

  if (isFirstRender.current !== false) {
    isFirstRender.current = true;
  }
  useEffect(() => {
    if (value === '*') {
      setCurrentRadio(1);
    } else if (value === '?') {
      setCurrentRadio(2);
    } else if (value.indexOf('-') > -1) {
      setCurrentRadio(3);
      const [defaultFrom, defaultTo] = value.split('-');

      setFrom(defaultFrom);
      setTo(defaultTo);
    } else if (value.indexOf('#') > -1) {
      setCurrentRadio(4);
      const [defaultDayOfWeek, defaultWeekOfMonth] = value.split('#');

      setWeekOfMonth(parseInt(defaultWeekOfMonth, 10));
      setDayOfWeek(defaultDayOfWeek);
    } else if (value.indexOf('L') > -1) {
      setCurrentRadio(5);
      const [defaultLastWeekOfMonth] = value.split('L');

      setLastWeekOfMonth(defaultLastWeekOfMonth);
    } else {
      setCurrentRadio(6);
      setSelected(value ? value.split(',') : ['1']);
    }
  }, [value]);

  useEffect(() => {
    if (!isFirstRender.current) {
      switch (currentRadio) {
        case 1:
          onChange('*');
          break;
        case 2:
          onChange('?');
          break;
        case 3:
          onChange(`${from}-${to}`);
          break;
        case 4:
          onChange(`${dayOfWeek}#${weekOfMonth}`);
          break;
        case 5:
          onChange(`${lastWeekOfMonth}L`);
          break;
        case 6:
          onChange(selected.join(','));
          break;
        default:
          break;
      }
    }
  }, [currentRadio, from, to, weekOfMonth, dayOfWeek, lastWeekOfMonth, selected]);

  const onChangeRadio = useCallback((e) => {
    setCurrentRadio(e.target.value);
  }, []);

  const onChangeFrom = useCallback((v) => {
    setFrom(v || '2');
  }, []);

  const onChangeTo = useCallback((v) => {
    setTo(v || '2');
  }, []);

  // const onChangeWeekOfMonth = useCallback(v => {
  //   setWeekOfMonth(v || 1);
  // }, []);

  // const onChangeDayOfWeek = useCallback(v => {
  //   setDayOfWeek(v || '2');
  // }, []);

  // const onChangeLastWeekOfMonth = useCallback(v => {
  //   setLastWeekOfMonth(v || '2');
  // }, []);

  const onChangeSelected = useCallback((v) => {
    setSelected(v.length !== 0 ? v.sort((a, b) => a - b) : []);
  }, []);

  const checkList = useMemo(() => {
    const disabled = currentRadio !== 6;

    return weekOptions.map((item) => {
      return (
        <Col key={item} span={3}>
          <Checkbox disabled={disabled} value={item}>
            {weekOptionsObj[item]}
          </Checkbox>
        </Col>
      );
    });
  }, [currentRadio, selected]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const aTobA = <WeekSelect disabled={currentRadio !== 3} value={from} size="small" onChange={onChangeFrom} style={{ width: 100 }} />;
  const aTobB = <WeekSelect disabled={currentRadio !== 3} value={to} size="small" onChange={onChangeTo} style={{ width: 100 }} />;

  // const aStartTobA = (
  //   <InputNumber
  //     disabled={currentRadio !== 4}
  //     min={0}
  //     max={5}
  //     value={weekOfMonth}
  //     size="small"
  //     onChange={onChangeWeekOfMonth}
  //     style={{ width: 100 }}
  //   />
  // );
  // const aStartTobB = (
  //   <WeekSelect
  //     disabled={currentRadio !== 4}
  //     value={dayOfWeek}
  //     size="small"
  //     onChange={onChangeDayOfWeek}
  //     style={{ width: 100 }}
  //   />
  // );

  // const aStartTob2A = (
  //   <WeekSelect
  //     disabled={currentRadio !== 5}
  //     value={lastWeekOfMonth}
  //     size="small"
  //     onChange={onChangeLastWeekOfMonth}
  //     style={{ width: 100 }}
  //   />
  // );

  return (
    <RadioGroup name="radiogroup" value={currentRadio} onChange={onChangeRadio}>
      <Radio style={radioStyle} value={1}>
        {getIntl('everyWeek')}
      </Radio>

      <Radio style={radioStyle} value={2}>
        {getIntl('noSpecify')}
      </Radio>

      <Radio style={radioStyle} value={3}>
        <>
          {getIntl('from')}&nbsp;
          {aTobA}
          &nbsp;-&nbsp;
          {aTobB}
          &nbsp;{getIntl('excuteOnceEveryWeek')}
        </>
      </Radio>

      {/* <Radio style={radioStyle} value={4}>
        <>
          {getIntl('thisMonthAt')}&nbsp;
          {aStartTobA}
          &nbsp;{getIntl('weeks')}&nbsp;
          {aStartTobB}
          &nbsp;{getIntl('excuteOnce')}
        </>
      </Radio> */}

      {/* <Radio style={radioStyle} value={5}>
        <>
          {getIntl('thisMonthAtLast')}&nbsp;
          {aStartTob2A}
          &nbsp;{getIntl('excuteOnce')}
        </>
      </Radio> */}

      <Radio style={radioStyle} value={6}>
        {getIntl('specify')}
        <br />
        <CheckboxGroup value={selected} onChange={onChangeSelected}>
          <Row gutter={8}>{checkList}</Row>
        </CheckboxGroup>
      </Radio>
    </RadioGroup>
  );
}

export default WeekPane;
