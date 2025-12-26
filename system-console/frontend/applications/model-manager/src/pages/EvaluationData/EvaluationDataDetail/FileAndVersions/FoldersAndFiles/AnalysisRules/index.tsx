import { useState, useEffect } from 'react';
import { Input } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

import { Button } from '@/common';

const AnalysisRules = (props: any) => {
  const { value: props_value } = props;

  const [value, setValue] = useState(props_value);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    setValue(props_value);
  }, [props_value]);

  const onChange = (e: any) => {
    setValue(e.target.value);
  };

  const onSave = () => {
    console.log(value);
    setIsEdit(false);
  };

  return (
    <div className='g-dropdown-menu-root'>
      <div className='g-flex-align-center' style={{ height: 23 }}>
        <div className='g-mr-2'>分隔符：</div>
        <div style={{ width: 150 }}>
          {isEdit ? (
            <div className='g-w-100 g-flex-space-between'>
              <Input size='small' style={{ width: 80, marginLeft: -8 }} value={value} onChange={onChange} />
              <div className='g-flex-align-center'>
                <Button.Icon className='g-c-primary' size='small' icon={<CheckOutlined />} onClick={onSave} />
                <Button.Icon size='small' icon={<CloseOutlined />} onClick={() => setIsEdit(false)} />
              </div>
            </div>
          ) : (
            <div className='g-w-100 g-flex-space-between'>
              <span>{value}</span>
              <Button.Icon size='small' icon={<EditOutlined />} onClick={() => setIsEdit(true)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisRules;
