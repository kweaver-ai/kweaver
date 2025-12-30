import { Tag } from 'antd';
import { OperatorStatusType } from '../OperatorList/types';

export default function StatusTag({ status }: any) {
  const getStatusTag = (status: string) => {
    switch (status) {
      case OperatorStatusType.Published:
        return (
          <Tag color="success" style={{ height: '22px', margin: 0, border: 'none' }}>
            已发布
          </Tag>
        );
      case OperatorStatusType.Offline:
        return (
          <Tag color="error" style={{ height: '22px', margin: 0, border: 'none' }}>
            已下架
          </Tag>
        );
      case OperatorStatusType.Unpublish:
        return (
          <Tag color="warning" style={{ height: '22px', margin: 0, border: 'none' }}>
            未发布
          </Tag>
        );
      case OperatorStatusType.Editing:
        return (
          <Tag color="processing" style={{ height: '22px', margin: 0, border: 'none' }}>
            已发布编辑中
          </Tag>
        );

      default:
        return (
          <Tag color="default" style={{ height: '22px', margin: 0, border: 'none' }}>
            未知
          </Tag>
        );
    }
  };

  return <>{getStatusTag(status)}</>;
}
