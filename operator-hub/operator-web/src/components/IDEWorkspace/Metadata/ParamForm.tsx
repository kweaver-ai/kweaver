import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Input, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { validateParamName } from '@/utils/validators';
import styles from './ParamForm.module.less';
import { type ParamItem, ParamTypeEnum } from './types';

interface ParamFormProps {
  value?: ParamItem[];
  onChange?: (value: ParamItem[]) => void;
}

// 参数校验枚举
enum ParamValidateResultEnum {
  Valid = 'valid', // 参数有效
  Invalid = 'invalid', // 参数不合法
  Empty = 'empty', // 参数为空
}

const errorMessages = {
  [ParamValidateResultEnum.Valid]: '',
  [ParamValidateResultEnum.Invalid]: '只允许字母、数字和下划线，且不能以数字开头',
  [ParamValidateResultEnum.Empty]: '请输入',
};

// 参数校验规则
const paramValidationRules = {
  name: (value: string) => {
    if (!value.trim()) {
      return ParamValidateResultEnum.Empty;
    }
    if (!validateParamName(value)) {
      return ParamValidateResultEnum.Invalid;
    }
    return ParamValidateResultEnum.Valid;
  },
  description: (value: string) => {
    if (!value.trim()) {
      return ParamValidateResultEnum.Empty;
    }
    return ParamValidateResultEnum.Valid;
  },
};

const ParamForm = forwardRef(({ value = [], onChange }: ParamFormProps, ref) => {
  const [params, setParams] = useState<ParamItem[]>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 参数类型选项
  const typeOptions = useMemo(
    () => [
      { label: 'String', value: ParamTypeEnum.String },
      { label: 'Number', value: ParamTypeEnum.Number },
      { label: 'Object', value: ParamTypeEnum.Object },
      { label: 'Array', value: ParamTypeEnum.Array },
      { label: 'Boolean', value: ParamTypeEnum.Boolean },
    ],
    []
  );

  useImperativeHandle(ref, () => ({
    validate,
  }));

  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(params)) {
      setParams(value);
    }
  }, [value]);

  const validate = (paramsToValidate: ParamItem[] = params) => {
    const newErrors: Record<string, string> = {};
    paramsToValidate.forEach((param, index) => {
      newErrors[index] = Object.fromEntries(
        Object.entries(paramValidationRules).map(([key, rule]) => [key, rule(param[key])])
      );
    });
    setErrors(newErrors);
    return Object.values(newErrors).every(result =>
      Object.values(result).every(validateResult => validateResult === ParamValidateResultEnum.Valid)
    );
  };

  // 处理参数变化
  const handleChange = (newParams: ParamItem[]) => {
    setParams(newParams);
    onChange?.(newParams);
  };

  // 添加参数
  const addParam = () => {
    const newParam: ParamItem = {
      name: '',
      description: '',
      type: ParamTypeEnum.String,
      required: true,
    };
    const newParams = [...params, newParam];
    handleChange(newParams);
  };

  // 更新参数
  const updateParam = (index: number, field: keyof ParamItem, value: any) => {
    const newParams = [...params];
    newParams[index] = {
      ...newParams[index],
      [field]: value,
    };
    handleChange(newParams);

    // 校验参数
    const validateResult =
      field in paramValidationRules ? paramValidationRules[field](value) : ParamValidateResultEnum.Valid;

    setErrors(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [field]: validateResult,
      },
    }));
  };

  // 删除参数
  const deleteParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    handleChange(newParams);
    // 删除，重新校验
    validate(newParams);
  };

  return (
    <div className={styles['param-form']}>
      <table className={styles['form-table']}>
        <thead>
          <tr>
            <th className="dip-required-after">参数名称</th>
            <th className="dip-required-after">参数说明</th>
            <th>类型</th>
            <th>必填</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, index) => (
            <React.Fragment key={index}>
              <tr>
                {[
                  {
                    placeholder: '参数名称',
                    field: 'name',
                    maxLength: 50,
                    showCount: true,
                    type: 'input',
                  },
                  {
                    placeholder: '参数说明',
                    field: 'description',
                    maxLength: 255,
                    showCount: true,
                    type: 'input',
                  },
                  {
                    field: 'type',
                    type: 'select',
                    options: typeOptions,
                    className: 'dip-w-100',
                  },
                  {
                    field: 'required',
                    type: 'checkbox',
                    className: 'dip-pointer dip-ml-6',
                    style: { width: 16, height: 16 },
                  },
                  {
                    field: 'action',
                    content: (
                      <Button type="link" className="dip-pl-0 dip-pr-0" onClick={() => deleteParam(index)}>
                        删除
                      </Button>
                    ),
                  },
                ].map(({ placeholder, field, maxLength, showCount, type, options, className, style, content }) => {
                  const error: ParamValidateResultEnum =
                    errors[index]?.[field as string] || ParamValidateResultEnum.Valid;
                  return (
                    <td className={styles[`${field}-field`]} key={field}>
                      {content ? (
                        content
                      ) : type === 'input' ? (
                        <Input
                          value={param[field] || ''}
                          status={error !== ParamValidateResultEnum.Valid ? 'error' : undefined}
                          onChange={e => updateParam(index, field as any, e.target.value)}
                          placeholder={placeholder}
                          maxLength={maxLength}
                          showCount={showCount}
                          autoComplete="off"
                        />
                      ) : type === 'select' ? (
                        <Select
                          value={param[field] || ''}
                          onChange={value => updateParam(index, field as any, value)}
                          options={options}
                          className={className}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          className={className}
                          style={style}
                          checked={param[field] || false}
                          onChange={e => updateParam(index, field as any, e.target.checked)}
                        />
                      )}
                      {error !== ParamValidateResultEnum.Valid && (
                        <div className={styles['error']}>{errorMessages[error]}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <Button onClick={addParam} type="link" icon={<PlusOutlined />} className="dip-mt-8">
        添加参数
      </Button>
    </div>
  );
});

export default ParamForm;
