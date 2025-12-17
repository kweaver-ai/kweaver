import styles from './index.module.less';
import { Splitter } from 'antd';
import DataSourceArea from './DataSourceArea';
import FileArea from './FileArea';
import { FileItem, PreviewFileType } from '@/components/DipChat/interface';
import classNames from 'classnames';
import { getFileExtension } from '@/utils/doc';
import { useDipChatStore } from '@/components/DipChat/store';
import { getTempAreaEnable } from '@/components/DipChat/utils';

const TempArea = () => {
  const {
    dipChatStore: { agentDetails, previewFile },
    setDipChatStore,
  } = useDipChatStore();
  const agentConfig = agentDetails.config;
  const { data_source } = agentDetails?.config || {};
  const knSpaceTreeDataSource = data_source?.kg ?? [];
  const knExperimentalDataSource = data_source?.knowledge_network ?? [];
  const docTreeDataSource = data_source?.doc ?? [];
  const metricTreeDataSource = data_source?.metric ?? [];
  const contentDataSource = docTreeDataSource.filter((item: any) => item.ds_id === '0'); // 内容数据库数据源

  const setPreviewFile = (file: PreviewFileType | undefined) => {
    setDipChatStore({
      previewFile: file,
    });
  };

  const renderContent = () => {
    // 只配置了配置了临时区
    if (
      getTempAreaEnable(agentConfig) &&
      knSpaceTreeDataSource.length === 0 &&
      knExperimentalDataSource.length === 0 &&
      metricTreeDataSource.length === 0 &&
      contentDataSource.length === 0
    ) {
      return (
        <FileArea
          onPreviewFile={(file: FileItem) => {
            setPreviewFile({
              fileId: file.id,
              fileExt: getFileExtension(file.name),
              fileName: file.name,
            });
          }}
        />
      );
    }

    // 只配置了配置了数据源
    if (
      !getTempAreaEnable(agentConfig) &&
      (knSpaceTreeDataSource.length > 0 ||
        knExperimentalDataSource.length > 0 ||
        metricTreeDataSource.length > 0 ||
        contentDataSource.length > 0)
    ) {
      return (
        <DataSourceArea
          onPreviewFile={(file: FileItem) => {
            setPreviewFile({
              fileId: file.id,
              fileExt: getFileExtension(file.name),
              fileName: file.name,
            });
          }}
        />
      );
    }

    return (
      <Splitter layout="vertical">
        <Splitter.Panel>
          <FileArea
            onPreviewFile={(file: FileItem) => {
              setPreviewFile({
                fileId: file.id,
                fileExt: getFileExtension(file.name),
                fileName: file.name,
              });
            }}
          />
        </Splitter.Panel>
        <Splitter.Panel>
          <DataSourceArea
            onPreviewFile={(file: FileItem) => {
              setPreviewFile({
                fileId: file.id,
                fileExt: getFileExtension(file.name),
                fileName: file.name,
              });
            }}
          />
        </Splitter.Panel>
      </Splitter>
    );
  };

  return (
    <div className={classNames(styles.container)} style={{ display: previewFile ? 'none' : 'block' }}>
      {renderContent()}
    </div>
  );
};

export default TempArea;
