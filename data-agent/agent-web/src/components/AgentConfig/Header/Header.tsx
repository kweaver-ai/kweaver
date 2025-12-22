import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useBlocker } from 'react-router-dom';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { LeftOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useNavigationBlocker } from '@/hooks';
import { useAgentConfig } from '../AgentConfigContext';
import { getAgentManagementPerm } from '@/apis/agent-factory';
import { PublishSettingsModal, PublishModeEnum } from '@/components/AgentPublish';
import AgentIcon from '@/components/AgentIcon';
import styles from './Header.module.less';

interface HeaderProps {
  // 是否是模板的编辑页面
  isEditTemplate?: boolean;
  showDebugger: boolean;
  onToggleDebugger: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isEditTemplate = false, showDebugger, onToggleDebugger }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, actions } = useAgentConfig();
  const [isSaving, setIsSaving] = useState(false);
  const [modal, contextHolder] = Modal.useModal();
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [hasPublishPermission, setHasPublishPermission] = useState<boolean>(false); // 是否有发布权限

  const isTemplate = useMemo(() => searchParams.get('mode') === 'editTemplate', [searchParams]);

  const handleSave = useCallback(
    async ({ onSuccess }: { onSuccess?: any } = {}) => {
      setIsSaving(true);
      try {
        const result = await actions.saveAgent({ isEditTemplate, onSuccess });
        if (!result) {
          // 保存失败，由saveAgent内部处理错误消息
          console.log('保存失败');
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.error('保存Agent出错:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [actions]
  );

  const handleNavigation = useCallback(
    (blocker: ReturnType<typeof useBlocker>) => {
      modal.confirm({
        centered: true,
        title: intl.get('global.existTitle'),
        content: intl.get('benchmarkTask.exitContent'),
        okText: intl.get('prompt.saveClose'),
        onOk: async () => {
          // 调用保存接口。保存并关闭，成功后无需做操作
          if (await handleSave({ onSuccess: () => {} })) {
            blocker.proceed!();
          } else {
            blocker.reset!();
          }
        },
        cancelText: intl.get('prompt.abandon'),
        onCancel: () => {
          blocker.proceed!();
        },
      });
    },
    [handleSave, modal]
  );

  useNavigationBlocker({
    shouldBlock: !!state.isDirty,
    handleNavigation,
  });

  const redirect = () => {
    // 优先使用url的redirect进行跳转-山东大数据局
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      location.replace(redirectUrl);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    // 获取发布权限
    const fetchPublishPerm = async () => {
      try {
        const {
          agent: { publish: publishAgentPerm },
          agent_tpl: { publish: publishTemplatePerm },
        } = await getAgentManagementPerm();

        setHasPublishPermission(isEditTemplate ? publishTemplatePerm : publishAgentPerm);
      } catch {}
    };

    fetchPublishPerm();
  }, []);

  const handlePublishClick = async () => {
    let agentId = state.id;
    if (!agentId) {
      // If agent hasn't been saved yet, save it first
      const id = await actions.saveAgent({ isEditTemplate });
      if (!id) {
        return;
      }
      agentId = id;
    } else {
      // 如果agentId存在，则先更新
      const id = await actions.saveAgent({ isEditTemplate });
      if (!id) return;
    }

    setPublishModalVisible(true);
  };

  const handlePublishSubmit = async () => {
    setPublishModalVisible(false);
    redirect();
  };

  const handlePublishCancel = () => {
    setPublishModalVisible(false);
  };

  const handleToggleDebugger = async () => {
    if (showDebugger === false && !state.id) {
      const res = await handleSave();
      if (!res) {
        return;
      }
    }
    onToggleDebugger(!showDebugger);
  };

  return (
    <>
      <header
        className={classNames(
          styles.appHeader,
          'dip-flex-space-between',
          'dip-bg-white',
          'dip-pr-24',
          'dip-pl-24',
          'dip-border-line-b'
        )}
      >
        <div className={styles.headerLeft}>
          <LeftOutlined className={styles.backIcon} onClick={redirect} />
          <AgentIcon avatar_type={state.avatar_type} avatar={state.avatar} name={state.name} size={24} />
          <div>{state.name || intl.get('dataAgent.config.untitled')}</div>
        </div>
        <div className={styles.headerRight}>
          {process.env.NODE_ENV === 'development' && (
            <Button
              className="dip-min-width-72"
              onClick={() => {
                console.log(state);
              }}
            >
              查看配置Store
            </Button>
          )}
          {/* 编辑模板页面 屏蔽调试 */}
          {!isTemplate && (
            <Button className="dip-min-width-72" onClick={handleToggleDebugger}>
              {showDebugger ? intl.get('dataAgent.config.closeDebugger') : intl.get('dataAgent.config.openDebugger')}
            </Button>
          )}

          <Button className="dip-min-width-72" onClick={handleSave} disabled={isSaving}>
            {isSaving ? intl.get('dataAgent.config.saving') : intl.get('dataAgent.config.save')}
          </Button>
          {hasPublishPermission && (
            <Button type="primary" className="dip-min-width-72" onClick={handlePublishClick}>
              {intl.get('dataAgent.publish')}
            </Button>
          )}
        </div>
      </header>

      {/* 发布设置弹窗 */}
      {publishModalVisible && (
        <PublishSettingsModal
          mode={isEditTemplate ? PublishModeEnum.PublishTemplate : PublishModeEnum.PublishAgent}
          agent={state}
          onCancel={handlePublishCancel}
          onOk={handlePublishSubmit}
        />
      )}
      {contextHolder}
    </>
  );
};

export default Header;
