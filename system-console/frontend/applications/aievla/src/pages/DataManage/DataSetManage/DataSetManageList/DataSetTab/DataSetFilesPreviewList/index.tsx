import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Button, ConfigProvider, Form, Modal } from 'antd';

import useResize from '@/hooks/useSize';
import WangEditor from '@/components/WangEditor';
import SideBar from '@/components/SideBar';
import Format from '@/components/Format';
import { tipModalFunc } from '@/components/TipModal';
import IconFont from '@/components/IconFont';

import { getParam, getTextByHtml } from '@/utils/handleFunction';
import HOOKS from '@/hooks';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';

import { dataSetGetById, dataSetFilesList, versionsInfo, updateVersionsInfo } from '@/services/dataSet';

import './style.less';

export const dataSetVersionInitData = {
  description: '',
};

export interface DataSetFilesPreviewListProps {
  className?: string;
  filesVersionsListStatus: any;
  selectedTab: string;
  setFilesVersionsListStatus: any;
  isChange: any;
  setIsChange: any;
  setShowCreateModal: any;
}

const DataSetFilesDescContent = forwardRef((props: DataSetFilesPreviewListProps, ref) => {
  const { selectedTab, filesVersionsListStatus, setFilesVersionsListStatus, isChange, setIsChange, setShowCreateModal } = props;
  const previewRef = useRef<any>(null);
  const { height: previewHeight } = useResize(previewRef.current);

  const [selectBar, setSelectBar] = useState('V1.0');
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const eitorRef = useRef<any>(null);
  const [disableEditor, setDisableEditor] = useState(false);
  const [form] = Form.useForm();
  const [preFormData, setPreFormData] = useState(dataSetVersionInitData); // 描述的先前值
  const ds_id = getParam('_dataSet');
  const action = getParam('action');
  const isView = getParam('action') === 'view';
  const language = HOOKS.useLanguage();
  const isAddVersion = useRef(false);

  useImperativeHandle(ref, () => ({
    resetCurDes,
    saveCurDes,
  }));

  const resetCurDes = () => {
    setDisableEditor(false);
    form.setFieldsValue(preFormData);
    setTimeout(() => {
      setDisableEditor(true);
      const { editor } = eitorRef?.current || {};
      editor?.blur();
      editor?.disable();
    }, 100);
  };

  const saveCurDes = () => {
    setDisableEditor(false);
    handleOk();
    setTimeout(() => {
      setDisableEditor(true);
      const { editor } = eitorRef?.current || {};
      editor?.blur();
      editor?.disable();
    }, 100);
  };

  useDeepCompareEffect(() => {
    // 获取版本信息
    getDataSetVersions();
    handleUpdateVersions(selectBar);
  }, [ds_id, selectBar, filesVersionsListStatus.versionsList]);

  useDeepCompareEffect(() => {
    const description = _.filter(versionsList, item => item.key === selectBar)[0]?.description;

    // setDisableEditor(false);
    form.setFieldsValue({ description });
    setPreFormData({ description });

    if (!isAddVersion.current) {
      setTimeout(() => {
        setDisableEditor(true);
        const { editor } = eitorRef?.current;
        editor?.blur();
        editor?.disable();
      }, 100);
    } else {
      setTimeout(() => {
        setDisableEditor(false);
        const { editor } = eitorRef?.current;
        editor?.focus();
        editor?.enable();
        // isAddVersion.current = false;
      }, 100);
    }
  }, [selectBar, versionsList]);

  useEffect(() => {
    if (_.isEmpty(versionsList)) return;
    setSelectBar(versionsList[0].label);
  }, []);

  /**
   * 获取数据集版本及描述
   */
  const getDataSetVersions = async () => {
    const res = await versionsInfo(ds_id);
    if (res) {
      const items = _.map(res, item => {
        return { ...item, key: item.version, label: item.version };
      });
      setVersionsList(items);
    }
  };

  useEffect(() => {
    getFilesVersionsList();
  }, []);

  useEffect(() => {
    getFilesVersionsList();
    setSelectBar(filesVersionsListStatus.curVersion);
  }, [filesVersionsListStatus.curVersion]);

  /**
   * 更新表格数据-获取当前路径下的数据
   * @returns
   */
  const getFilesVersionsList = async () => {
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      loading: false,
    }));

    try {
      const { description, versions } = await dataSetGetById(filesVersionsListStatus.root_id);
      const version_keys = _.map(
        _.map(Object.keys(versions), key => parseFloat(key.slice(1))).sort((a: any, b: any) => a - b),
        number => 'V' + number.toFixed(1),
      );
      const versionId = versions[filesVersionsListStatus.curVersion];

      const versionsList_temp = _.map(version_keys, key => {
        return {
          value: versions[key],
          label: key,
        };
      });

      if (!versionId) return;
      const payload = {
        doc_id: filesVersionsListStatus.curPathKey,
        version_id: versionId,
        order: filesVersionsListStatus.order,
        rule: filesVersionsListStatus.rule,
      };
      const { dirs, files } = await dataSetFilesList(payload);
      const dir_temp = _.map(dirs, dir => {
        return { ...dir, type: 'dir', id: dir.doc_id, key: dir.doc_id };
      });

      const file_temp = _.map(files, file => {
        return { ...file, type: 'file', id: file.doc_id, key: file.doc_id };
      });

      const data_temp = [...dir_temp, ...file_temp];

      // 虚拟列表优化
      setFilesVersionsListStatus((preState: any) => ({
        ...preState,
        dataSource: [...data_temp],
        loading: false,
        version_id: versionId,
        versionsList: versionsList_temp,
        description,
      }));
    } catch (err) {
      // console.log('err', err);
    }
  };

  /**
   * 切换当前数据集版本
   * @param version 版本
   */
  const handleUpdateVersions = async (version: any) => {
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      curVersion: version,
      curPathKey: getParam('_dataSet'),
      breadCrumbData: preState.breadCrumbData.slice(0, 1),
    }));
  };

  useEffect(() => {
    setDisableEditor(true);
  }, [action]);

  useEffect(() => {
    setTimeout(() => {
      if (!eitorRef?.current) return;
      const { editor } = eitorRef?.current;
      editor?.blur();
      editor.disable();
    }, 100);
  }, []);

  /**
   * 更新当前版本的描述信息
   */
  const updateVersionDes = async () => {
    const version_id = _.filter(versionsList, item => item.key === selectBar)[0]?.version_id;
    form.validateFields().then(async formValues => {
      const body: any = {
        ...formValues,
        description: getTextByHtml(formValues.description) ? formValues.description : '', // 去除空的富文本
      };
      const res = await updateVersionsInfo(ds_id, version_id, body);
      if (res) {
        // getDataSetVersions();
        setPreFormData({ description: body.description });
        setDisableEditor(true);
        const { editor } = eitorRef?.current;
        editor?.blur();
        editor?.disable();
        setTimeout(() => {
          setIsChange(false);
        }, 0);
      }
    });
  };

  useEffect(() => {
    setDisableEditor(true);
  }, [selectedTab]);

  const handleCancel = () => {
    form.setFieldsValue(preFormData);
    setDisableEditor(true);
    const { editor } = eitorRef?.current;
    editor?.blur();
    editor?.disable();
  };

  const handleOk = () => {
    updateVersionDes();
    setIsChange(false);
  };

  const handleClick = () => {
    if (disableEditor) {
      setDisableEditor(false);
      setTimeout(() => {
        const { editor } = eitorRef?.current;
        editor?.focus('end');
        editor?.enable();
      }, 0);
    }
  };

  const onFormChange = (value: any) => {
    const { description = preFormData.description } = value;

    if (!preFormData.description) return;
    const curDes = description.replace(/[\n\t\r\"]/g, '');
    const preDes = preFormData.description.replace(/[\n\t\r\"]/g, '');

    if (getTextByHtml(curDes) !== getTextByHtml(preDes)) {
      setIsChange(true);
      return;
    }
    setIsChange(false);
  };

  const onSelectedKeysChange = async (obj: any) => {
    if (isChange) {
      const isOk = await tipModalFunc({
        wrapClassName: 'dataSet-des',
        title: intl.get('dataSet.config.changeVersionTip').split('\n')[0],
        content: <div className={language === 'en-US' ? 'dataSet-edit-config' : ''}>{intl.get('dataSet.config.changeVersionTip').split('\n')[1]}</div>,
        okText: intl.get('dataSet.config.saveChange'),
        cancelText: (
          <Button
            className='abandon-des'
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              handleCancel();
              setSelectBar(obj.key);
              Modal.destroyAll();
            }}
          >
            {intl.get('dataSet.config.abandonSave')}
          </Button>
        ),
        closable: true,
      });
      if (!isOk) {
        // handleCancel();
        // setSelectBar(obj.key);
      } else {
        handleOk();
        setTimeout(() => {
          setSelectBar(obj.key);
        }, 10);
      }
      return;
    }
    setSelectBar(obj.key);
    isAddVersion.current = false;
  };

  return (
    <div className='dataSet-files-preview ad-w-100 ad-h-100' ref={previewRef}>
      <div className='dataSet-content-preview ad-w-100 ad-h-100' style={{ display: 'flex' }}>
        <div style={{ borderRight: '1px solid #e0e0e0' }}>
          <SideBar
            className='side-bar'
            collapseBtnVisible={false}
            items={versionsList}
            selectedKeys={[selectBar]}
            extraFooter={
              !isView ? (
                <div
                  key={'add_version'}
                  style={{
                    height: 42,
                    width: 135,
                    padding: '2px 0',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'start',
                  }}
                  onClick={(e: any) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateModal(true);
                    isAddVersion.current = true;
                  }}
                  className='ad-pointer'
                >
                  <div className='version-item'>
                    <IconFont type='icon-Add' border style={{ fontSize: 14, marginRight: 5 }} className='ad-ml-3' />
                    {intl.get('dataSet.manage.createVersionTip').split('\n')[0]}
                  </div>
                </div>
              ) : null
            }
            onSelectedKeysChange={onSelectedKeysChange}
          />
        </div>
        {/* 数据集版本描述 */}
        <div className='preview-content'>
          {/* 标题和编辑按钮 */}
          <div style={{ height: 56, minHeight: 56, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 24, color: 'rgba(0,0,0,0.85)' }}>{intl.get('dataSet.vertitleDes', { version: selectBar })}</div>
            {!isView && (
              <Format.Button style={{ display: disableEditor ? 'block' : 'none', color: ' #237ce8', border: '1px solid #237ce8' }} onClick={handleClick}>
                {intl.get('dataSet.edit')}
              </Format.Button>
            )}
          </div>
          {/* 编辑器 */}
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Form
                form={form}
                layout='vertical'
                autoComplete='off'
                aria-autocomplete='none'
                initialValues={{ ...dataSetVersionInitData }}
                onValuesChange={onFormChange}
                className='version-editor'
              >
                <Form.Item
                  name='description'
                  className='ad-mb-0'
                  validateFirst
                  rules={[
                    {
                      validator: async (_, value) => {
                        const text = getTextByHtml(value);
                        if (!text) return;
                        if (text.length > 5000) {
                          throw new Error(intl.get('global.lenErr', { len: 5000 }));
                        }
                      },
                    },
                  ]}
                >
                  <WangEditor
                    language={language}
                    placeholder={intl.get('dataSet.writeVersionDesc')}
                    ref={eitorRef}
                    className={disableEditor ? 'preview' : 'normal'}
                    minHeight={300}
                    height={!disableEditor ? previewHeight - 56 - 20 - 80 - 32 : previewHeight - 56}
                  />
                </Form.Item>
              </Form>
            </div>
          </div>
          {/* 底部按钮 */}
          <div className='footer-box ad-pt-6' style={{ display: !disableEditor ? 'block' : 'none' }}>
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Format.Button className='foot-btn ad-mr-3' type='primary' onClick={handleOk}>
                {intl.get('global.save')}
              </Format.Button>
              <Format.Button className='foot-btn' type='default' onClick={handleCancel}>
                {intl.get('global.cancel')}
              </Format.Button>
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DataSetFilesDescContent;
