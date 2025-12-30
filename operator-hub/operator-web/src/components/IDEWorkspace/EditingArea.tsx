import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Radio } from 'antd';
import CodeIcon from '@/assets/icons/code.svg';
import MetadataIcon from '@/assets/icons/metadata.svg';
import { PythonEditor } from '@/components/CodeEditor';
import { OperatorTypeEnum } from '@/components/OperatorList/types';
import Metadata from './Metadata';
import { type ToolDetail } from './types';

enum TabEnum {
  Code = 'code',
  Metadata = 'metadata',
}

interface EditingAreaProps {
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
  value: ToolDetail;
  onChange: (value: Partial<ToolDetail>) => void;
}

const EditingArea = forwardRef(({ operatorType, value, onChange }: EditingAreaProps, ref) => {
  const metadataRef = useRef<{ validate: () => Promise<boolean> }>(null);

  const validate = async () => {
    // 当元数据校验不通过，需要切换到元数据的tab
    const validateResult = await metadataRef.current?.validate?.();

    if (!validateResult) {
      setActiveTab(TabEnum.Metadata);
    }

    return validateResult;
  };

  useImperativeHandle(ref, () => ({
    validate,
  }));

  const [activeTab, setActiveTab] = useState<TabEnum>(TabEnum.Code);

  return (
    <div className="dip-h-100 dip-flex-column dip-gap-16 dip-overflow-hidden">
      <Radio.Group
        value={activeTab}
        className="dip-mt-24 dip-ml-32"
        onChange={e => setActiveTab(e.target.value as TabEnum)}
      >
        <Radio.Button value={TabEnum.Code}>
          <div className="dip-flex-align-center">
            <CodeIcon className="dip-font-16 dip-mr-8" />
            代码
          </div>
        </Radio.Button>
        <Radio.Button value={TabEnum.Metadata}>
          <div className="dip-flex-align-center">
            <MetadataIcon className="dip-font-16 dip-mr-8" />
            元数据
          </div>
        </Radio.Button>
      </Radio.Group>
      <div className="dip-flex-1 dip-overflowY-auto">
        {activeTab === TabEnum.Code && <PythonEditor value={value.code} onChange={code => onChange({ code })} />}

        <Metadata
          ref={metadataRef}
          style={activeTab === TabEnum.Metadata ? {} : { display: 'none' }}
          operatorType={operatorType}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
});

export default EditingArea;
