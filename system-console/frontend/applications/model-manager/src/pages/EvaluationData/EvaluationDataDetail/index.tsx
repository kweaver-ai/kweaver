import { useRef, useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

import HOOKS from '@/hooks';
import { Modal } from '@/common';

import Header from './Header';
import Description from './Description';
import FileAndVersions from './FileAndVersions';
import Setting from './Setting';

import styles from './index.module.less';

const EvaluationDataDetail = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryParams = Object.fromEntries(searchParams.entries());
  const { safeNavigate, onChangePrevent, openConfirm, onChangeOpenConfirm } = HOOKS.useNavigationGuard();
  const detailHeaderRef = useRef(null); // 详情页头部 ref
  const detailContentRef = useRef(null); // 详情页内容 ref
  const { height: detailHeaderHeight } = HOOKS.useSize(detailHeaderRef); // 详情页头部高度
  const { height: detailContentHeight } = HOOKS.useSize(detailContentRef); // 详情页内容高度

  const [activeKey, setActiveKey] = useState('fileAndVersions'); // 当前激活的tab
  const [sourceData, setSourceData] = useState<any>({}); // 数据源
  useEffect(() => {
    console.log('location', location);
    // console.log('queryParams', queryParams);
    getDetailData();
  }, [JSON.stringify(queryParams)]);
  const getDetailData = async () => {
    setSourceData({
      id: 1,
      name: 'CHID (Chinese IDiom Dataset for Test)',
      description:
        '这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据',
      tags: ['内置'],
      create_user: 'test',
      create_time: '2025-03-21 01:22:47',
      update_user: 'test',
      update_time: '2025-03-31 22:12:35',
    });
  };

  /** 确认 */
  const onOk = () => {
    onChangePrevent(false);
    safeNavigate(-1);
  };
  /** 取消 */
  const onCancel = () => {
    onChangePrevent(false);
    safeNavigate(-1);
  };
  /** 关闭弹窗 */
  const onCancelIcon = () => {
    onChangeOpenConfirm(false);
  };

  // 是否有编辑过变换
  const onEdited = () => onChangePrevent(true);
  const onUnedited = () => onChangePrevent(false);

  /** 返回上一级 */
  const goBack = () => safeNavigate(-1);

  const onChangeActive = (key: string) => setActiveKey(key);

  return (
    <div className={styles['page-evaluation-data-detail']}>
      <Modal.Prompt title='确认退出测评数据吗？' open={openConfirm} onCancel={onCancel} onCancelIcon={onCancelIcon} onOk={onOk}>
        当前页面修改的内容并未保存，若放弃保存将无法恢复已修改的内容，请谨慎操作。
      </Modal.Prompt>
      <div ref={detailHeaderRef} className={styles['page-evaluation-data-detail-title']}>
        <div style={{ width: '1112px', height: '100%', position: 'relative' }}>
          <Header sourceData={sourceData} activeKey={activeKey} goBack={goBack} onChangeActive={onChangeActive} />
        </div>
      </div>
      <div
        ref={detailContentRef}
        className={styles['page-evaluation-data-detail-content']}
        style={{ height: `calc(100% - ${detailHeaderHeight}px)`, padding: `20px calc(50% - 556px)` }}
      >
        <div style={{ width: '1112px', height: '100%', position: 'relative' }}>
          {activeKey === 'description' && <Description onEdited={onEdited} onUnedited={onUnedited} detailContentHeight={detailContentHeight - 40} />}
          {activeKey === 'fileAndVersions' && <FileAndVersions onEdited={onEdited} onUnedited={onUnedited} />}
          {activeKey === 'setting' && <Setting sourceData={sourceData} onEdited={onEdited} onUnedited={onUnedited} />}
        </div>
      </div>
    </div>
  );
};

export default EvaluationDataDetail;
