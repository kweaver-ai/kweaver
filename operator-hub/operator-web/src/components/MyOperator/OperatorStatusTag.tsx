import { Tag } from 'antd';

export default function OperatorStatusTag({status}:any) {
  const getStatusTag = (status: string) => {
     switch (status) {
       case 'unpublish':
         return <Tag color="default">未发布</Tag>;
       case 'published':
         return (
           <Tag color="success">
             已发布
           </Tag>
         );
       // case '有尚未发布的修改':
       //   return (
       //     <Tag color="warning" className="flex items-center">
       //       <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
       //       {status}
       //     </Tag>
       //   );
       case 'offline':
         return (
           <Tag color="warning">
             已下架
           </Tag>
         );
       default:
         return <Tag color="default">{status}</Tag>;
     }
   };


  return (
    <>
      {getStatusTag(status)}
    </>
  );
}
