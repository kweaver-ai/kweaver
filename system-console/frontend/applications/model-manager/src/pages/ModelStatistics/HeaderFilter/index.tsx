import { useState, useEffect } from 'react';
import _ from 'lodash';
import dayjs from 'dayjs';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { DatePicker } from 'antd';

import SERVICE from '@/services';
import { Text, Select } from '@/common';

const FilterItem = (props: any) => {
  const { className, title } = props;
  return (
    <div className={classNames('g-flex-align-center', className)}>
      <Text className='g-mr-2'>{title}</Text>
      <div>{props?.children}</div>
    </div>
  );
};

const HeaderFilter = (props: any) => {
  const { filter, onChange } = props;

  const [idOptions, setIdOptions] = useState([]);
  const { model_id, date } = filter;

  useEffect(() => {
    getModelList();
  }, []);

  /** 获取模型列表 */
  const getModelList = async () => {
    try {
      const postData = { page: 1, size: 1000, order: 'desc', rule: 'update_time' };
      const result = await SERVICE.llm.llmGetList(postData);
      if (result?.data) {
        const idOptions: any = _.map(result.data, item => {
          return { value: item.model_id, label: item.model_name };
        });
        setIdOptions(idOptions);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /** 筛选条件变更 */
  const onChangeFilter = (data: any) => {
    const newFilter = { ..._.cloneDeep(filter), ...data };
    onChange(newFilter);
  };

  return (
    <div className='g-flex-align-center'>
      <FilterItem className='g-mr-4' title={intl.get('modelStatistics.header.modelName')}>
        <Select
          style={{ width: 150 }}
          value={model_id}
          placeholder={intl.get('modelStatistics.header.pleaseSelectModelName')}
          options={[{ value: 'all', label: intl.get('global.all') }, ...idOptions]}
          onChange={value => onChangeFilter({ model_id: value })}
        />
      </FilterItem>
      <FilterItem className='g-mr-4' title={intl.get('global.date')}>
        <DatePicker.RangePicker
          value={date}
          disabledDate={(current: any) => current && current > dayjs().endOf('day')}
          onChange={value => onChangeFilter({ date: value })}
        />
      </FilterItem>
    </div>
  );
};

export default HeaderFilter;
