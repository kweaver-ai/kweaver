import { useEffect, useRef } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Switch, Tooltip } from 'antd';

import AdSpin from '@/components/AdSpin';
import Format from '@/components/Format';
import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import NoData from '@/components/NoDataBox/NoData';
import clickView from '@/assets/images/clickView.svg';
import PromptEditor, { uniquePromptId } from '@/components/PromptEditor';

import './style.less';

const PromptDetails = ({ prompt, detailsLoading }: any) => {
  const editRef = useRef<any>();
  useEffect(() => {
    if (prompt) {
      const variables = _.map(prompt.variables, v => ({ ...v, id: uniquePromptId() }));
      editRef?.current?.init?.(prompt.messages, { variables });
    }
  }, [prompt]);
  const columns = [
    {
      title: intl.get('benchmarkTask.varName'),
      dataIndex: 'var_name',
      ellipsis: true,
    },
    {
      title: intl.get('benchmarkTask.fieldName').split('\n')[0],
      dataIndex: 'field_name',
      ellipsis: true,
    },
    {
      title: intl.get('benchmarkTask.required'),
      dataIndex: 'optional',
      render: (text: any, record: any) => <Switch size='small' checked={!text} disabled={true} />,
    },
  ];

  return (
    <div className='PromptDetails ad-w-100 ad-h-100'>
      {detailsLoading ? (
        <div className='loading-mask ad-h-100 ad-center'>
          <AdSpin />
        </div>
      ) : prompt ? (
        <div className='ad-flex-column ad-h-100'>
          <div style={{ fontSize: 12 }} className='ad-c-text-lower'>
            ID：<span>{prompt.prompt_id}</span>
          </div>
          <div className='ad-mt-4'>
            <div style={{ fontSize: 20 }} className='ad-c-bold'>
              {prompt.prompt_name}
            </div>
            <div className='ad-c-text-lower'>{prompt.prompt_desc}</div>
          </div>
          <div className='ad-mt-4'>
            <div>
              <Format.Title>{intl.get('benchmarkTask.prompt')}</Format.Title>
              <Tooltip className='ad-ml-2' title={intl.get('benchmarkTask.promptTip')}>
                <IconFont type='icon-wenhao' style={{ opacity: '0.65' }} />
              </Tooltip>
            </div>
            <div className='PromptDetails-promptEditor'>
              <PromptEditor height={prompt.variables?.length > 0 ? '136px' : '380px'} ref={editRef} readOnly={true} />
            </div>
          </div>
          {prompt.variables?.length > 0 && (
            <div className='ad-mt-4'>
              <div className='ad-mb-2 ad-mt-4'>
                <Format.Title>{intl.get('benchmarkTask.var')}</Format.Title>
                <Tooltip title={intl.get('benchmarkTask.promptTip')} className='ad-ml-2'>
                  <IconFont type='icon-wenhao' style={{ opacity: 0.65 }} />
                </Tooltip>
              </div>
              <ADTable className='PromptDetails-vars-table' showHeader={false} columns={columns} dataSource={prompt?.variables} />
            </div>
          )}
        </div>
      ) : (
        <div className='ad-center ad-h-100 ad-w-100'>
          <NoData imgSrc={clickView} desc={intl.get('benchmarkTask.chooseAPromptWord')} />
        </div>
      )}
    </div>
  );
};

export default PromptDetails;
