import styles from './index.module.less';
import classNames from 'classnames';
import { Attachments, Sender, Suggestion } from '@ant-design/x';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AiInputProps, AiInputRef, AiInputValue } from './interface';
import _ from 'lodash';
import { Col, GetRef, message, Row, Tooltip } from 'antd';
import { CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { useLatestState } from '@/hooks';
import DipIcon from '@/components/DipIcon';
import { FileTypeIcon, getFileExtension } from '@/utils/doc';
import { TempFileTypeEnum } from '@/apis/intelli-search/type';
import FileUploadBtn from '../FileUploadBtn';
import { getFileUploadEnable, getTempAreaEnable } from '../../utils';
// import { FileItem } from '@/components/DipChat/interface';
import { checkFileStatus } from '@/apis/agent-app';
import ResizeObserver from '@/components/ResizeObserver';
import { FileItem } from '@/components/DipChat/interface';
import intl from 'react-intl-universal';
const AiInput = forwardRef<AiInputRef, AiInputProps>((props, ref) => {
  const {
    value,
    onChange,
    suggestions,
    onSubmit,
    loading,
    clearAfterSend = true,
    onCancel,
    disabled,
    deepThink = {
      hidden: true,
      disabledForNormal: true,
      disabledForNetworking: true,
      selectedForNormal: false,
      selectedForNetworking: false,
    },
    agentConfig,
    agentAppType,
    tempFileList = [],
    autoSize = { minRows: 3, maxRows: 6 },
    onPreviewFile,
    ...restProps
  } = props;
  const [messageApi, contextHolder] = message.useMessage();

  const senderRef = React.useRef<GetRef<typeof Sender>>(null);
  const valueRef = useRef<AiInputValue>(value);

  // 文件相关props
  const attachmentsRef = React.useRef<GetRef<typeof Attachments>>(null);
  const fileResolveTimer = useRef<any>();

  // 建议项相关props
  const [suggestionOpen, setSuggestionOpen] = useLatestState(false);
  const currentSuggestion = useRef({
    triggerChar: '',
    triggerCharIndex: -1,
    items: [] as any,
  });

  const [colSpan, setColPan] = useState(8);

  useImperativeHandle(ref, () => ({
    reset: resetForm,
  }));

  const fileListIds = value.fileList.map(file => file.id).join(',');
  useEffect(() => {
    if (fileListIds) {
      getFileStatus();
    }
    return () => {
      if (fileResolveTimer.current) {
        clearTimeout(fileResolveTimer.current);
        fileResolveTimer.current = null;
      }
    };
  }, [fileListIds]);

  const getFileStatus = () => {
    const reqParams = value.fileList.map(file => ({
      id: file.id,
      type: TempFileTypeEnum.Doc,
    }));
    checkFileIndexStatus(reqParams, (process: number, fileStatusData: any) => {
      const newValue = _.cloneDeep(valueRef.current);
      newValue.fileList = newValue.fileList.map(file => {
        const target = fileStatusData.find((item: any) => item.id === file.id);
        return {
          ...file,
          status: target?.status ?? 'processing',
          error: target?.status === 'failed' ? (target?.msg ?? intl.get('dipChat.fileParseError')) : '',
        };
      });
      handleChange(newValue);
    });
  };

  const handleChange = (newValue: AiInputValue) => {
    valueRef.current = newValue;
    onChange?.(newValue);
  };

  const resetForm = () => {
    const newValue = _.cloneDeep(value);
    newValue.inputValue = '';
    newValue.fileList = [];
    handleChange(newValue);
    senderRef.current?.focus();
  };

  const suggestionSelect = (selectValue: string) => {
    const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || 0;
    const triggerCharIndex = currentSuggestion.current.triggerCharIndex;
    // 将输入值从触发字符索引到光标位置替换为空字符串
    const inputValue = value.inputValue;
    const newInputValue = inputValue.substring(0, triggerCharIndex) + inputValue.substring(cursorPosition);
    const newValue = _.cloneDeep(value);
    newValue.inputValue = newInputValue;
    handleChange(newValue);
  };

  const fileResolveFinish = useMemo(() => {
    if (value.fileList.length > 0) {
      return value.fileList.some(file => file.status === 'completed');
    }
    return true;
  }, [value.fileList]);

  const inputDisabled =
    !fileResolveFinish || (!value.inputValue && value.fileList.length === 0 && tempFileList.length === 0);

  const handleSubmit = () => {
    if (!inputDisabled && !loading) {
      senderRef.current?.focus();
      onSubmit?.(value);
      if (clearAfterSend) {
        resetForm();
      }
    }
  };

  const checkFileIndexStatus = async (files: any, cb: any) => {
    const { progress, process_info } = await checkFileStatus(files);
    cb(progress, process_info);
    if (progress !== 100) {
      fileResolveTimer.current = setTimeout(() => {
        checkFileIndexStatus(files, cb);
      }, 3000);
    }
  };

  const renderStatusIcon = (file: FileItem) => {
    if (file.status === 'processing') {
      return <LoadingOutlined className="dip-text-color-primary" />;
    }
    if (file.status === 'failed') {
      return (
        <Tooltip title={file.error}>
          <CloseCircleFilled className="dip-text-color-error" />
        </Tooltip>
      );
    }
  };

  const senderHeader = (
    <Sender.Header title="" open={value.fileList.length > 0} closable={false}>
      <ResizeObserver
        onResize={({ width }) => {
          console.log(width, 'width');
          if (width < 400) {
            setColPan(12);
          } else {
            setColPan(8);
          }
        }}
      >
        <div className="dip-full">
          <Row gutter={[16, 16]} className={styles.fileWrapper}>
            {value.fileList.map(item => (
              <Col span={colSpan} key={item.id}>
                <div
                  onClick={() => {
                    onPreviewFile?.(item);
                  }}
                  className={classNames(styles.fileItem, 'dip-flex-align-center')}
                >
                  <FileTypeIcon extension={getFileExtension(item.name)} fontSize={20} />
                  <div className="dip-ml-8 dip-flex-item-full-width dip-flex-align-center">
                    <div title={item.name} className="dip-ellipsis dip-flex-item-full-width">
                      {item.name}
                    </div>
                    {renderStatusIcon(item)}
                  </div>
                  <div
                    className={styles.delete}
                    onClick={e => {
                      e.stopPropagation();
                      const newValue = _.cloneDeep(value);
                      newValue.fileList = newValue.fileList.filter(file => file.id !== item.id);
                      handleChange(newValue);
                    }}
                  >
                    <CloseCircleFilled />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </ResizeObserver>
    </Sender.Header>
  );

  const getDeepThinkDisabled = () => {
    if (!deepThink.hidden) {
      if (disabled) {
        return true;
      }
      return value.mode === 'networking' ? deepThink.disabledForNetworking : deepThink.disabledForNormal;
    }
    return false;
  };

  const options = [
    {
      label: intl.get('dipChat.deepSearch'),
      icon: 'icon-dip-deep-thinking',
      value: 'deep-search',
      disabled: disabled,
      visible: agentAppType === 'super-assistant',
      active: value.mode === 'deep-search',
    },
    {
      label: intl.get('dipChat.networking'),
      icon: 'icon-dip-net',
      value: 'networking',
      disabled: disabled,
      visible: agentAppType === 'super-assistant',
      active: value.mode === 'networking',
    },
    {
      label: intl.get('dipChat.deepThinking'),
      icon: 'icon-dip-think',
      value: 'deepThink',
      disabled: getDeepThinkDisabled(),
      disabledTip:
        value.mode === 'networking'
          ? intl.get('dipChat.networkingModeNotConfigured')
          : intl.get('dipChat.normalModeNotConfigured'),
      visible: agentAppType === 'super-assistant' && !deepThink.hidden,
      active: value.deepThink,
    },
  ];

  const fileBtnDisabled = disabled || value.mode !== 'normal';

  const renderFileBtnTip = () => {
    if (fileBtnDisabled) {
      if (value.mode === 'networking') {
        return intl.get('dipChat.networkingModeNoFileUpload');
      }
      if (value.mode === 'deep-search') {
        return intl.get('dipChat.deepSearchNoFileUpload');
      }
    }
  };

  const renderFileBtn = () => {
    let show = false;
    if (agentConfig.debug) {
      // 调试模式下，无论文件上传怎么配置，上传文件按钮都是在对话框里面
      if (getTempAreaEnable(agentConfig) || getFileUploadEnable(agentConfig)) {
        show = true;
      }
    } else if (getFileUploadEnable(agentConfig)) {
      show = true;
    }
    if (show) {
      return (
        <FileUploadBtn
          agentConfig={agentConfig}
          disabled={fileBtnDisabled}
          tip={renderFileBtnTip()}
          value={value.fileList}
          onChange={fileData => {
            const newValue = _.cloneDeep(value);
            newValue.fileList = fileData;
            handleChange(newValue);
            senderRef.current?.focus();
          }}
        />
      );
    }
  };

  const getModeBtnTip = (item: any) => {
    if (item.disabled) {
      return item.disabledTip ?? '';
    }
    if (item.active && item.value === 'deepThink') {
      if (value.mode === 'normal' && deepThink.selectedForNormal) {
        return intl.get('dipChat.rlmModelRequired');
      }
      if (value.mode === 'networking' && deepThink.selectedForNetworking) {
        return intl.get('dipChat.rlmModelRequired');
      }
    }
    return '';
  };
  const getModeBtnTipOpen = (item: any) => {
    if (item.disabled) {
      return undefined;
    }
    if (value.mode === 'normal' && deepThink.selectedForNormal) {
      return undefined;
    }
    if (value.mode === 'networking' && deepThink.selectedForNetworking) {
      return undefined;
    }
    return false;
  };

  return (
    <div className={classNames(styles.container, 'ai-input')}>
      {contextHolder}
      <Suggestion
        block
        items={items => items}
        onSelect={suggestionSelect}
        onOpenChange={open => {
          setSuggestionOpen(open);
        }}
      >
        {({ onTrigger, onKeyDown }) => {
          return (
            <Sender
              {...restProps}
              value={value?.inputValue}
              onChange={nextVal => {
                const newValue = _.cloneDeep(value);
                newValue.inputValue = nextVal;
                handleChange(newValue);
                if (!_.isEmpty(suggestions) && nextVal) {
                  const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || 0;
                  const textBeforeCursor = nextVal.slice(0, cursorPosition); // 光标之前的文本
                  const charBeforeCursor = nextVal.slice(cursorPosition - 1, cursorPosition); // 光标之前的最后一个字符;
                  // console.log(textBeforeCursor, '光标之前的文本');
                  // console.log(charBeforeCursor, '光标之前的最后一个字符');
                  const targetSuggestion = suggestions!.find(item => item.triggerChar === charBeforeCursor);
                  if (targetSuggestion) {
                    currentSuggestion.current = {
                      triggerChar: targetSuggestion.triggerChar,
                      triggerCharIndex: textBeforeCursor.lastIndexOf(targetSuggestion.triggerChar),
                      items: targetSuggestion.items,
                    };
                  }
                  const triggerCharIndex = currentSuggestion.current.triggerCharIndex;
                  if (triggerCharIndex !== -1) {
                    const searchText = textBeforeCursor.slice(triggerCharIndex + 1);
                    if (searchText) {
                      const searchItems = currentSuggestion.current.items.filter((item: any) =>
                        item.value.includes(searchText)
                      );
                      if (searchItems.length > 0) {
                        onTrigger(searchItems);
                      } else {
                        if (suggestionOpen) {
                          onTrigger(false);
                        }
                      }
                    } else {
                      onTrigger(currentSuggestion.current.items);
                    }
                  }
                  return;
                }
                if (suggestionOpen) {
                  onTrigger(false);
                }
              }}
              onKeyDown={onKeyDown}
              ref={senderRef}
              onPasteFile={(_, files) => {
                Array.from(files).forEach(file => {
                  attachmentsRef.current?.upload(file);
                });
              }}
              autoSize={autoSize}
              footer={({ components }) => {
                const { SendButton, LoadingButton } = components;
                return (
                  <div className="dip-flex-space-between">
                    <span className="dip-flex-align-center">
                      {renderFileBtn()}

                      <div className={classNames(styles.menu)}>
                        {options
                          .filter((item: any) => item.visible)
                          .map((item: any) => (
                            <Tooltip key={item.value} title={getModeBtnTip(item)} open={getModeBtnTipOpen(item)}>
                              <div
                                className={classNames(styles.menuItem, 'dip-flex-align-center', {
                                  [styles.active]: item.active,
                                  [styles.disabled]: item.disabled,
                                })}
                                onClick={() => {
                                  if (!item.disabled) {
                                    const newValue = _.cloneDeep(value);
                                    if (item.value === 'deepThink') {
                                      newValue.deepThink = !newValue.deepThink;
                                      if (newValue.mode === 'normal' && deepThink.selectedForNormal) {
                                        newValue.deepThink = true;
                                      }
                                      if (newValue.mode === 'networking' && deepThink.selectedForNetworking) {
                                        newValue.deepThink = true;
                                      }
                                      if (newValue.deepThink && newValue.mode === 'deep-search') {
                                        newValue.mode = 'normal';
                                      }
                                    } else {
                                      newValue.mode = newValue.mode === item.value ? 'normal' : item.value;
                                      if (newValue.mode === 'deep-search') {
                                        newValue.fileList = [];
                                        newValue.deepThink = false;
                                      }
                                      if (newValue.mode === 'networking') {
                                        newValue.fileList = [];
                                        if (deepThink.disabledForNetworking) {
                                          newValue.deepThink = false;
                                        } else if (deepThink.selectedForNetworking) {
                                          newValue.deepThink = true;
                                        }
                                      }
                                      if (newValue.mode === 'normal') {
                                        if (deepThink.disabledForNormal) {
                                          newValue.deepThink = false;
                                        } else if (deepThink.selectedForNormal) {
                                          newValue.deepThink = true;
                                        }
                                      }
                                    }
                                    handleChange(newValue);
                                  }
                                }}
                              >
                                <DipIcon type={item.icon} />
                                <span className="dip-ml-8">{item.label}</span>
                              </div>
                            </Tooltip>
                          ))}
                      </div>
                    </span>
                    <span>
                      {loading ? (
                        <Tooltip title="停止输出">
                          <LoadingButton onClick={onCancel} type="default" disabled={false} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="请输入你的问题" open={inputDisabled ? undefined : false}>
                          <SendButton
                            onClick={() => {
                              if (!value?.inputValue) {
                                handleSubmit();
                              }
                            }}
                            shape="default"
                            type="primary"
                            disabled={inputDisabled}
                          />
                        </Tooltip>
                      )}
                    </span>
                  </div>
                );
              }}
              onSubmit={handleSubmit}
              header={senderHeader}
              disabled={disabled}
              style={{ resize: 'none' }}
              actions={false}
              onKeyPress={e => {
                // 输入框没内容但是上传了文件的时候，按Enter键允许发送
                if (e.key === 'Enter' && !e.shiftKey && !value?.inputValue) {
                  handleSubmit();
                }
              }}
            />
          );
        }}
      </Suggestion>
    </div>
  );
});

export default AiInput;
