import { Button, message, Tooltip } from 'antd';
import DipIcon from '@/components/DipIcon';
import React, { ReactNode, useEffect, useState } from 'react';
import { getFileUploadEnable, getTempAreaConfigFromAgent, getTempAreaEnable } from '../../utils';
import { createDir, getDocInfoByName, getEntryDocLibs } from '@/apis/efast';
import { DocLibTypeEnum, getFileExtension, getLastDocId } from '@/utils/doc';
import { apis } from '@aishu-tech/components/dist/dip-components.min';
import _ from 'lodash';
import { TempFileTypeEnum } from '@/apis/intelli-search/type';
import { FileItem } from '../../interface';

export type FileUploadBtnProps = {
  agentConfig: any;
  tip?: string;
  disabled?: boolean;
  value?: FileItem[];
  onChange?: (value: FileItem[]) => void; // 所有上传文件的回调，包括之前已经上传的文件
  customBtn?: ReactNode;
  onNewUploadChange?: (value: FileItem[]) => Promise<boolean>; // 每次新上传的文件的回调， 不包括之前已经上传的文件
};
type DirType = { id: string; name: string };

const Unit = 1024;

enum UnitSizeEnum {
  b = 1,
  kb = Unit,
  mb = kb * Unit,
  gb = mb * Unit,
  tb = gb * Unit,
}

