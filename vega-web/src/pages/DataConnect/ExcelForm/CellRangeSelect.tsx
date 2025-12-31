import { useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Input } from 'antd';
import classnames from 'classnames';
import { noop } from 'lodash';
import styles from './styles.module.less';

// 单元格范围选择
interface CellRangeSelectProps {
  // 值
  value?: Array<string>;
  // 改变值
  onChange?: (value: Array<string>) => void;
  // 状态
  error?: boolean;
}

/**
 * 单元格范围选择
 * @param param0
 * @returns
 */
const CellRangeSelect = ({ value = ['', ''], onChange = noop, error }: CellRangeSelectProps) => {
  // 是否左侧聚焦
  const [leftFocus, setLeftFocus] = useState(false);
  // 是否右侧聚焦
  const [rightFocus, setRightFocus] = useState(false);

  const leftInputRef = useRef(null);

  return (
    <div
      className={classnames({
        [styles.cellRangeContainer]: true,
        [styles.cellRangeContainerFocus]: leftFocus || rightFocus,
        [styles.cellRangeContainerError]: error,
      })}
    >
      <Input
        placeholder={intl.get('DataConnect.startCell')}
        value={value?.[0]}
        onChange={(e) => {
          onChange([e.target.value, value?.[1]]);
        }}
        onFocus={() => {
          setLeftFocus(true);
        }}
        onBlur={() => {
          setLeftFocus(false);
        }}
        ref={leftInputRef}
      />
      <span
        className={styles.line}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!leftFocus && !rightFocus) {
            const input = leftInputRef.current as any;

            input?.focus();
            setLeftFocus(true);
          }
        }}
      >
        ——
      </span>
      <Input
        placeholder={intl.get('DataConnect.endCell')}
        value={value?.[1]}
        onChange={(e) => {
          onChange([value?.[0], e.target.value]);
        }}
        onFocus={() => {
          setRightFocus(true);
        }}
        onBlur={() => {
          setRightFocus(false);
        }}
      />
      <div
        className={classnames({
          [styles.bottomLine]: true,
          [styles.focusRightInput]: rightFocus,
        })}
      />
    </div>
  );
};

export default CellRangeSelect;
