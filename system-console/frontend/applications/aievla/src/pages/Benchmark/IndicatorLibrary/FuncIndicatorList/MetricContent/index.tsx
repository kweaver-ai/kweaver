import React, { useMemo, useRef } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Collapse } from 'antd';

import { stringSeparator1 } from '@/enums';
import { adCookie } from '@/utils/handleFunction';

import ADTable from '@/components/ADTable';
import ParamCodeEditor from '@/components/ParamCodeEditor';
import AdAnchor from '@/components/AdAnchor';

import { IndicatorType } from '@/pages/Benchmark/BenchmarkConfig/types';

import './style.less';

const { Panel } = Collapse;
type MetricContentProps = {
  className?: string;
  data: IndicatorType;
  previewData: any;
  anchor?: boolean;
};
const MetricContent: React.FC<MetricContentProps> = ({ data, previewData, className, anchor = true }) => {
  const prefixLocale = 'benchmark.indicator';
  const anchorContainer = useRef<HTMLDivElement | null>(null);
  const description = useMemo(() => {
    if (data && data.description) {
      const [description, text, code] = data.description.split(stringSeparator1);
      return { text: description, title: text, code };
    }
    return null;
  }, [data]);
  return (
    <>
      <div className={classNames('MetricContent', className)}>
        <div
          className={classNames('MetricContent-container', {
            'MetricContent-container-cn': adCookie.get('anyDataLang') === 'zh-CN',
            'MetricContent-container-en': adCookie.get('anyDataLang') === 'en-US',
          })}
          ref={anchorContainer}
        >
          <div id='MetricContent-desc' className='ad-mb-6'>
            <div className='ad-c-bold ad-pt-5' style={{ fontSize: 20 }}>
              {data?.name}
            </div>
            <div className='ad-mt-6 ad-pb-3 ad-border-b ad-c-bold' style={{ fontSize: 16 }}>
              {intl.get(`${prefixLocale}.desc`)}
            </div>
            <div className='ad-mt-3'>
              {description ? (
                <>
                  <div>{description.text}</div>
                  <div className='ad-mt-6 ad-c-bold'>{description.title}</div>
                  {description.code && <ParamCodeEditor className='ad-mb-6 ad-mt-3' height='auto' value={description.code} readonly />}
                </>
              ) : (
                <span className='ad-c-watermark'>{intl.get(`${prefixLocale}.noDesc`)}</span>
              )}
            </div>
          </div>
          <div className='ad-mb-6'>
            <div id='MetricContent-indicatorParam' className='ad-pb-3 ad-border-b ad-c-bold' style={{ fontSize: 16 }}>
              {intl.get(`${prefixLocale}.indicatorParam`)}
            </div>
            <Collapse ghost defaultActiveKey={['1', '2']}>
              <Panel header={<span style={{ fontWeight: 600 }}>Inputs</span>} key='1'>
                <ADTable
                  showHeader={false}
                  showSearch={false}
                  rowKey='name'
                  columns={[
                    { title: intl.get(`${prefixLocale}.paramName`), dataIndex: 'name', width: 188, ellipsis: false },
                    { title: intl.get(`${prefixLocale}.paramDesc`), dataIndex: 'description', ellipsis: false },
                  ]}
                  dataSource={data?.input ?? []}
                  locale={null}
                />
              </Panel>
              <Panel header={<span style={{ fontWeight: 600 }}>Outputs</span>} key='2'>
                <ADTable
                  rowKey='name'
                  showHeader={false}
                  showSearch={false}
                  columns={[
                    { title: intl.get(`${prefixLocale}.paramName`), dataIndex: 'name', width: 188, ellipsis: false },
                    { title: intl.get(`${prefixLocale}.paramDesc`), dataIndex: 'description', ellipsis: false },
                  ]}
                  dataSource={data?.output ?? []}
                  locale={null}
                />
              </Panel>
            </Collapse>
          </div>
          <div className='ad-pb-7'>
            <div id='MetricContent-filePreview' className='ad-pb-3 ad-border-b ad-c-bold' style={{ fontSize: 16 }}>
              {intl.get(`${prefixLocale}.filePreview`)}
            </div>
            <ParamCodeEditor className='ad-mt-4' height='auto' value={previewData} readonly copy />
          </div>
        </div>
        {anchor && (
          <div className='MetricContent-anchor'>
            <AdAnchor
              affix={false}
              title={<span style={{ fontWeight: 600 }}>{intl.get(`${prefixLocale}.dir`)}</span>}
              getContainer={() => anchorContainer.current as HTMLDivElement}
              items={[
                { href: '#MetricContent-desc', title: intl.get(`${prefixLocale}.desc`) },
                { href: '#MetricContent-indicatorParam', title: intl.get(`${prefixLocale}.indicatorParam`) },
                { href: '#MetricContent-filePreview', title: intl.get(`${prefixLocale}.filePreview`) },
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default MetricContent;
