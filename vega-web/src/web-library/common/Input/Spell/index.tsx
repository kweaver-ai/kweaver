/**
 * @description 输入组件，对 antd 的 Input 组件进行拓展
 * 1、适配中文输入法，输入时不触发 onChange
 * 2、输入时，输入框右侧出现搜索图标，输入后，搜索图标消失
 */
import { useEffect, useRef, useState } from 'react';
import { Input as AntdInput, type InputProps as AntdInputProps } from 'antd';

const Spell: React.FC<AntdInputProps> = ({ value, onChange, ...props }) => {
  const [val, setVal] = useState<string>((value as string) || '');
  const isComposing = useRef(false); // 标记是否处于中文输入状态

  useEffect(() => setVal(value as string), [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVal(event.target.value);
    if (!isComposing.current) onChange?.(event);
  };
  return (
    <AntdInput
      {...props}
      value={val}
      suffix={val ? null : props?.suffix}
      autoComplete="off"
      aria-autocomplete="none"
      onChange={handleChange}
      onCompositionStart={() => (isComposing.current = true)}
      onCompositionEnd={(e) => {
        isComposing.current = false;
        onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>); // 输入完成后触发
      }}
    />
  );
};

export default Spell;
