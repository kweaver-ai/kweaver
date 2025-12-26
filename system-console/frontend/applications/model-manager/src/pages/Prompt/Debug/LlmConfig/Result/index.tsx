import { useState } from 'react';
import intl from 'react-intl-universal';
import { Divider } from 'antd';

import { Button, Select, IconFont, MarkdownIt } from '@/common';

const Result = (props: any) => {
  const { resultDivRef, fetching, errorData, contentRef, responseFormat, reasoningContentRef, timeAndTokenRef } = props;
  const { onInterrupt, onChangeFormat } = props;

  const [showThinking, setShowThinking] = useState(true); // 是否展示思考过程

  const tokens = timeAndTokenRef.current?.tokens;
  const seconds = timeAndTokenRef.current?.time ? (timeAndTokenRef.current?.time / 1000).toFixed(2) : '';

  const errorString = errorData.current?.description;
  const hasContent = contentRef.current || reasoningContentRef.current;
  const disabledInterrupt = (!hasContent && !fetching.current) || !fetching.current;

  return (
    <div className='g-h-100'>
      <div className='g-flex-space-between'>
        <div className='g-flex-align-center'>
          <span>{intl.get('Prompt.debug.result')}</span>
          <Select
            className='g-ml-3'
            style={{ width: 150 }}
            value={responseFormat}
            size='small'
            options={[
              { value: 'text', label: intl.get('Prompt.debug.returnText') },
              { value: 'json_object', label: intl.get('Prompt.debug.returnJson') },
            ]}
            onChange={onChangeFormat}
          />
        </div>
        <Button.Icon title='终止' disabled={disabledInterrupt} icon={<IconFont type='icon-dip-stop' />} onClick={onInterrupt} />
      </div>
      <Divider className='g-mt-3 g-mb-1' />
      <div ref={resultDivRef} style={{ overflowY: 'auto', maxHeight: 'calc(100% - 32px - 25px)', margin: '0 -24px', padding: '0 24px' }}>
        {!!reasoningContentRef.current && (
          <div>
            <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.6)', marginBottom: -8 }}>
              {intl.get('Prompt.debug.deepThinking')}

              <Button.Icon
                style={{ marginLeft: 4, background: '#fff', transform: showThinking ? 'rotate(0deg)' : 'rotate(90deg)' }}
                icon={<IconFont type='icon-dip-right' style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.6)' }} />}
                onClick={() => setShowThinking(!showThinking)}
              />
            </div>
            <MarkdownIt type='thinking' content={reasoningContentRef.current} style={{ display: showThinking ? 'block' : 'none' }} />
          </div>
        )}
        <MarkdownIt style={errorString ? { color: 'red' } : {}} content={errorString ? errorString : contentRef.current} />
      </div>
      {seconds && (
        <div className='g-mt-1 g-pt-1 g-w-100 g-border-t g-c-text-sub g-flex-space-between' style={{ fontSize: 13 }}>
          <div className='g-flex-align-center'>
            {intl.get('Prompt.debug.durationSeconds', { num: seconds })}
            {tokens ? <span className='g-ml-2'>{intl.get('Prompt.debug.costTokens', { tokens })}</span> : ''}
          </div>
          {!errorData.current && (
            <Button.Copy
              size='small'
              inBlock={false}
              style={{ width: 20, height: 20 }}
              iconStyle={{ fontSize: 12 }}
              successIconStyle={{ fontSize: 20 }}
              copyText={contentRef.current}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Result;
