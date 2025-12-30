import styles from './index.module.less';
import classNames from 'classnames';
import ScrollBarContainer from '@/components/ScrollBarContainer';
import FileUploadBtn from '../../../components/FileUploadBtn';
import NoData from '@/components/NoData';
import { Button, Checkbox, message, Spin, Tooltip } from 'antd';
import DipIcon from '@/components/DipIcon';
import DipButton from '@/components/DipButton';
import { FileTypeIcon, getFileExtension } from '@/utils/doc';
import { useEffect, useRef } from 'react';
import { TempFileTypeEnum } from '@/apis/intelli-search/type';
import { LoadingOutlined } from '@ant-design/icons';
import { useDipChatStore } from '@/components/DipChat/store';
import { checkFileStatus } from '@/apis/agent-app';
import type { FileItem } from '@/components/DipChat/interface';
import intl from 'react-intl-universal';
import { addFileToTemp, createTemp, getTempFiles, removeTempFile } from '@/apis/agent-app';
import { createConversation, updateConversation } from '@/apis/super-assistant';
import { getConversationByKey, getTempAreaConfigFromAgent } from '@/components/DipChat/utils';
const FileArea = ({ onPreviewFile }: any) => {
  const {
    dipChatStore: { agentDetails, tempFileList, agentAppKey, conversationItems, activeConversationKey, debug },
    setDipChatStore,
    getDipChatStore,
    getConversationData,
  } = useDipChatStore();
  const [messageApi, contextHolder] = message.useMessage();
  const agentConfig = agentDetails?.config || {};
  const fileResolveTimer = useRef<any>();
  const tempAreaInit = useRef<boolean>(false); // 临时区是否首次创建
  const tempFileListIds = tempFileList.map(file => file.id).join(',');
  const activeConversation = getConversationByKey(conversationItems, activeConversationKey);
  const validateConfig = getTempAreaConfigFromAgent(agentConfig);
  const { single_chat_max_select_file_count } = validateConfig;
  useEffect(() => {
    if (activeConversation?.temparea_id && !tempAreaInit.current) {
      getFileListByTempId();
    }
    return () => {
      if (activeConversation?.temparea_id) {
        setDipChatStore({ tempFileList: [] });
        tempAreaInit.current = false;
      }
    };
  }, [activeConversation?.temparea_id]);

  useEffect(() => {
    if (tempFileListIds) {
      getFileStatus();
    }
    return () => {
      if (fileResolveTimer.current) {
        clearTimeout(fileResolveTimer.current);
        fileResolveTimer.current = null;
      }
    };
  }, [tempFileListIds]);

  const getFileListByTempId = async () => {
    const data = await getTempFiles(activeConversation!.temparea_id);
    if (data) {
      // console.log(data, '临时区文件');
      const fileList: FileItem[] = data.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.details.name,
        size: item.details.size,
        docid: item.details.id,
        error: '',
        status: 'completed',
        checked: false,
      }));
      setDipChatStore({ tempFileList: fileList });
    }
  };

  const getFileStatus = () => {
    const reqParams = tempFileList.map(file => ({
      id: file.id,
      type: TempFileTypeEnum.Doc,
    }));
    checkFileIndexStatus(reqParams, (_progress: number, fileStatusData: any) => {
      const { tempFileList } = getDipChatStore();
      const newTempFileList = tempFileList.map(file => {
        const target = fileStatusData.find((item: any) => item.id === file.id);
        return {
          ...file,
          status: target?.status ?? 'processing',
          error: target?.status === 'failed' ? (target?.msg ?? '文件解析错误') : '',
        };
      });
      setDipChatStore({ tempFileList: newTempFileList });
    });
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

  const deleteFile = async (fileIds: string[]) => {
    const res = await removeTempFile({
      tempId: activeConversation!.temparea_id,
      sourceIds: fileIds,
    });
    if (res) {
      setDipChatStore({
        tempFileList: tempFileList.filter(item => !fileIds.includes(item.id)),
      });
    }
  };

  const fileChange = (value: FileItem[]) => {
    setDipChatStore({ tempFileList: value });
  };

  const renderContent = () => {
    if (tempFileList.length === 0) {
      return (
        <div className="dip-full dip-center">
          <div className="dip-flex-column-center">
            <NoData tip={intl.get('dipChat.noTempData')} />
            <div className="dip-mt-12">
              <FileUploadBtn
                value={tempFileList}
                onChange={fileChange}
                agentConfig={agentConfig}
                customBtn={
                  <Button size="small" icon={<DipIcon className="dip-font-12" type="icon-dip-upload" />}>
                    {intl.get('dipChat.uploadData')}
                  </Button>
                }
                onNewUploadChange={onNewUploadChange}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        {tempFileList.map(file => {
          return (
            <div className={styles.fileItem} key={file.id}>
              <div className="dip-flex-align-center dip-flex-item-full-width">
                <Checkbox
                  disabled={file.status !== 'completed'}
                  checked={file.checked}
                  onChange={e => {
                    if (e.target.checked) {
                      const checkedFiles = tempFileList.filter(item => item.checked);
                      if (checkedFiles.length >= single_chat_max_select_file_count) {
                        messageApi.warning(
                          intl.get('dipChat.singleChatMaxFiles', { count: single_chat_max_select_file_count })
                        );
                        return;
                      }
                    }
                    setDipChatStore({
                      tempFileList: tempFileList.map(item => {
                        if (item.id === file.id) {
                          return {
                            ...item,
                            checked: e.target.checked,
                          };
                        }
                        return { ...item };
                      }),
                    });
                  }}
                />
                <div
                  className="dip-flex-align-center dip-flex-item-full-width dip-ml-8 dip-pointer"
                  onClick={e => {
                    console.log(file, '预览的文件----FileArea');
                    e.stopPropagation();
                    onPreviewFile(file);
                  }}
                >
                  <FileTypeIcon extension={getFileExtension(file.name)} fontSize={16} />
                  <span
                    title={file.name}
                    className={classNames(styles.fileName, 'dip-flex-item-full-width dip-ellipsis')}
                  >
                    {file.name}
                  </span>
                  {file.status === 'processing' && (
                    <span className="dip-ml-4 dip-mr-4">
                      <Spin indicator={<LoadingOutlined spin />} size="small" />
                    </span>
                  )}
                </div>
              </div>
              <span className={styles.btn}>
                <Tooltip title={intl.get('dipChat.remove')}>
                  <DipButton
                    onClick={e => {
                      e.stopPropagation();
                      deleteFile([file.id]);
                    }}
                    size="small"
                    type="text"
                    icon={<DipIcon type="icon-dip-trash" />}
                  />
                </Tooltip>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  /** 会话列表数据逻辑处理 */
  const handleConversation = (conversation_id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('conversation_id', conversation_id);
    // 使用history API更新URL而不刷新页面
    window.history.replaceState({}, '', url.toString());
    setDipChatStore({
      activeConversationKey: conversation_id,
    });
    getConversationData();
  };

  const onNewUploadChange = (files: FileItem[]): Promise<boolean> =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async resolve => {
      const { activeConversationKey } = getDipChatStore();
      const agent_id = agentDetails!.id;
      const agent_version = agentDetails!.version;
      const filesParam = files.map(item => ({
        id: item.id,
        type: item.type,
      }));
      if (!activeConversation?.temparea_id) {
        // 创建临时区ID，通过会话接口存下来
        const res: any = await createTemp({ source: filesParam, agent_id, agent_version });
        if (res) {
          tempAreaInit.current = true;
          if (activeConversationKey) {
            await updateConversation(agentAppKey, activeConversationKey, {
              temparea_id: res.id,
              title: activeConversation?.label || '新会话',
            });
            getConversationData();
          } else {
            const conversationRes = await createConversation(agentAppKey, {
              temparea_id: res.id,
              agent_id: agentDetails.id,
              agent_version: debug ? 'v0' : agentDetails.version,
              executor_version: 'v2',
            });
            if (conversationRes) {
              const conversation_id = conversationRes.id;
              handleConversation(conversation_id);
            }
          }
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        const res: any = await addFileToTemp({
          id: activeConversation.temparea_id,
          source: filesParam,
          agent_id,
          agent_version,
        });
        if (res) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });

  return (
    <div className={classNames(styles.container, 'dip-flex-column')}>
      {contextHolder}
      <div className="dip-flex-space-between dip-pl-8 dip-pr-8">
        <span className="dip-font-weight-700">临时文件</span>
        <FileUploadBtn
          value={tempFileList}
          onChange={fileChange}
          agentConfig={agentConfig}
          onNewUploadChange={onNewUploadChange}
        />
      </div>
      <ScrollBarContainer className="dip-flex-item-full-height dip-pl-8 dip-pr-8">{renderContent()}</ScrollBarContainer>
    </div>
  );
};

export default FileArea;
