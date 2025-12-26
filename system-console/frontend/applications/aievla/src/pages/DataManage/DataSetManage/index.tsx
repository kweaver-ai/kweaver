import { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Prompt } from 'react-router-dom';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import { tipModalFunc } from '@/components/TipModal';
import TopSteps from './TopSteps';
import DataSetManageList from './DataSetManageList';

import { getParam } from '@/utils/handleFunction';
import useAdHistory from '@/hooks/useAdHistory';
import HOOKS from '@/hooks';

import { operationType } from '../enum';

import { onChangeDataBatch, onChangeUploadVisible } from '@/reduxConfig/action/uploadFile';
import { connect } from 'react-redux';

import './style.less';

export interface DataSetManageProps {
  title?: string;
  uploadTaskStatus: any;
  uploadDrawVisible: any;
  onChangeUploadVisible: any;
  onChangeFile: any;
}

const DataSetManage = (props: DataSetManageProps) => {
  const { uploadTaskStatus, uploadDrawVisible, onChangeUploadVisible, onChangeFile } = props;
  const prefixCls = 'dataSet-config-root';
  const history = useAdHistory();
  const [configTitle, setConfigTitle] = useState<string>('');
  const [operation, setOperation] = useState<operationType>('create');
  const [isPrevent, setIsPrevent] = useState(false); // 是否阻止路由跳转
  const [usb, setUsb] = useState({}); // 路由
  const language = HOOKS.useLanguage();
  const [isChange, setIsChange] = useState(false); // 版本描述是否改变
  const [isConfigChange, setIsConfigChange] = useState(false);

  const DataSetManageListRef = useRef<any>(null);

  const { action } = getParam(['action']);

  useEffect(() => {
    setConfigTitle(intl.get('dataSet.config.toDataSet'));
    switch (action) {
      case 'create':
        setOperation('create');
        break;
      case 'edit':
        setOperation('edit');
        break;
      case 'editForm':
        setOperation('editForm');
        break;
      case 'check':
        setOperation('check');
        break;
      default:
        setOperation('create');
    }
  }, [action]);

  /**
   * 退出
   */
  const onExit = async () => {
    if (!uploadTaskStatus.includes('success')) {
      const isOk = await tipModalFunc({
        title: intl.get('global.existTitle'),
        content: intl.get('dataSet.importingWillNotContinue'),
        okText: intl.get('global.ok'),
        cancelText: intl.get('global.cancel'),
      });
      if (!isOk) return;
    }

    if (uploadDrawVisible) {
      onChangeUploadVisible({ visible: false });
      onChangeFile({ fileData: { files: [] } });
    }

    let isOk: any = null;

    if (
      (_.includes(['create', 'editForm', 'view'], action) && !isChange && !isConfigChange) ||
      (action === 'edit' && !isChange && !isConfigChange) ||
      action === 'check'
    ) {
      isOk = true;
    } else {
      isOk = await tipModalFunc({
        title: intl.get('dataSet.config.unsaveExitTip').split('\n')[0],
        content: <div className={language === 'en-US' ? 'dataSet-edit-config' : ''}>{intl.get('dataSet.config.unsaveExitTip').split('\n')[1]}</div>,
        okText: intl.get('dataSet.config.saveClose'),
        cancelText: intl.get('dataSet.config.abandonSave'),
      });
    }
    if (isOk) {
      if (isChange || isConfigChange) {
        DataSetManageListRef.current?.saveCurDes();
      }
    } else {
      DataSetManageListRef.current?.resetVersionDes();
    }
    setIsChange(false);
    setIsConfigChange(false);

    setIsPrevent(false);

    Promise.resolve().then(() => {
      history.goBack();
    });
  };

  const onOk = () => {
    setIsPrevent(false);
  };

  return (
    <div className={classNames(prefixCls)}>
      <TopSteps exitText={configTitle} onExit={onExit} isHideStep={true} />
      <div className='dataSet-config-root-main'>
        <ContainerIsVisible isVisible={operation === 'check' || operation === 'edit' || operation === 'create'}>
          <DataSetManageList
            ref={DataSetManageListRef}
            onOk={onOk}
            setIsPrevent={setIsPrevent}
            isChange={isChange}
            setIsChange={setIsChange}
            isConfigChange={isConfigChange}
            setIsConfigChange={setIsConfigChange}
          />
        </ContainerIsVisible>
      </div>
      <Prompt
        when={isPrevent}
        message={location => {
          setUsb('dataSetList');
          return false;
        }}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    uploadTaskStatus: state.getIn(['uploadFile', 'status']),
    /** 上传弹窗的展示控制 */
    uploadDrawVisible: state.getIn(['uploadFile', 'visible']),
  };
};
const mapDispatchToProps = (dispatch: any) => ({
  /** 控制上传弹窗的展示 */
  onChangeUploadVisible: (data: { visible: boolean }) => dispatch(onChangeUploadVisible(data)),
  // 上传文件
  onChangeFile: (data: { files: { file: Blob; [key: string]: any }[] }) => dispatch(onChangeDataBatch(data)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)((props: any) => {
  return <DataSetManage {...props} />;
});
