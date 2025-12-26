import { useState } from 'react';
import { Alert } from 'antd';

/** 创建和编辑弹窗 */
const VersioningModal = (props: any) => {
  console.log('props', props);
  const { open, sourceData = {} } = props;
  const { onOk, onCancel } = props;
  const [isFetching, setIsFetching] = useState(false);

  return (
    <Modal open={open} width={640} title='版本管理' okText='删除' okButtonProps={{ danger: true }} confirmLoading={isFetching} onOk={onOk} onCancel={onCancel}>
      <Alert message='删除最后一个版本时，系统仅清理该版本内容' type='warning' showIcon />
    </Modal>
  );
};

export default (props: any) => (props.open ? <VersioningModal {...props} /> : null);
