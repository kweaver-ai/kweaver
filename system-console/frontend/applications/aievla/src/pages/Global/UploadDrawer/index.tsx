import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import { BorderOutlined, ExclamationCircleFilled, MinusOutlined } from '@ant-design/icons';
import { v4 as generateUuid } from 'uuid';

import { onChangeUploadStatus, onChangeUploadVisible } from '@/reduxConfig/action/uploadFile';
import { FAIL, PENDING, SUCCESS, UPLOADING } from '@/reduxConfig/reducers/uploadFile';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import UploadLine from './UploadLine';

import HELPER from '@/utils/helper';

import './style.less';

export interface FileType extends Blob {
  uid: string;
  status: string;
}

const UploadDrawer = (props: any) => {
  const { visible, modelData, status: uploadStatus, onChangeUploadStatus, onChangeUploadVisible } = props; // redux 注入属性

  const [items, setItems] = useState<any>([]);
  const lastItems = React.useRef(items); // 操作items后的最新值
  const [isIncompletion, setIsIncompletion] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  /** 已上传的内容大小 */
  const [uploadedSize, setUploadedSize] = useState(5);
  const [completeTask, setCompleteTask] = useState(false);
  const [isCancelAll, setIsCancelAll] = useState(false);

  const updateOnlineStatus = () => {
    const condition = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    setNetworkStatus(condition || 'ONLINE');
  };
  useEffect(() => {
    if (visible) {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    } else {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    }
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [visible]);

  const dependency = useMemo(() => {
    if (_.isEmpty(modelData.files)) return _.uniqueId('--empty-');
    return _.map(modelData.files, fileObj => fileObj.file.uid).join(',');
  }, [modelData.files]);

  useEffect(() => {
    // 关闭弹窗
    if (_.isEmpty(modelData.files)) {
      if (!_.isEmpty(items)) {
        onChangeItems([]);
        onChangeUploadVisible({ visible: false });
      }
      return;
    }
    const cloneFiles = _.cloneDeep(modelData.files);

    const tem_pendingFilesData = _.map(cloneFiles, fileObj => {
      const uid = fileObj.name + fileObj.size + new Date().valueOf();
      fileObj.uid = uid;
      fileObj.status = 'pending';
      return fileObj;
    });

    onChangeItems([...items, ...tem_pendingFilesData]);
    onTriggerDrawerSize(false);
    setCompleteTask(false);
    setIsCancelAll(false);
    setUploadedSize(5);
  }, [dependency]);

  /** 正在上传的文件数量 */
  const uploadingFileNumber = _.filter(items, item => item?.file?.status === 'uploading')?.length;
  const failedFileNumber = _.filter(items, item => item?.file?.status === 'fail')?.length;
  useEffect(() => {
    if (uploadingFileNumber === 0 && failedFileNumber === 0) {
      !isCancelAll && onTriggerDrawerSize();
      setCompleteTask(true);
      onChangeUploadStatus({ status: SUCCESS + generateUuid().replace(/-/g, '_') });
      return;
    }
    if (uploadingFileNumber !== 0) {
      onChangeUploadStatus({ status: UPLOADING + generateUuid().replace(/-/g, '_') });
      return;
    }
    onChangeUploadStatus({ status: SUCCESS + generateUuid().replace(/-/g, '_') });
  }, [uploadingFileNumber, failedFileNumber]);

  /** 最小化或展开上传进度框 */
  const onTriggerDrawerSize = (flag?: boolean) => {
    setIsIncompletion(flag ?? !isIncompletion);
  };

  /** 关闭上传抽屉 */
  const onCloseDrawer = async () => {
    const uploadingLength = _.filter(items, item => item.file.status === 'uploading')?.length;
    if (uploadingLength) {
      const isOk = await tipModalFunc({
        title: intl.get('global.existTitle'),
        content: intl.get('dataSet.importingWillNotContinue'),
        okText: intl.get('global.ok'),
        cancelText: intl.get('global.cancel'),
      });
      if (isOk) {
        onChangeItems([]);
        onChangeUploadStatus({ status: PENDING });
        onChangeUploadVisible({ visible: false });
      }
    } else {
      onChangeItems([]);
      // onChangeUploadStatus({ status: SUCCESS });
      onChangeUploadVisible({ visible: false });
    }
  };

  /**
   * 全部取消
   */
  const handleCancelAll = () => {
    // setTimeout(() => {
    const newItems = _.filter(items, item => item.file.status === 'success');
    setIsCancelAll(true);
    onChangeItems(newItems);
    setUploadedSize(5);
    // }, 1000);
  };

  /** 取消上传 */
  const onCancel = (fileId: string) => {
    const newItems = _.filter(items, item => item.file.uid !== fileId);
    onChangeItems(newItems);
  };

  /**
   * 更新items
   * @param newItems 新的items
   */
  const onChangeItems = (newItems: any) => {
    setItems(newItems);
    lastItems.current = newItems;
  };

  /** 修改文件状态 */
  const onChangeFileStatus = (fileId: string, fileStatus: string) => {
    const newItems = _.map(lastItems.current, item => {
      if (item.file.uid !== fileId) return item;
      item.file.status = fileStatus;
      return item;
    });
    onChangeItems(newItems);
  };

  if (!visible) return null;

  return (
    <div className={classnames('uploadDrawerRoot', { incompletion: isIncompletion })}>
      <div className='header'>
        <div className='title'>
          {(uploadStatus.includes(UPLOADING) || uploadingFileNumber !== 0) &&
            intl.get('dataSet.uploadingNumber', {
              number: uploadingFileNumber,
              speed: `${HELPER.formatFileSize(Math.floor((uploadedSize * 1024 * 3) / lastItems.current.length))}/s`,
            })}

          {completeTask && intl.get('dataSet.importsClosure')}
          {uploadStatus.includes(SUCCESS) && failedFileNumber !== 0
            ? intl.get('dataSet.importsClosure') + intl.get('dataSet.uploadFilesFailNumbers', { number: failedFileNumber })
            : ''}
          {uploadStatus === FAIL && intl.get('dataSet.importFailed')}
        </div>
        <div className='operation'>
          <span className='icon' onClick={() => onTriggerDrawerSize()}>
            {isIncompletion ? <BorderOutlined /> : <MinusOutlined />}
          </span>
          <IconFont className='icon' type='icon-guanbiquxiao' onClick={onCloseDrawer} />
        </div>
      </div>
      <div className='reminder'>
        <ExclamationCircleFilled style={{ color: '#FAAD14', marginRight: 8 }} />
        {intl.get('global.uploadWaringTip')}
      </div>
      <div className='content'>
        {_.map(items, item => {
          return (
            <UploadLine
              key={item.file.uid}
              source={item}
              uploadStatus={uploadStatus}
              networkStatus={networkStatus}
              onCancel={onCancel}
              onChangeFileStatus={onChangeFileStatus}
              onTriggerDrawerSize={onTriggerDrawerSize}
              onChangeUploadStatus={onChangeUploadStatus}
              setUploadedSize={setUploadedSize}
            />
          );
        })}
      </div>
      <div className='footer'>
        <Button onClick={handleCancelAll}>{intl.get('global.cancelAll')}</Button>
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    /** 上传弹窗的展示控制 */
    visible: state.getIn(['uploadFile', 'visible']),
    /** 上传任务的状态 */
    status: state.getIn(['uploadFile', 'status']),
    /** 模型数据（文件和需要创建的模型） */
    modelData: state.getIn(['uploadFile', 'modelData']).toJS(),
  };
};
const mapDispatchToProps = (dispatch: any) => ({
  /** 控制上传弹窗的展示 */
  onChangeUploadVisible: (data: { visible: boolean }) => dispatch(onChangeUploadVisible(data)),
  /** 上传任务状态变更 */
  onChangeUploadStatus: (data: { status: string }) => dispatch(onChangeUploadStatus(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UploadDrawer);
