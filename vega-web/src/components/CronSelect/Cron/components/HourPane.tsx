// TODO: 开源社区Cory过来的，待重构
// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Col, InputNumber, Radio, Row } from 'antd';
import { getIntl } from '../../CronSelect';

const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;

const radioStyle = {
  display: 'block',
  paddingBottom: '6px',
};

function HourPane(props: any): JSX.Element {
  const { value, onChange } = props;
  const [currentRadio, setCurrentRadio] = useState(1);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(10);
  const [offsetFrom, setOffsetFrom] = useState(0);
  const [offset, setOffset] = useState(1);
  const [selected, setSelected] = useState([]);

  const isFirstRender = React.useRef();

  if (isFirstRender.current !== false) {
    isFirstRender.current = true;
  }

  useEffect(() => {
    if (value === '*') {
      setCurrentRadio(1);
    } else if (value === '?') {
      setCurrentRadio(5);
    } else if (value.indexOf('-') > -1) {
      setCurrentRadio(2);
      const [defaultFrom, defaultTo] = value.split('-');

      setFrom(parseInt(defaultFrom, 10));
      setTo(parseInt(defaultTo, 10));
    } else if (value.indexOf('/') > -1) {
      setCurrentRadio(3);
      const [defaultOffsetFrom, defaultOffset] = value.split('/');

      setOffsetFrom(parseInt(defaultOffsetFrom, 10));
      setOffset(parseInt(defaultOffset, 10));
    } else {
      setCurrentRadio(4);
      setSelected(value ? value.split(',') : ['0']);
    }
  }, [value]);

  useEffect(() => {
    if (!isFirstRender.current) {
      switch (currentRadio) {
        case 1:
          onChange('*');
          break;
        case 2:
          onChange(`${from}-${to}`);
          break;
        case 3:
          onChange(`${offsetFrom}/${offset}`);
          break;
        case 4:
          onChange(selected.join(','));
          break;
        case 5:
          onChange('?');
          break;
        default:
          break;
      }
    }
  }, [currentRadio, from, to, offsetFrom, offset, selected]);

  const onChangeRadio = useCallback((e) => {
    setCurrentRadio(e.target.value);
  }, []);

  const onChangeFrom = useCallback((v) => {
    if (v >= 0) {
      setFrom(v || 0);
    }
  }, []);

  const onChangeTo = useCallback((v) => {
    if (v >= 0) {
      setTo(v || 0);
    }
  }, []);

  const onChangeOffsetFrom = useCallback((v) => {
    if (v >= 0) {
      setOffsetFrom(v || 0);
    }
  }, []);

  const onChangeOffset = useCallback((v) => {
    if (v >= 0) {
      setOffset(v || 0);
    }
  }, []);

  const onChangeSelected = useCallback((v) => {
    setSelected(v.length !== 0 ? v.sort((a, b) => a - b) : []);
  }, []);

  const checkList = useMemo(() => {
    const disabled = currentRadio !== 4;
    const checks = [];

    for (let i = 0; i < 24; i++) {
      checks.push(
        <Col key={i} span={4}>
          <Checkbox disabled={disabled} value={i.toString()}>
            {i}
          </Checkbox>
        </Col>
      );
    }

    return checks;
  }, [currentRadio, selected]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const aTobA = <InputNumber disabled={currentRadio !== 2} min={0} max={23} value={from} size="small" onChange={onChangeFrom} style={{ width: 100 }} />;
  const aTobB = <InputNumber disabled={currentRadio !== 2} min={0} max={23} value={to} size="small" onChange={onChangeTo} style={{ width: 100 }} />;

  const aStartTobA = (
    <InputNumber disabled={currentRadio !== 3} min={0} max={23} value={offsetFrom} size="small" onChange={onChangeOffsetFrom} style={{ width: 100 }} />
  );
  const aStartTobB = (
    <InputNumber disabled={currentRadio !== 3} min={0} max={23} value={offset} size="small" onChange={onChangeOffset} style={{ width: 100 }} />
  );

  return (
    <RadioGroup name="radiogroup" value={currentRadio} onChange={onChangeRadio}>
      <Radio style={radioStyle} value={1}>
        {getIntl('everyHour')}
      </Radio>
      {/* <Radio style={radioStyle} value={5}>
        {getIntl('noSpecify')}
      </Radio> */}

      <Radio style={radioStyle} value={2}>
        <>
          {getIntl('from')}&nbsp;
          {aTobA}
          &nbsp;-&nbsp;
          {aTobB}
          &nbsp;{getIntl('excuteOnceEveryHour')}
        </>
      </Radio>

      <Radio style={radioStyle} value={3}>
        <>
          {getIntl('from')}&nbsp;
          {aStartTobA}
          &nbsp;{getIntl('hourStart')}&nbsp;
          {aStartTobB}
          &nbsp;{getIntl('hourExcuteOnce')}
        </>
      </Radio>

      <Radio style={radioStyle} value={4}>
        {getIntl('specify')}
        <br />
        <CheckboxGroup value={selected} onChange={onChangeSelected}>
          <Row> {checkList}</Row>
        </CheckboxGroup>
      </Radio>
    </RadioGroup>
  );
}

export default HourPane;
