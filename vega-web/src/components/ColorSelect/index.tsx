// IconfontSelect.tsx
import React, { useEffect, useRef, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

const colorList = [
  '#08979C',
  '#0e5fc5',
  '#323232',
  '#36CFC9',
  '#3A93FF',
  '#52C41A',
  '#8C8C8C',
  '#9254DE',
  '#a0d911',
  '#EB2F96',
  '#FAAD14',
  '#FADB14',
  '#FF4D4F',
  '#FF7A45',
];
interface IconfontSelectProps {
  value?: string; // 当前选中的 icon 类名，例如 "icon-home"
  onChange?: (cls: string) => void;
  style?: React.CSSProperties;
  isPopUp?: boolean;
  icon?: string; // 图标类型，字符串形式，例如 "icon-dip-fenzu"
  [key: string]: any; // 其余 Select 属性
}

const IconfontSelect: React.FC<IconfontSelectProps> = ({ value, onChange, isPopUp = false, icon, ...restSelectProps }) => {
  const [open, setOpen] = useState<boolean>(false);
  const selectRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) {
      onChange?.('#0e5fc5');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log(selectRef.current, containerRef.current, 'selectRef');
      if (
        selectRef.current &&
        !selectRef.current.nativeElement.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        open
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const dropdownRender = () => (
    <div style={{ padding: 8 }} tabIndex={-1} ref={containerRef}>
      <div className={styles['color-box']}>
        {colorList.map((val) => (
          <div
            key={val}
            onClick={() => {
              onChange?.(val);
              setOpen(false);
            }}
            className={styles['color-item']}
            style={{
              background: val,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
            }}
          >
            {icon && <IconFont type={icon} style={{ color: '#fff', fontSize: 16 }} />}
            {value === val && <CheckOutlined style={{ position: 'absolute', color: '#fff', fontSize: 16 }} />}
          </div>
        ))}
      </div>
    </div>
  );

  const suffix = value && (
    <div
      style={{
        background: value,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
      }}
      className={styles['color-item-active']}
    >
      {icon && <IconFont type={icon} style={{ color: '#fff', fontSize: 16 }} />}
    </div>
  );

  const getPopupContainer = (): HTMLElement => {
    if (document.getElementsByClassName('ant-modal-wrap') && isPopUp) {
      return document.getElementsByClassName('ant-modal-wrap')[0] as HTMLElement;
    }

    return document.getElementById('vega-root') as HTMLElement;
  };

  return (
    <div>
      <Select
        {...restSelectProps}
        // value={value}
        onChange={onChange}
        ref={selectRef as any}
        onOpenChange={setOpen}
        open={open}
        prefix={suffix}
        getPopupContainer={getPopupContainer}
        popupRender={dropdownRender}
        style={{ width: '100%', ...restSelectProps.style }}
      />
    </div>
  );
};

export default IconfontSelect;
