import React, { useMemo, useState } from 'react';
import { Select } from 'antd';
import { Edge, Graph } from '@antv/x6';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import intl from 'react-intl-universal';

interface X6LabelSelectProps {
  edge?: Edge.Metadata;
  graphX6?: Graph;
  onChange?: (value: string, edge?: Edge<Edge.Properties>, graph?: Graph) => void;
  value?: string;
  disabled?: boolean;
}

const X6LabelSelect: React.FC<X6LabelSelectProps> = ({ value, edge, graphX6, onChange, disabled }) => {
  const [selectValue, setSelectValue] = useState(edge?.labelValue ?? '等于');
  const prefixLocale = 'workflow.knowledge';
  useDeepCompareEffect(() => {
    const labelValue = edge?.labelValue ?? '等于';
    console.log(labelValue, 'labelValue');
    setSelectValue(labelValue);
    const targetEdge = graphX6?.getEdges().find(item => item.toJSON().id === edge?.id);
    const targetEdgeData = targetEdge?.toJSON();
    if (targetEdgeData?.target?.cell) {
      onChange?.(labelValue, targetEdge, graphX6);
    }
  }, [edge]);

  const relationOptions = useMemo(() => {
    if (edge?.targetToDataFileEdge) {
      return [
        {
          label: intl.get(`${prefixLocale}.equal`),
          value: '等于',
        },
        {
          label: intl.get(`${prefixLocale}.Included`),
          value: '被包含',
        },
      ];
    }
    return [
      {
        label: intl.get(`${prefixLocale}.equal`),
        value: '等于',
      },
      {
        label: intl.get(`${prefixLocale}.contain`),
        value: '包含',
      },
      {
        label: intl.get(`${prefixLocale}.Included`),
        value: '被包含',
      },
    ];
  }, [edge]);
  return (
    <Select
      value={selectValue}
      onChange={value => {
        // const targetEdge = graphX6?.getEdges().find(item => item.toJSON().id === edge?.id);
        setSelectValue(value);
        const targetEdge = graphX6!.getCellById(edge!.id) as Edge;
        targetEdge?.setProp('labelValue', value, {
          silent: true,
        });
        onChange?.(value, targetEdge, graphX6);
      }}
      options={relationOptions}
      size='small'
      dropdownMatchSelectWidth={false}
      disabled={disabled}
    />
  );
};

export default X6LabelSelect;
