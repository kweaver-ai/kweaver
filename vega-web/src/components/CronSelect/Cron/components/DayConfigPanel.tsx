// TODO: 开源社区Cory过来的，待重构
// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, InputNumber, Radio, Row, Col } from 'antd';
import { isEmpty } from 'lodash';
import { getIntl } from '../../CronSelect';
import type { BaseConfigProps } from '../types';
import type { InputNumberProps } from 'antd';

const commonInputNumberProps: InputNumberProps = {
  size: 'small',
  min: 1,
  max: 31,
  style: { width: 100 },
};

const radioStyle = {
  display: 'flex',
  paddingBottom: '6px',
};

const DayConfigPanel = React.memo<BaseConfigProps>((props): JSX.Element => {
  const { value, onChange } = props;
  const [currentRadioValue, setCurrentRadioValue] = useState(1);
  const [fromValue, setFromValue] = useState(1);
  const [toValue, setToValue] = useState(10);
  const [offsetFrom, setOffsetFrom] = useState(1);
  const [offset, setOffset] = useState(1);
  const [selected, setSelected] = useState([]);

  const isFirstRender = React.useRef();

  if (isFirstRender.current !== false) {
    isFirstRender.current = true;
  }

  const checkList = useMemo(() => {
    const disabled = currentRadioValue !== 5;
    const checks = [];

    for (let i = 1; i <= 31; i++) {
      checks.push(
        <Col key={i} span={4}>
          <Checkbox disabled={disabled} value={i.toString()}>
            {i}
          </Checkbox>
        </Col>
      );
    }

    return checks;
  }, [currentRadioValue, selected]);

  useEffect(() => {
    if (value === '*') {
      setCurrentRadioValue(1);
    } else if (value === '?') {
      setCurrentRadioValue(2);
    } else if (value.indexOf('-') > -1) {
      setCurrentRadioValue(3);
      const [defaultFrom, defaultTo] = value.split('-');

      setFromValue(parseInt(defaultFrom, 10));
      setToValue(parseInt(defaultTo, 10));
    } else if (value.indexOf('/') > -1) {
      setCurrentRadioValue(4);
      const [defaultOffsetFrom, defaultOffset] = value.split('/');

      setOffsetFrom(parseInt(defaultOffsetFrom, 10));
      setOffset(parseInt(defaultOffset, 10));
    } else {
      setCurrentRadioValue(5);
      setSelected(value ? value.split(',') : ['1']);
    }
  }, [value]);

  useEffect(() => {
    if (!isFirstRender.current) {
      switch (currentRadioValue) {
        case 1:
          onChange('*');
          break;
        case 2:
          onChange('?');
          break;
        case 3:
          onChange(`${fromValue}-${toValue}`);
          break;
        case 4:
          onChange(`${offsetFrom}/${offset}`);
          break;
        case 5:
          onChange(selected.join(','));
          break;
        default:
          break;
      }
    }
  }, [currentRadioValue, fromValue, toValue, offsetFrom, offset, selected]);

  const onChangeRadio = useCallback((e) => {
    setCurrentRadioValue(e.target.value);
  }, []);

  const onChangeFrom = useCallback((v) => {
    if (v >= 1) {
      setFromValue(v || 1);
    }
  }, []);

  const onChangeTo = useCallback((v) => {
    if (v >= 1) {
      setToValue(v || 1);
    }
  }, []);

  const onChangeOffsetFrom = useCallback((v) => {
    if (v >= 1) {
      setOffsetFrom(v || 1);
    }
  }, []);

  const onChangeOffset = useCallback((v) => {
    if (v >= 1) {
      setOffset(v || 1);
    }
  }, []);

  const handleCheckboxChange = (list: any | string[]): void => {
    setSelected(!isEmpty(list) ? list.sort((a, b) => a - b) : []);
  };

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return (
    <Radio.Group value={currentRadioValue} onChange={onChangeRadio}>
      <>
        <Radio value={1} style={radioStyle}>
          {getIntl('everyDay')}
        </Radio>
        <Radio value={2} style={radioStyle}>
          {getIntl('noSpecify')}
        </Radio>
        <Radio value={3} style={radioStyle}>
          <div>
            {getIntl('from')}&nbsp;
            <InputNumber {...commonInputNumberProps} disabled={currentRadioValue !== 3} value={fromValue} onChange={onChangeFrom} />
            &nbsp;-&nbsp;
            <InputNumber {...commonInputNumberProps} disabled={currentRadioValue !== 3} value={toValue} onChange={onChangeTo} />
            &nbsp;{getIntl('excuteOnceEveryDay')}
          </div>
        </Radio>
        <Radio value={4} style={radioStyle}>
          <div>
            {getIntl('from')}&nbsp;
            <InputNumber {...commonInputNumberProps} disabled={currentRadioValue !== 4} value={offsetFrom} onChange={onChangeOffsetFrom} />
            &nbsp;{getIntl('dayStart')}&nbsp;
            <InputNumber {...commonInputNumberProps} disabled={currentRadioValue !== 4} value={offset} onChange={onChangeOffset} />
            &nbsp;{getIntl('dayExcuteOnce')}
          </div>
        </Radio>
        <>
          <Radio value={5} style={radioStyle}>
            {getIntl('specify')}
            <br />
          </Radio>
          <Checkbox.Group value={selected} onChange={handleCheckboxChange}>
            <Row> {checkList}</Row>
          </Checkbox.Group>
        </>
      </>
    </Radio.Group>
  );
});

export default DayConfigPanel;
