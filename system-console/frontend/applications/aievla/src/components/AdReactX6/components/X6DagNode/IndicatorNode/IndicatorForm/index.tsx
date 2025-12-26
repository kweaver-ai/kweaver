import { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { getIndicatorLibraryList } from '@/services/benchmark';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ADTable from '@/components/ADTable';
import AdDrawer from '@/components/AdDrawer';

import IndicatorDetails from './IndicatorDetails';

import './style.less';

const IndicatorForm = ({ node, editData, visible }: any) => {
  const nodeData = node?.getData();
  const metricData = nodeData.metric;
  const readOnly = nodeData.readOnly;
  const [tableProps, setTableProps] = useState({
    searchValue: '',
    data: [],
    loading: true,
    page: 1,
    pageSize: 20,
    total: 0,
    orderField: 'create_time',
    order: 'desc',
  });
  const [indicatorData, setIndicatorData] = useState<any>();

  const funcDataRef = useRef<any[]>([]);
  const AiDataRef = useRef<any[]>([]);
  const [hoverIndicatorId, setHoverIndicatorId] = useState('');

  useEffect(() => {
    visible && getListData();
  }, [tableProps.searchValue, tableProps.page, tableProps.pageSize, visible]);

  useEffect(() => {
    funcDataRef.current = _.filter(funcDataRef.current, id => _.includes(metricData.metricIdList, id));
    AiDataRef.current = _.filter(AiDataRef.current, id => _.includes(metricData.metricIdList, id));
    if (_.isEmpty(metricData.metricIdList)) {
      funcDataRef.current = [];
      AiDataRef.current = [];
    }
  }, [metricData.metricIdList]);

  const getListData = async () => {
    setTableProps(prevState => ({ ...prevState, loading: true }));
    const body: any = {
      page: tableProps.page,
      size: tableProps.pageSize,
      name: tableProps.searchValue,
      sort_order: tableProps.order,
      sort_field: tableProps.orderField,
    };
    const res: any = await getIndicatorLibraryList(body);
    setTableProps(prevState => ({ ...prevState, loading: false }));
    if (res) {
      const data = res.res;
      const objData: any = {};
      data.forEach((item: any) => {
        objData[item.id] = item.name;
      });
      const allIndicatorData = metricData.allIndicatorData;
      const newAllIndicatorData = { ...allIndicatorData, ...objData };
      node.updateData({
        metric: { ...metricData, allIndicatorData: newAllIndicatorData },
      });
      metricData.updateIndicatorData(newAllIndicatorData);
      setTableProps(prevState => ({ ...prevState, data, total: res.count }));

      const filterData = _.filter(metricData.metricIdList, key =>
        _.includes(
          _.map(data, it => it.id),
          key,
        ),
      );

      funcDataRef.current = filterData;
    }
  };

  const goToIndicator = () => {
    const prefix = (window as any).__POWERED_BY_QIANKUN__ ? '/studio/aievla' : '';
    window.open(`${prefix}/indicator`);
  };

  const refresh = () => getListData();

  const clearSelected = () => {
    node.updateData({ metric: { ...metricData, metricIdList: [] } });
  };

  const checkboxChange = (keys: any) => {
    const errorData = metricData.error;
    if (keys.length > 0 && errorData[node.id]) {
      delete errorData[node.id];
    }

    let target = [];
    const filterNewKeys = keys.filter((key: string) => !metricData.metricIdList.includes(key));

    const curHasKeys = metricData.metricIdList.filter((key: string) => keys.includes(key) || AiDataRef.current.includes(key));
    target = [...curHasKeys, ...filterNewKeys];

    node.updateData({ metric: { ...metricData, metricIdList: _.uniq(target), error: errorData } });
    funcDataRef.current = keys;
  };

  return (
    <AdDrawer
      width={indicatorData ? 1048 : 400}
      drag={{ maxWidth: 1440 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      open={visible}
      title={intl.get('benchmark.config.indicator')}
      subTitle={intl.get('benchmark.config.indicatorSubTitle')}
    >
      <div className='IndicatorForm ad-flex ad-h-100'>
        <div className='IndicatorForm-left ad-flex-column ad-h-100' style={{ width: indicatorData ? 352 : '100%' }}>
          <div className='ad-space-between'>
            <div className='ad-align-center'>
              <span>{intl.get('benchmark.indicator.totalSelected')}</span>
              <span className='ad-c-primary ad-ml-2'>{metricData.metricIdList.length}</span>
            </div>
            {!readOnly && (
              <span
                style={{ fontWeight: 400 }}
                onClick={clearSelected}
                className={`${
                  metricData.metricIdList.length === 0 ? 'ad-c-watermark ad-not-allowed' : 'ad-c-text-lower ad-c-hover-color-deepens ad-pointer'
                } ad-ml-3 ad-align-center ad-font-14`}
              >
                <IconFont style={{ marginTop: -2 }} className='ad-mr-2' type='icon-quanbuyichu' />
                {intl.get('analysglobalisService.clearBtn')}
              </span>
            )}
          </div>
          <div className='IndicatorForm-table ad-flex-column ad-flex-item-full-height'>
            <div className='ad-flex-item-full-height ad-flex-column'>
              <div className='ad-mt-4 ad-flex-item-full-height'>
                <ADTable
                  className='IndicatorForm-table'
                  columns={[
                    {
                      title: intl.get('benchmark.indicator.name'),
                      dataIndex: 'name',
                      render: (value, record) => {
                        return (
                          <div className='ad-space-between' title={value}>
                            <span className='ad-flex-item-full-width ad-ellipsis'>{value}</span>
                            {hoverIndicatorId === record.id && (
                              <span
                                className='ad-c-link'
                                onClick={e => {
                                  e.stopPropagation();
                                  setIndicatorData(record);
                                }}
                              >
                                {intl.get('global.detail')}
                              </span>
                            )}
                          </div>
                        );
                      },
                    },
                  ]}
                  dataSource={tableProps.data}
                  autoScrollY
                  rowSelection={{
                    fixed: true,
                    type: 'checkbox',
                    selectedRowKeys: metricData.metricIdList,
                    onChange: checkboxChange,
                    getCheckboxProps: () => ({ disabled: readOnly }),
                  }}
                  rowKey='id'
                  onRow={record => ({
                    onClick: () => {
                      let keys = [...metricData.metricIdList];
                      if (keys.includes(record.id)) {
                        keys = keys.filter(item => item !== record.id);
                      } else {
                        keys.push(record.id);
                      }
                      checkboxChange(keys);
                    },
                    onMouseEnter: () => setHoverIndicatorId(record.id), // 鼠标移入行
                    onMouseLeave: () => setHoverIndicatorId(''),
                  })}
                  rowClassName={record => (indicatorData?.id === record.id ? 'IndicatorForm-selected-row ad-pointer' : 'ad-pointer')}
                  loading={tableProps.loading}
                  searchPlaceholder={intl.get('benchmark.indicator.searchPlaceholder')}
                  searchValue={tableProps.searchValue}
                  onSearchChange={(value: string) => {
                    setTableProps(prevState => ({ ...prevState, searchValue: value, page: 1 }));
                  }}
                  renderButtonConfig={[{ key: 'reFresh', position: 'right', type: 'fresh', onHandle: refresh }]}
                  pagination={{
                    current: tableProps.page,
                    pageSize: tableProps.pageSize,
                    total: tableProps.total,
                    onChange: (page, pageSize) => {
                      setTableProps(prevState => ({ ...prevState, page, pageSize }));
                    },
                  }}
                />
              </div>
            </div>
            <div className='IndicatorForm-btn'>
              <span>{intl.get('benchmark.config.indicatorNotFound')}</span>
              <Format.Button type='link' onClick={goToIndicator}>
                <span>{intl.get('benchmark.config.goToIndicator')}</span>
                <IconFont style={{ fontSize: 12 }} className='ad-ml-1' type='icon-qianwang' />
              </Format.Button>
            </div>
          </div>
        </div>
        {indicatorData && (
          <div className='IndicatorForm-right ad-h-100 ad-border-l'>
            <IndicatorDetails indicatorData={indicatorData} onClose={() => setIndicatorData(undefined)} />
          </div>
        )}
      </div>
    </AdDrawer>
  );
};

export default ({ ...restProps }: any) => {
  return <IndicatorForm {...restProps} />;
};
