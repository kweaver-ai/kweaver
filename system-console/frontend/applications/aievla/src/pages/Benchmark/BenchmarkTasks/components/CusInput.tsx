import { ChangeEvent, useState } from 'react';
import { Input } from 'antd';

import ErrorTip from '@/components/ErrorTip';
import { useDebounceEffect } from 'ahooks';

const CusInput = (props: any) => {
  const { error, value, placeholder, setValue, inputWidth = 290, disabled } = props;
  const [text, setText] = useState<any>(value);

  useDebounceEffect(() => {
    setText(value);
  }, [value]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value?.trim();
    setText(value);
    setValue(value);
  };

  return (
    <div className='ad-flex-column' style={{ alignItems: 'flex-start', height: '100%' }}>
      <ErrorTip errorText={error || ''}>
        <Input
          value={text}
          placeholder={placeholder}
          onChange={e => onChange(e)}
          style={{ width: inputWidth }}
          onClick={e => e.stopPropagation()}
          data-testid='input-testid'
          disabled={disabled}
        />
      </ErrorTip>
    </div>
  );
};
export default CusInput;
