import classNames from 'classnames';
import intl from 'react-intl-universal';

import { Button, MonacoEditor, Title } from '@/common';

import styles from './index.module.less';

const getCode = (data: any) => {
  const { url, name, api_key } = data;
  return `curl https://${url}/api/mf-model-api/v1/chat/completions \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${api_key}" \\
-d '{
	"model": "${name}",
	"messages": [{"role": "user", "content": "Hi, who are you?"}],
	"temperature": 0.3
}' -k`;
};

const GuideMethod1: React.FC<{ parameter: any; editorOptions: any }> = props => {
  const { parameter, editorOptions } = props;

  const code = getCode(parameter);

  return (
    <div>
      <Title className='g-mt-4'>{intl.get('ModelManagement.apiGuide.method1')}</Title>
      <div className={classNames('g-mt-3 g-pt-2 g-border g-bg-hover', styles['guide-editor'])} style={{ borderRadius: 6 }}>
        <Button.Copy copyText={code} />
        <MonacoEditor height='165px' defaultLanguage='json' value={code} options={editorOptions} />
      </div>
    </div>
  );
};

export default GuideMethod1;
