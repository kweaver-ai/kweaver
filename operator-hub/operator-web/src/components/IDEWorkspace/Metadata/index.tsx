import { useRef, forwardRef, useImperativeHandle } from 'react';
import { Collapse } from 'antd';
import { OperatorTypeEnum } from '@/components/OperatorList/types';
import BaseInfo from './BaseInfo';
import ParamForm from './ParamForm';
import { type ParamItem } from './types';

interface MetadataProps {
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
  style?: React.CSSProperties;
  value: {
    name: string;
    description: string;
    inputs?: ParamItem[];
    outputs?: ParamItem[];
    use_rule?: string;
  };
  onChange: (value: {
    name?: string;
    description?: string;
    inputs?: ParamItem[];
    outputs?: ParamItem[];
    use_rule?: string;
  }) => void;
}

const Metadata = forwardRef(({ operatorType, style, value, onChange }: MetadataProps, ref) => {
  const baseConfigRef = useRef<{ validate: () => Promise<boolean> }>(null);
  const inputParamFormRef = useRef<{ validate: () => boolean }>(null);
  const outputParamFormRef = useRef<{ validate: () => boolean }>(null);

  const validate = async () => {
    const validateBaseConfigResult = await baseConfigRef.current?.validate();
    const inputParamFormValidateResult = inputParamFormRef.current?.validate();
    const outputParamFormValidateResult = outputParamFormRef.current?.validate();

    return validateBaseConfigResult && inputParamFormValidateResult && outputParamFormValidateResult;
  };

  useImperativeHandle(ref, () => ({
    validate,
  }));

  // 处理输入输出参数的变化
  const handleInputOutputChange = (key: 'inputs' | 'outputs', params: ParamItem[]) => {
    onChange({
      [key]: params,
    });
  };

  return (
    <div className="dip-pl-16 dip-pr-16" style={style}>
      <Collapse
        defaultActiveKey={['info', 'inputParams', 'outputParams']}
        items={[
          {
            key: 'info',
            label: '基础配置',
            children: <BaseInfo ref={baseConfigRef} operatorType={operatorType} value={value} onChange={onChange} />,
          },
          {
            key: 'inputParams',
            label: '输入参数',
            children: (
              <ParamForm
                ref={inputParamFormRef}
                value={value.inputs}
                onChange={params => handleInputOutputChange('inputs', params)}
              />
            ),
          },
          {
            key: 'outputParams',
            label: '输出参数',
            children: (
              <ParamForm
                ref={outputParamFormRef}
                value={value.outputs}
                onChange={params => handleInputOutputChange('outputs', params)}
              />
            ),
          },
        ]}
        bordered={false}
        className="dip-bg-white"
      />
    </div>
  );
});

export default Metadata;