const FileUploadBtn = (props: FileUploadBtnProps) => {
  const { agentConfig, tip, disabled = false, value = [], onChange, customBtn, onNewUploadChange } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [tempUploadDir, setTempUploadDir] = useState<DirType>();
  const [hiddenFileBtn, setHiddenFileBtn] = useState(true);

  const validateConfig = getTempAreaConfigFromAgent(agentConfig);

  const {
    single_file_size_limit,
    single_file_size_limit_unit,
    allowed_file_types = [],
    max_file_count, // 临时区的最大文件数量限制
    single_chat_max_select_file_count, // 单次对话最大的文件数量限制
  } = validateConfig;

  // console.log(validateConfig, 'validateConfig');

  useEffect(() => {
    getUserTempUploadDir();
  }, []);

  const uploadTip = `支持上传文件（${getTempAreaEnable(agentConfig) ? `最多${max_file_count}个，` : ''}每个不超过${single_file_size_limit}${single_file_size_limit_unit}）接收${allowed_file_types.map((item: string) => item).join('、')}等`;

  /** 获取当前登录用户临时上传目录 */
  const getUserTempUploadDir = async () => {
    try {
      const res: any = await getEntryDocLibs(DocLibTypeEnum.UserDocLib);
      if (res) {
        const [userDocLib] = res;
        if (userDocLib) {
          setHiddenFileBtn(false);
          // console.log(userDocLib, '当前登录用户的临时上传目录');
          setTempUploadDir(userDocLib);
        }
      }
    } catch (error: any) {
      console.log(error, 'error');
      setHiddenFileBtn(true);
    }
  };

  const validateFiles = (files: any): { validFiles: any[]; failedFiles: any[] } => {
    // @ts-expect-error
    const limit = UnitSizeEnum[single_file_size_limit_unit?.toLowerCase()] * single_file_size_limit;
    const { sizeInvalidFiles, formatInvalidFiles, formatValidFiles } = _.reduce(
      files,
      (acc: any, item: any) => {
        if (item.size > limit) {
          return { ...acc, sizeInvalidFiles: [...acc.sizeInvalidFiles, item] };
        }
        const fileExtension = getFileExtension(item.name, false).toLowerCase();
        if (!allowed_file_types || allowed_file_types?.includes(fileExtension || '')) {
          return { ...acc, formatValidFiles: [...acc.formatValidFiles, item] };
        }
        return { ...acc, formatInvalidFiles: [...acc.formatInvalidFiles, item] };
      },
      { sizeInvalidFiles: [], formatInvalidFiles: [], formatValidFiles: [] }
    );
    const errorMsgs = {
      formatError: '无法添加，当前不支持上传此类型文件。',
      sizeError: `无法添加，当前文件超出${single_file_size_limit}${single_file_size_limit_unit}大小。`,
      countError: `无法添加，临时区支持选择的文件已超出${max_file_count}个上限。`,
      chatFilesCountError: `无法添加，支持选择的文件已超出${max_file_count}个上限。`,
    };
    let failedFiles: any = [
      ...sizeInvalidFiles.map((item: any) => ({
        name: item.name,
        errorDescription: errorMsgs.sizeError,
      })),
      ...formatInvalidFiles.map((item: any) => ({
        name: item.name,
        errorDescription: errorMsgs.formatError,
      })),
    ];

    let availableCount = 0;
    if (getTempAreaEnable(agentConfig)) {
      // 临时区有总数和单次对话最大数量限制
      availableCount = max_file_count - value.length;
    } else {
      availableCount = single_chat_max_select_file_count - value.length;
    }
    // if (formatValidFiles.length > availableCount) {
    if (availableCount > 0) {
      failedFiles = [
        ...failedFiles,
        ...formatValidFiles.slice(availableCount).map((item: any) => ({
          name: item.name,
          errorDescription: getTempAreaEnable(agentConfig) ? errorMsgs.countError : errorMsgs.chatFilesCountError,
        })),
      ];
      return {
        validFiles: formatValidFiles.slice(0, availableCount),
        failedFiles,
      };
    }
    return {
      validFiles: [],
      failedFiles: [
        ...failedFiles,
        ...formatValidFiles.map((item: any) => ({
          name: item.name,
          errorDescription: getTempAreaEnable(agentConfig) ? errorMsgs.countError : errorMsgs.chatFilesCountError,
        })),
      ],
    };
  };

  const handleChange = (newValue: FileItem[]) => {
    onChange?.(newValue);
  };

  const uploadFile = async () => {
    const TempDirName = '临时区文件夹';
    let tempDir: any;
    try {
      tempDir = await getDocInfoByName(`${tempUploadDir?.name}/${TempDirName}`);
    } catch (error: any) {
      if (error.code === 404002006) {
        try {
          tempDir = await createDir({
            name: TempDirName,
            docid: tempUploadDir!.id,
          });
        } catch (error) {
          console.log(error, 'uploadFile error');
          messageApi.error('操作失败，请重试');
        }
      } else {
        messageApi.error('操作失败，请重试');
      }
    }

    if (!tempDir) return;
    apis.uploadFn({
      dest: {
        docid: tempDir.docid,
      },
      isAutoRename: true,
      acceptFileTypes: allowed_file_types?.map((item: string) => `.${item}`),
      beforeUpload: (files: FileList) => {
        const { validFiles } = validateFiles(files);
        console.log(validFiles, '检验通过的文件');
        return {
          files: validFiles,
          isContinueUpload: true,
        };
      },
      afterUpload: async (res: any) => {
        const { success } = res;
        if (success?.length) {
          const checkedFiles = value.filter(item => item.checked);
          const availableCount = single_chat_max_select_file_count - checkedFiles.length;
          console.log(success, '上传文件的 afterUpload');
          const fileData: FileItem[] = success.map(({ file }: any, index: number) => ({
            id: getLastDocId(file.docid),
            type: TempFileTypeEnum.Doc,
            name: file.name,
            size: file.size,
            docid: file.docid,
            error: '',
            status: 'processing',
            checked: index < availableCount,
          }));
          console.log(fileData, '上传文件的 组合好的数据');
          console.log(value, '上传文件的 组合好的数据value');
          if (onNewUploadChange) {
            const res = await onNewUploadChange?.(fileData);
            if (res) {
              const newValue = [...value, ...fileData];
              handleChange(newValue);
            }
          } else {
            const newValue = [...value, ...fileData];
            handleChange(newValue);
          }
        } else {
          messageApi.error('临时区上传文件服务异常');
        }
      },
    });
  };

  const getBtnDisabled = () => {
    if (disabled) {
      return {
        disabled: true,
        tip: tip,
      };
    }
    if (getTempAreaEnable(agentConfig) && !agentConfig.debug) {
      return {
        disabled: value.length >= max_file_count,
        tip: `最多上传${max_file_count}个文件`,
      };
    }
    return {
      disabled: value.length >= single_chat_max_select_file_count,
      tip: `单次对话最多上传${single_chat_max_select_file_count}个文件`,
    };
  };

  const renderBtn = () => {
    if (!hiddenFileBtn) {
      const fileUploadEnabled = getFileUploadEnable(agentConfig);
      if (fileUploadEnabled || agentConfig.debug) {
        return (
          <div onClick={uploadFile}>
            <Tooltip title={getBtnDisabled().disabled ? getBtnDisabled().tip : uploadTip}>
              {customBtn || (
                <Button disabled={getBtnDisabled().disabled} icon={<DipIcon type="icon-dip-attachment" />} />
              )}
            </Tooltip>
          </div>
        );
      }
      const tempAreaEnabled = getTempAreaEnable(agentConfig);

      if (tempAreaEnabled) {
        return (
          <div onClick={uploadFile}>
            <Tooltip title={getBtnDisabled().disabled ? getBtnDisabled().tip : uploadTip}>
              {customBtn || (
                <Button
                  size="small"
                  type="text"
                  disabled={getBtnDisabled().disabled}
                  icon={<DipIcon type="icon-dip-upload" />}
                />
              )}
            </Tooltip>
          </div>
        );
      }
    }
    return <span />;
  };

  return (
    <>
      {contextHolder}
      {renderBtn()}
    </>
  );
};

export default FileUploadBtn;
