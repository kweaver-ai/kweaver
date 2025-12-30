import { Tag } from 'antd';

export default function MethodTag({ status }: any) {
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'POST':
        return (
          <Tag color="processing" bordered={false}>
            {status}
          </Tag>
        );
      case 'GET':
        return (
          <Tag color="success" bordered={false}>
            {status}
          </Tag>
        );
      case 'DELETE':
        return (
          <Tag color="error" bordered={false}>
            {status}
          </Tag>
        );
      case 'PUT':
        return (
          <Tag color="warning" bordered={false}>
            {status}
          </Tag>
        );
      default:
        return (
          <Tag color="default" bordered={false}>
            {status}
          </Tag>
        );
    }
  };

  return <>{getStatusTag(status)}</>;
}
