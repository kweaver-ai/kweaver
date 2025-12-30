import React from 'react';
import { Divider, Typography, message } from 'antd';
import { downloadFile } from '@/utils/file';
import { get } from '@/utils/http';

const { Link } = Typography;

interface TemplateDownloadSectionProps {
  className?: string;
}

/**
 * 模板下载区域组件
 * 提供OpenAPI规范链接和示例模板下载功能
 */
const TemplateDownloadSection: React.FC<TemplateDownloadSectionProps> = ({ className }) => {
  // 下载示例模板文件
  const downloadTemplate = async () => {
    try {
      // 使用封装的 http 方法获取文件内容
      const blob = await get(`/operator-web/public/docs/示例模板.yaml`, {
        responseType: 'blob',
      });

      // 使用 downloadFile 工具函数下载文件
      downloadFile(blob, '示例模板.yaml');
      message.success('下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      message.error('下载失败');
    }
  };

  return (
    <div className={className}>
      <Link href="https://openapi.apifox.cn/" target="_blank">
        OpenAPI 3.0 规范
      </Link>
      <Divider type="vertical" className="dip-ml-16 dip-mr-16" />
      <Link onClick={downloadTemplate}>示例模板</Link>
    </div>
  );
};

export default TemplateDownloadSection;
