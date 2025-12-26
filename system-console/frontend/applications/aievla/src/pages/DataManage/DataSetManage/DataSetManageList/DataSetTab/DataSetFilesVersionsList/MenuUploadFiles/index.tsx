import { memo } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Dropdown, Upload, message } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import Format from '@/components/Format';

import { ONLY_VALID_NAME_LEN } from '@/pages/DataManage/enum';

import { dataSetFilesCreateDirs, dataSetFilesInitUploadPart } from '@/services/dataSet';

import './style.less';
import { getParam } from '@/utils/handleFunction';

export interface MenuUploadFilesProps {
  className?: string;
  onChangeFile: any;
  doc_id: any;
  version_id: any;
  dataSource: any;
  onSetShowUploadTip: any;
  ossStatus: any;
}
const showModalRef = { current: false };

// 检查文件原信息合法
const checkFilesMata = async (name: string, size: number) => {
  if (!ONLY_VALID_NAME_LEN.test(name)) {
    if (showModalRef.current) return;
    showModalRef.current = true;
    return false;
  }

  if (typeof size !== 'number') return false;

  if (size >= 5 * 1024 * 1024 * 1024) {
    if (showModalRef.current) return;
    showModalRef.current = true;
    return false;
  }

  return true;
};

const MenuUploadFiles = (props: MenuUploadFilesProps) => {
  const { ossStatus, onChangeFile, doc_id, version_id, dataSource, onSetShowUploadTip: setShowUploadTip } = props;

  // 文件上传处理
  const onChangeFiles = _.debounce(async (obj: any) => {
    const { fileList } = obj;
    let tip = false;

    try {
      let files: any = [];

      const validFilesList = _.filter(fileList, file => {
        return true;
      });
      if (fileList.length === 1) {
        validFilesList.length === 0 && message.warning(intl.get('dataSet.fileFormatErr'), 3);
      } else {
        if (validFilesList.length !== fileList.length) {
          if (validFilesList.length === 0) {
            message.warning(intl.get('dataSet.noVaildFiles'), 3);
            return;
          }
          message.warning(intl.get('dataSet.filesFormatErr'), 3);
        }
      }
      if (validFilesList.length === 0) return;

      for (let i = 0; i < validFilesList.length; i++) {
        const file = validFilesList[i];
        const { name, type, size } = file;

        const isVaild = await checkFilesMata(name, size);
        if (!isVaild) {
          showModalRef.current = true;
          // eslint-disable-next-line no-continue
          continue;
          // new Error('文件名不合法');
        }

        const getFileName: any = (dataList: any[], name: any) => {
          if (_.some(dataList, item => item.name === name)) {
            // const name_temp = name.split('.')[0] + '(1).' + name.split('.').pop();
            const name_temp = name.split('.').slice(0, -1).join('.') + '(1).' + name.split('.').pop();

            return getFileName(dataList, name_temp);
          }
          return name;
        };
        const upload_name = getFileName(dataSource, name);

        const file_suffix = name.split('.').pop();

        // eslint-disable-next-line no-continue
        // if (!VALID_FILES_TYPES.includes(file_suffix)) continue;

        if (upload_name !== name) {
          const isOk = await tipModalFunc({
            className: 'ad-know-modal-function sameNameFileTip',
            title: intl.get('dataSet.sameNameTip').split('\n')[0],
            content: (
              <div style={{ textOverflow: 'ellipsis', overflow: 'scroll' }}>
                {intl.get('dataSet.sameNameTip').split('\n')[1]}
                {upload_name}
              </div>
            ),
          });
          tip = true;
        }

        // await modal
        const postData = { name: upload_name, file_suffix, upload_type: 1, size, doc_id, version_id };
        const result = await dataSetFilesInitUploadPart(postData);
        files = [...files, { ...postData, file: file.originFileObj, osData: result }];
      }
      showModalRef.current = false;

      if (_.isEmpty(files)) return;

      onChangeFile({ fileData: { files } });
    } catch (err) {
      // console.log('err', err);
    }

    return false;
  });

  /**
   * @param file 文件夹上传处理
   * @param doc_id 当前路径
   * @returns
   */
  const onChangeDir = _.debounce(async (obj: any) => {
    const { file, fileList } = obj;

    const validFilesList = _.filter(fileList, file => {
      const file_suffix = file.name.split('.').pop();
      // return VALID_FILES_TYPES.includes(file_suffix);
      return true;
    });

    if (validFilesList.length !== fileList.length) {
      if (validFilesList.length === 0) {
        message.warning(intl.get('dataSet.noVaildFiles'), 3);
        return;
      }
      message.warning(intl.get('dataSet.filesFormatErr'), 3);
    }

    // 检查文件大小
    const totalSize = _.map(validFilesList, file => file.size).reduce((pre, cur) => pre + cur, 0);

    if (totalSize === 0) {
      message.warning(intl.get('dataSet.emptyDirTip'), 3);
      return;
    }

    if (totalSize >= 5 * 1024 * 1024 * 1024) {
      const isOk = await tipModalFunc({
        title: intl.get('dataSet.manage.prohibitUploadingTip').split('\n')[0],
        content: intl.get('dataSet.manage.prohibitUploadingTip').split('\n')[1],
      });
      return;
    }

    createDirectoriesAndUploadFiles(validFilesList);
  });

  const createDir = async (path: any, doc_id: any) => {
    const postCreateDir = {
      doc_id,
      version_id,
      name: path.split('/').slice(-2, -1)[0],
    };
    if (path.split('/').length === 2) {
      const getDirName: any = (dataList: any[], name: any) => {
        if (_.some(dataList, item => item.name === name)) {
          // const name_temp = name.split('.')[0] + '(1)';
          const name_temp = name + '(1)';

          return getDirName(dataList, name_temp);
        }
        return name;
      };
      const upload_dir_name = getDirName(dataSource, postCreateDir.name);

      if (upload_dir_name !== postCreateDir.name) {
        const isOk = await tipModalFunc({
          className: 'ad-know-modal-function sameNameFileTip',
          title: intl.get('dataSet.sameNameTip').split('\n')[0],
          content: (
            <div style={{ textOverflow: 'ellipsis', overflow: 'scroll' }}>
              {intl.get('dataSet.sameNameTip').split('\n')[2]}
              {upload_dir_name}
            </div>
          ),
        });
      }

      postCreateDir.name = upload_dir_name;
    }

    const { doc_id: new_doc_id } = await dataSetFilesCreateDirs(postCreateDir);
    return new_doc_id;
  };

  async function createDirectoriesAndUploadFiles(arr: any[]) {
    const createdDirs: { path: string; id: string; filesList: any[] }[] = [];
    let curId = doc_id;
    for (const fileObj of arr) {
      const { originFileObj } = fileObj;
      const pathParts = originFileObj.webkitRelativePath.split('/');
      const fileName = pathParts.pop();
      let currentPath = '';
      let dirId: any = null;

      for (const part of pathParts) {
        const tempPath = currentPath + part + '/';
        if (!createdDirs.some(item => item.path === tempPath)) {
          dirId = await createDir(tempPath, curId);
          createdDirs.push({ path: tempPath, id: dirId, filesList: [] });
          currentPath = tempPath;
          curId = dirId;
        } else {
          currentPath = tempPath;
          curId = _.filter(createdDirs, item => item.path === tempPath)[0].id;
          dirId = _.filter(createdDirs, item => item.path === tempPath)[0].id;
        }
      }

      const curfileObj = createdDirs.filter(item => item.id === dirId)[0] || {};

      curfileObj.filesList = [...(curfileObj?.filesList || []), originFileObj];
    }

    let files: any = [];

    for (let j = 0; j < createdDirs.length; j++) {
      const curFileList = createdDirs[j].filesList;
      // eslint-disable-next-line no-continue
      if (_.isEmpty(curFileList)) continue;

      for (let i = 0; i < curFileList.length; i++) {
        const file = curFileList[i];
        const { name, type, size } = file;
        const file_suffix = name.split('.').pop();

        const isVaild = await checkFilesMata(name, size);
        if (!isVaild) {
          showModalRef.current = true;
          // eslint-disable-next-line no-continue
          continue;
          // new Error('文件名不合法');
        }

        const postData = { name, file_suffix, upload_type: 1, size, doc_id: createdDirs[j].id, version_id };
        const result = await dataSetFilesInitUploadPart(postData);

        files = [...files, { ...postData, file, osData: result }];
      }
    }
    showModalRef.current = false;

    onChangeFile({ fileData: { files } });
  }

  return (
    <>
      {getParam('action') !== 'view' ? (
        <Dropdown
          overlayClassName='dataSet-upload'
          overlay={
            <div className='upload-buttons'>
              <div key={'file-button'} style={{ padding: 0 }} className='dataSet-upload-button ad-mt-1 ad-pointer'>
                <Upload
                  // accept={UPLOAD_FILES_TYPE}
                  className='uploadFile'
                  fileList={[]}
                  beforeUpload={() => false}
                  onChange={onChangeFiles}
                  multiple
                >
                  <IconFont type='icon-tongyongwenjianicon' className=' ad-ml-3 ad-mr-2' style={{ fontSize: 20 }} />
                  {intl.get('dataSet.manage.selectFile')}
                </Upload>
              </div>
              <div key={'dir-button'} style={{ padding: 0 }} className='dataSet-upload-button ad-mb-1 ad-pointer'>
                <Upload
                  // accept={UPLOAD_FILES_TYPE}
                  className='uploadDir'
                  fileList={[]}
                  beforeUpload={() => false}
                  onChange={onChangeDir}
                  directory
                >
                  <IconFont type='icon-putongwenjianjia' className='ad-ml-3 ad-mr-2' style={{ fontSize: 20 }} />
                  {intl.get('dataSet.manage.selectDir')}
                </Upload>
              </div>
            </div>
          }
          className='table-uploadMenu'
          trigger={['hover']}
          placement='bottomRight'
          disabled={!ossStatus}
        >
          <Format.Button
            type='primary'
            disabled={!ossStatus}
            className='add-down-btn'
            onClick={e => e.preventDefault()}
            style={!ossStatus ? { cursor: 'not-allowed' } : {}}
          >
            <IconFont type='icon-shangchuan' />
            {intl.get('dataSet.manage.upload')}
            <CaretDownOutlined />
          </Format.Button>
        </Dropdown>
      ) : null}
    </>
  );
};

