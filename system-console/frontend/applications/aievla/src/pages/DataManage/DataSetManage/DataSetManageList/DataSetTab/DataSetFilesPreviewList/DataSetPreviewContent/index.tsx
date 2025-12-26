import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';

import { ITable } from '@/components/ADTable';
import LoadingMask from '@/components/LoadingMask';
import ParamCodeEditor from '@/components/ParamCodeEditor';
import NoData from '@/components/NoDataBox/NoData';

import emptyImg from '@/assets/images/empty.svg';
import failtureImg from '@/assets/images/invalidFile.svg';

import { getParam } from '@/utils/handleFunction';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import { cancelRequest } from '@/utils/axios-http/studioAxios';

import { dataSetFilesPreview } from '@/services/dataSet';
import { API } from '@/services/api';

import './style.less';
import { WarningTip } from '@/pages/DataManage/components/WarningTip';

export interface DataSetPreviewContentProps {
  className?: string;
  filesVersionsListStatus: any;
  selectedFile: any;
  tip?: boolean;
  onTipClose?: Function;
}

const DataSetPreviewContent = (props: DataSetPreviewContentProps) => {
  const { filesVersionsListStatus, selectedFile, tip = false, onTipClose } = props;

  // 文件预览相关
  const [filesPreviewListStatus, setFilesPreviewListStatus] = useState<any>({
    name: getParam('name'), // 当前数据集的名字
    selectedFile: '',
    columns: [],
    dataSource: [],
    filesTreeData: [], // 文件树
    fail: false,
    failDes: '',
    loading: false,
    description: '',
    fileType: 'normal',
  });

  useEffect(() => {
    onChange(selectedFile);
    resetSessionLocalCols();
  }, [selectedFile]);

  window.onbeforeunload = function () {
    resetSessionLocalCols();
  };

  useDeepCompareEffect(() => {
    refreshTableList();
  }, [filesPreviewListStatus.selectedFile]);

  const refreshTableList = async () => {
    try {
      setFilesPreviewListStatus((preState: any) => ({
        ...preState,
        columns: [],
        dataSource: [],
        fail: false,
        failDes: '',
      }));
      cancelRequest(API.dataSetFilesPreview);
      if (!filesPreviewListStatus.selectedFile) return;

      setFilesPreviewListStatus((preState: any) => ({
        ...preState,
        loading: true,
      }));
      const payload = {
        version_id: filesVersionsListStatus.version_id,
        doc_id: filesPreviewListStatus.selectedFile,
      };
      const res = await dataSetFilesPreview(payload, {
        timeout: 180000,
        isHideMessage: true,
      });

      const { datas = [] } = res;

      const temp_colm = _.map(Object.keys(datas[0]), key => {
        return {
          title: key,
          dataIndex: key,
          key,
          ellipsis: true,
        };
      }); // 表列

      const temp_dataSource = _.map(datas, item => {
        if (filesPreviewListStatus.fileType === 'jsonl') {
          return item;
        }

        return {
          ...item,
          id: Object.keys(datas[0])[0] + Object.keys(datas[0])[2],
        };
      });

      setFilesPreviewListStatus((preState: any) => ({
        ...preState,
        fail: false,
        failDes: '',
        columns: temp_colm,
        dataSource: temp_dataSource,
        loading: false,
      }));
    } catch (err: any) {
      const { ErrorCode, ErrorDetails } = err?.response;
      if (ErrorCode === 'KnBuilder.DataSet.FilePreviewContentEmpty') {
        setFilesPreviewListStatus((preState: any) => ({
          ...preState,
          columns: [],
          dataSource: [],
          fail: false,
          failDes: 'emptyFile',
          loading: false,
        }));
        return;
      }
      setFilesPreviewListStatus((preState: any) => ({
        ...preState,
        columns: [],
        dataSource: [],
        fail: true,
        failDes: ErrorDetails,
        loading: false,
      }));
    }
  };

  // 获取指定文件内容---click
  const onChange = async (key: string) => {
    const etd = _.filter(filesVersionsListStatus.dataSource, item => item.id === key)[0]
      ?.name.split('.')
      .pop();
    const isJson = etd === 'json' || etd === 'jsonl';

    setFilesPreviewListStatus((preState: any) => ({
      ...preState,
      loading: false,
      fail: false,
      selectedFile: key,
      fileType: isJson ? 'jsonl' : 'normal',
    }));
  };

  const resetSessionLocalCols = () => {
    const length = sessionStorage.length;
    if (length > 0) {
      for (let i = 0; i < length; i++) {
        const key = sessionStorage.key(i);
        if (key?.includes('ADTableCols-dataSet-file-preview')) {
          sessionStorage.removeItem(key);
        }
      }
    }
  };

  const renderPreviewContent = () => {
    if (filesPreviewListStatus.loading) {
      return <LoadingMask loading={filesPreviewListStatus.loading} />;
    }
    if (_.isEmpty(filesPreviewListStatus.dataSource)) {
      if (filesPreviewListStatus.failDes === 'emptyFile') {
        return (
          // <div className="dataSet-files-preview-tip ad-w-100 ad-h-100">{intl.get('dataSet.emptyFilePreview')}</div>
          <NoData imgSrc={emptyImg} desc={intl.get('dataSet.emptyFilePreview')} />
        );
      }
      if (filesPreviewListStatus.fail) {
        return (
          // <>
          //   <div className="dataSet-files-preview-tip ad-w-100 ad-h-100">{intl.get('dataSet.parseFileFailed')}</div>
          //   <div className="dataSet-files-preview-tip ad-w-100 ad-h-100 ad-ellipsis" style={{ overflowX: 'scroll' }}>
          //     {filesPreviewListStatus.failDes}
          //   </div>
          // </>
          <NoData
            imgSrc={failtureImg}
            desc={
              <>
                <div className='dataSet-files-preview-tip ad-w-100 ad-h-100'>{intl.get('dataSet.parseFileFailed')}</div>
                <div className='dataSet-files-preview-tip ad-w-100 ad-h-100 ad-ellipsis' style={{ overflowX: 'scroll' }}>
                  {filesPreviewListStatus.failDes}
                </div>
              </>
            }
          />
        );
      }
      return null;
    } else {
      if (filesPreviewListStatus.fileType === 'normal') {
        return (
          <>
            {tip && <WarningTip text={intl.get('dataSet.previewNormalFileTip', { len: 50 })} close={true} onClose={onTipClose} />}
            <div style={{ height: 'calc(100% - 58px)' }}>
              <ITable
                persistenceID={`dataSet-file-${_.uniqueId('preview')}`}
                showHeader={true}
                lastColWidth={170}
                columns={filesPreviewListStatus.columns}
                dataSource={filesPreviewListStatus.dataSource}
                scroll={_.isEmpty(filesPreviewListStatus.dataSource) ? {} : { y: 480 }}
              />
            </div>
          </>
        );
      }
      return (
        <div>
          {tip && <WarningTip text={intl.get('dataSet.previewJsonFileTip', { len: 20 })} close={true} onClose={onTipClose} />}
          <div className='previewBox'>
            <ParamCodeEditor
              className='functionCodeEditor'
              // ref={editorRef}
              value={_.map(filesPreviewListStatus.dataSource, item => JSON.stringify(item, null, 8)).join(',\n')}
              disabled={true}
              height='500px'
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      {/* 数据集文件预览表格 */}
      <div className='dataSet-files-preview-table'>{renderPreviewContent()}</div>
    </div>
  );
};

export default DataSetPreviewContent;
