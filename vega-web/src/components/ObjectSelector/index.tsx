import { useEffect, useState } from 'react';
import { Select } from 'antd';
import api from '@/services/object';
import { Text } from '@/web-library/common';
import ObjectIcon from '../ObjectIcon';

export const renderObjectTypeLabel = ({ icon, name, color }: { icon?: string; name: string; color?: string }) => (
  <div className="g-flex-align-center" title="name">
    <ObjectIcon icon={icon || ''} color={color || ''} />
    <div>
      <Text className="g-ellipsis-1" title={name}>
        {name}
      </Text>
    </div>
  </div>
);

const ObjectSelector = ({ onChange, disabled, value, objectOptions, knId }: any) => {
  const [options, setOptions] = useState<any[]>(objectOptions || []);

  const fetchObject = async () => {
    if (knId) {
      try {
        const { entries } = await api.objectGet(knId, { offset: 0, limit: -1 });

        setOptions(
          entries.map((item) => ({
            label: renderObjectTypeLabel(item),
            value: item.id,
            detail: item,
          }))
        );
      } catch {}
    } else {
      setOptions([]);
    }
  };

  useEffect(() => {
    if (!objectOptions && knId) {
      fetchObject();
    }
  }, [knId]);

  useEffect(() => {
    if (objectOptions) {
      setOptions(objectOptions);
    }
  }, [objectOptions]);

  useEffect(() => {
    if (options.length) {
      const findObject = options?.find((item) => item.value === value);
      if (value && findObject) {
        onChange?.(value, findObject?.detail);
      }
    }
  }, [options]);

  return (
    <Select
      allowClear
      showSearch
      disabled={disabled}
      placeholder="请选择对象类"
      value={value}
      options={options}
      onChange={(value, option) => {
        onChange?.(value, option?.detail);
      }}
    />
  );
};

export default ObjectSelector;
