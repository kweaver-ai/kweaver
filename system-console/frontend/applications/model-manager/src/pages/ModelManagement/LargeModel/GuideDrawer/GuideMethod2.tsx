import classNames from 'classnames';
import intl from 'react-intl-universal';

import { Button, MonacoEditor, Title } from '@/common';

import styles from './index.module.less';

const getCode = (data: any) => {
  const { url, name, api_key } = data;
  return `import openai
from openai import OpenAI
API_BASE = "https://${url}/api/mf-model-api/v1/"
API_KEY = "${api_key}"
client = OpenAI(
    api_key=API_KEY,
    base_url=API_BASE
)
completion = client.chat.completions.create(
    model="${name}",
    messages=[{"role": "user", "content": "Hi, who are you?"}]
)
print(completion)`;
};

const GuideMethod2: React.FC<{ parameter: any; editorOptions: any }> = props => {
  const { parameter, editorOptions } = props;

  const code = getCode(parameter);

  return (
    <div className='g-mb-4'>
      <Title className='g-mt-5'>{intl.get('ModelManagement.apiGuide.method2')}</Title>
      <div className='g-mt-3'>{intl.get('ModelManagement.apiGuide.sdkDescribe1')}</div>
      <div>{intl.get('ModelManagement.apiGuide.sdkDescribe2')}</div>
      <div className='g-mt-4 g-bg-hover g-border' style={{ position: 'relative', padding: '8px 16px', borderRadius: 3 }}>
        <Button.Copy copyText='pip install openai' />
        pip install openai
      </div>

      <Title className='g-mt-4'>{intl.get('ModelManagement.apiGuide.codeExample')}</Title>
      <div className={classNames('g-mt-4 g-pt-2 g-border g-bg-hover', styles['guide-editor'])} style={{ borderRadius: 3 }}>
        <Button.Copy copyText={code} />
        <MonacoEditor height='255px' defaultLanguage='python' value={code} options={editorOptions} />
      </div>
    </div>
  );
};

export default GuideMethod2;
