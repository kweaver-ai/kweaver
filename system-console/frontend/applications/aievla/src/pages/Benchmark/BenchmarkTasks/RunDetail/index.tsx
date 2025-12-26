import React, { useState } from 'react';

import _ from 'lodash';
import { Divider } from 'antd';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';

import DetailsContent from './DetailsContent';
import ResultDetailContent from './ResultDetailContent';

import './style.less';

type RunDetailProps = {
  visible: boolean;
  detailData: any;
  onCancel: () => void;
  runTask: (record: any, dataCheck?: any) => void;
};
const RunDetail = (props: RunDetailProps) => {
  const { detailData, onCancel, runTask } = props;

  const [name, setName] = useState<any>('');
  const [errorInfo, setErrorInfo] = useState<any>(''); // 错误信息

  /**
   * 弹窗标题
   */
  const modalTitle = !_.isEmpty(errorInfo) ? (
    <div className='ad-align-center'>
      <div
        className='ad-align-center ad-pointer'
        onClick={() => {
          setErrorInfo('');
        }}
        style={{ fontSize: 14 }}
      >
        <IconFont type='icon-shangfanye' className='ad-mr-2' />
        <span>{intl.get('global.back')}</span>
      </div>
      <Divider type='vertical' />

      <div>{_.isArray(name) ? name?.[0] : name || 'abt-35-turbo-16k（Prompt123）'}</div>
    </div>
  ) : (
    <>{intl.get('benchmarkTask.runDetail')}</>
  );

  const commonDivider = (title: string) => (
    <div className='ad-align-center ad-mb-5'>
      <Divider type='vertical' />
      <Format.Title className='ad-mr-6 ad-flex' style={{ fontSize: 16 }}>
        {title}
      </Format.Title>
    </div>
  );

  return (
    <UniversalModal
      open
      className='benchmarkDetailModalRoot'
      destroyOnClose={true}
      title={modalTitle}
      width={'100%'}
      style={{ height: 'calc(100% - 24px)', padding: '0 8px 24px', top: 24 }}
      onCancel={onCancel}
      onOk={onCancel}
    >
      {commonDivider(intl.get('benchmarkTask.runStatus'))}
      <DetailsContent detailData={detailData} runTask={runTask} onCancel={onCancel} setName={setName} setErrorInfo={setErrorInfo} />

      {!_.includes([3, 6], detailData?.record?.status) ? null : (
        <>
          {commonDivider(intl.get('benchmarkTask.runResult'))}
          <ResultDetailContent resultId={detailData?.record?.id} />
        </>
      )}
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <RunDetail {...props} /> : null);
