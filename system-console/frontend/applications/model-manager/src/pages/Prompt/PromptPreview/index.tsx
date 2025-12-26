import { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { Text, MonacoEditor } from '@/common';

import HOOKS from '@/hooks';

import not_found from '@/assets/images/file-icon/not_found.svg';

type PromptPreviewProps = {
  selectedPrompt: any;
};
const PromptPreview = (props: PromptPreviewProps) => {
  const { selectedPrompt } = props;
  const monacoEditorContainerRef = useRef(null);
  const { width: monacoEditorWidth, height: monacoEditorHeight } = HOOKS.useSize(monacoEditorContainerRef);
  const monacoRef = useRef<any>(null);

  const [value, setValue] = useState(selectedPrompt?.messages);
  useEffect(() => {
    setValue(selectedPrompt?.messages);
  }, [JSON.stringify(selectedPrompt?.messages)]);

  const onChange = _.debounce((_value: any) => setValue(_value), 300);

  return (
    <div className='g-w-100 g-h-100' ref={monacoEditorContainerRef} style={{ marginRight: -24 }}>
      {_.isEmpty(selectedPrompt) ? (
        <div className='g-flex-column-center' style={{ height: 400 }}>
          <img src={not_found} />
          <Text>{intl.get('Prompt.noContent')}</Text>
        </div>
      ) : (
        <MonacoEditor.Prompt
          ref={monacoRef}
          width={monacoEditorWidth}
          height={monacoEditorHeight}
          value={value}
          options={{ readOnly: true }}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default PromptPreview;