export default memo(MenuUploadFiles);

export const MenuUploadFilesDom = (props: any) => {
  const { ossStatus, onChangeFile, doc_id, version_id, dataSource, showUploadTip, onSetShowUploadTip: setShowUploadTip } = props;

  // 文件上传处理
  const onChangeFiles = _.debounce(async (obj: any) => {
    const { fileList } = obj;
    let tip = false;

    try {
      let files: any = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const { name, type, size } = file;

        const isVaild = await checkFilesMata(name, size);
        if (!isVaild) {
          showModalRef.current = true;
          // eslint-disable-next-line no-continue
          continue;
          // new Error('文件名不合法');
        }

        const getFileName: any = (dataList: any[], name: any) => {
          if (_.some(dataList, item => item.name === name)) {
            const name_temp = name.split('.')[0] + '(1).' + name.split('.').pop();

            return getFileName(dataList, name_temp);
          }
          return name;
        };
        const upload_name = getFileName(dataSource, name);

        const file_suffix = name.split('.').pop();

        // eslint-disable-next-line no-continue
        // if (!VALID_FILES_TYPES.includes(file_suffix)) continue;

        if (upload_name !== name) {
          const isOk = await tipModalFunc({
            className: 'ad-know-modal-function sameNameFileTip',
            title: intl.get('dataSet.sameNameTip').split('\n')[0],
            content: (
              <div style={{ textOverflow: 'ellipsis', overflow: 'scroll' }}>
                {intl.get('dataSet.sameNameTip').split('\n')[1]}
                {upload_name}
              </div>
            ),
          });
          tip = true;
        }

        // await modal
        const postData = { name: upload_name, file_suffix, upload_type: 1, size, doc_id, version_id };
        const result = await dataSetFilesInitUploadPart(postData);
        files = [...files, { ...postData, file: file.originFileObj, osData: result }];
      }
      showModalRef.current = false;

      if (_.isEmpty(files)) return;

      onChangeFile({ fileData: { files } });
    } catch (err) {
      // console.log('err', err);
    }

    return false;
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {getParam('action') !== 'view' ? (
        <>
          {intl.get('dataSet.manage.createTip').split('|')[0]}
          <span>
            <Upload
              // accept={UPLOAD_FILES_TYPE}
              className='emptyUploadFiles'
              fileList={[]}
              beforeUpload={() => false}
              onChange={onChangeFiles}
              multiple
            >
              <span className='ad-c-primary ad-pointer'>{intl.get('dataSet.manage.createTip').split('|')[1]}</span>
            </Upload>
          </span>
          {intl.get('dataSet.manage.createTip').split('|')[2]}
        </>
      ) : (
        intl.get('global.noContent')
      )}
    </div>
  );
};
