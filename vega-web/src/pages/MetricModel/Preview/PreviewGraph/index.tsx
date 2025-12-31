/** 数据预览*/
import { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Spin, Select } from 'antd';
import _ from 'lodash';
import noData from '@/assets/images/no-data.svg';
import ChartLine from './ChartLine';

const PreviewGraph = (props: any) => {
  const { sourceData, loading, pagination } = props;

  const [selectTags, setSelectTags] = useState<number[]>([1]);
  const { selectOption } = useMemo(() => {
    const selectOption: any = [];
    _.forEach(sourceData, (item, index) => {
      if (item.number !== sourceData[index + 1]?.number) selectOption.push({ value: item.number, label: `${intl.get('Global.number')}${item.number}` });
    });
    return { selectOption };
  }, [sourceData]);

  const { data } = useMemo(() => {
    const data: any = [];
    _.forEach(sourceData, (item) => {
      if (_.includes(selectTags, item.number)) data.push(item);
    });
    return { data };
  }, [JSON.stringify(selectTags), sourceData]);

  const onChangeSelectTag = (value: number[]) => {
    setSelectTags(value);
  };

  return (
    <Spin spinning={loading}>
      <div className="g-mb-9">
        <div className="g-mb-2">{intl.get('MetricModel.pleaseSelectSeries')}：</div>
        <Select
          mode="tags"
          style={{ width: '100%' }}
          value={selectTags}
          placeholder={intl.get('MetricModel.pleaseSelectSeries')}
          options={selectOption}
          allowClear
          getPopupContainer={(triggerNode): any => triggerNode.parentNode}
          onChange={onChangeSelectTag}
        />
      </div>
      {_.isEmpty(data) ? (
        <div className="g-flex-center g-c-text-sub" style={{ flexDirection: 'column', height: 100, marginTop: 12 }}>
          <img src={noData} />
          <div>{intl.get('Global.noData')}</div>
        </div>
      ) : (
        <ChartLine title={intl.get('MetricModel.metricTrend')} style={{ height: 360, marginTop: 12 }} sourceData={data} pagination={pagination} />
      )}
    </Spin>
  );
};

export default PreviewGraph;
