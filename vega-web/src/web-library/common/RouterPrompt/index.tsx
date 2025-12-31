import { useState, useEffect } from 'react';
import { Prompt, useHistory } from 'react-router-dom';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Title } from '../index';

type RouterPromptType = {
  modal: any;
  isIntercept: boolean;
  title: string;
  content: string;
  onCancel?: () => void;
};
const RouterPrompt = (props: RouterPromptType) => {
  const history = useHistory();
  const { modal, isIntercept = false, title = '', content = '' } = props;
  const { onCancel = () => {} } = props;

  const [isPrompt, setIsPrompt] = useState(true);
  useEffect(() => {
    setIsPrompt(isIntercept);
  }, [isIntercept]);

  return (
    <Prompt
      when={isPrompt}
      message={(location) => {
        modal.confirm({
          zIndex: 2000,
          title: <Title>{title}</Title>,
          content,
          icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
          okText: '取消',
          okButtonProps: { type: 'default' },
          onOk: () => {
            onCancel();
          },
          cancelText: '放弃保存',
          cancelButtonProps: { type: 'primary', danger: true },
          onCancel: () => {
            setIsPrompt(false);
            Promise.resolve().then(() => {
              const { search, pathname } = location;
              history.push({ pathname, search });
            });
          },
        });
        return false;
      }}
    />
  );
};

export default RouterPrompt;
