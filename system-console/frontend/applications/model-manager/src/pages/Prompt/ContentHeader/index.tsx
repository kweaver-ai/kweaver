import { useMemo } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Popover, Divider, Dropdown } from 'antd';

import { Button, IconFont, Title } from '@/common';

type ContentHeaderProps = {
  selectedPrompt: any;
  onTriggerDebug: () => void;
  onOpenCopyModal: (type: 'copy' | 'move', sourceData: any) => void;
  onDeleteNode: (data: any) => void;
  onOpenCAE_PromptModal: (type: string, parentData: any, sourceData: any) => void;
};

const ContentHeader = (props: ContentHeaderProps) => {
  const { selectedPrompt, onTriggerDebug, onOpenCopyModal, onDeleteNode, onOpenCAE_PromptModal } = props;

  const is_built_in = selectedPrompt?.is_built_in;

  const breadCrumb = useMemo(() => {
    if (_.isEmpty(selectedPrompt)) return '';

    const list: any = [];

    const construct = (data: any) => {
      if (data?._parentData) construct(data?._parentData);
      if (data?._parentData?.name) list.push(data?._parentData?.name);
    };

    construct(selectedPrompt);
    list.push(selectedPrompt.name);
    return list.join(' / ');
  }, [selectedPrompt]);

  const onChange = (data: any) => {
    const key = data?.key;
    if (key === 'move') onOpenCopyModal('move', selectedPrompt);
    if (key === 'delete') onDeleteNode([selectedPrompt]);
  };

  const notPrompt = _.isEmpty(selectedPrompt);
  const selectDetail = (
    <div>
      <p>
        {intl.get('Prompt.header.creator')}： {selectedPrompt?.create_by}
      </p>
      <p>
        {intl.get('Prompt.header.createTime')}： {selectedPrompt?.create_time}
      </p>
      <p>
        {intl.get('Prompt.header.updateBy')}： {selectedPrompt?.update_by}
      </p>
      <p>
        {intl.get('Prompt.header.updateTime')}： {selectedPrompt?.update_time}
      </p>
    </div>
  );

  return (
    <div className='g-border-b g-flex-space-between' style={{ height: 48, padding: '0 16px' }}>
      <div className='g-flex-align-center'>
        <IconFont className='g-mr-2' type='icon-dip-folder' style={{ fontSize: 16 }} />
        <Title className='g-mr-1 g-ellipsis-1' noHeight strong={4} title={breadCrumb} style={{ maxWidth: 300 }}>
          {breadCrumb}
        </Title>
        {!notPrompt && (
          <Popover placement='bottomLeft' content={selectDetail}>
            <Button.Icon
              size='small'
              title={intl.get('Prompt.header.detail')}
              disabled={notPrompt}
              icon={<IconFont type='icon-dip-document' style={{ fontSize: 16 }} />}
            />
          </Popover>
        )}
        <Divider className='g-mt-1 g-ml-2 g-mr-3' type='vertical' style={{ borderColor: 'rgba(0,0,0,.15)' }} />
        <Title className='g-mr-1 g-ellipsis-1' noHeight strong={4} title={selectedPrompt?.id} style={{ maxWidth: 200 }}>
          ID：{selectedPrompt?.id}
        </Title>
        <Button.Copy size='small' inBlock={false} disabled={notPrompt} iconStyle={{ fontSize: 16 }} copyText={selectedPrompt?.id} />
      </div>
      <div className='g-flex-align-center'>
        {!is_built_in && (
          <Button type='text' disabled={notPrompt} icon={<IconFont type='icon-dip-edit' />} onClick={() => onOpenCAE_PromptModal('edit', null, selectedPrompt)}>
            {intl.get('Prompt.header.edit')}
          </Button>
        )}
        <Button type='text' disabled={notPrompt} icon={<IconFont type='icon-dip-copy' />} onClick={() => onOpenCopyModal('copy', selectedPrompt)}>
          {intl.get('Prompt.header.copy')}
        </Button>
        <Button type='text' disabled={notPrompt} icon={<IconFont type='icon-dip-debug' />} onClick={onTriggerDebug}>
          {intl.get('Prompt.header.debug')}
        </Button>
        {!selectedPrompt?.is_built_in && (
          <Dropdown
            trigger={['click']}
            placement='bottomLeft'
            menu={{
              items: [
                { key: 'move', label: intl.get('Prompt.header.move') },
                { key: 'delete', label: intl.get('Prompt.header.delete') },
              ],
              onClick: onChange,
            }}
          >
            <Button type='text' disabled={notPrompt} icon={<IconFont type='icon-dip-ellipsis' />}>
              {intl.get('Prompt.header.more')}
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default ContentHeader;
