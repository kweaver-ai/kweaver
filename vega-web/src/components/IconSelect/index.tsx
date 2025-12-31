// IconfontSelect.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Select, Input, Space } from 'antd';
import { IconFont } from '@/web-library/common';
import iconList from './dip-iconfont.json';
import styles from './index.module.less';

const { Search } = Input;

interface IconfontSelectProps {
  value?: string; // 当前选中的 icon 类名，例如 "icon-home"
  onChange?: (cls: string) => void;
  style?: React.CSSProperties;
  isPopUp?: boolean;
  [key: string]: any; // 其余 Select 属性
}

const IconfontSelect: React.FC<IconfontSelectProps> = ({ value, onChange, isPopUp = false, ...restSelectProps }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [kw, setKw] = useState('');
  const selectRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    if (!kw.trim()) return iconList.glyphs;
    return iconList.glyphs.filter((i) => i.name.toLowerCase().includes(kw.toLowerCase()));
  }, [kw]);

  useEffect(() => {
    if (!value) {
      onChange?.(iconList.css_prefix_text + iconList.glyphs[0].font_class);
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
      <Search placeholder="输入关键词筛选图标" allowClear value={kw} onChange={(e) => setKw(e.target.value)} style={{ marginBottom: 8 }} />
      <div className={styles['icon-box']}>
        {filtered.map((val) => (
          <div
            key={val.icon_id}
            onClick={() => {
              onChange?.(iconList.css_prefix_text + val.font_class);
              setKw(''); // 选完清空搜索
              setOpen(false);
            }}
            style={{
              color: value === iconList.css_prefix_text + val.font_class ? '#1677ff' : '#000',
            }}
            className={styles['icon-item']}
          >
            <IconFont type={iconList.css_prefix_text + val.font_class} style={{ fontSize: 20 }} />
            <p style={{ fontSize: 12 }} title={val.name} className="g-ellipsis-1">
              {val.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const suffix = (
    <Space>
      {value && <IconFont type={value} style={{ fontSize: 16 }} />}
      {/* <span style={{ color: '#bfbfbf' }}>{placeholder}</span> */}
    </Space>
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
