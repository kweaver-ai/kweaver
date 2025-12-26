import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Tree, Divider, Select, Tooltip, Input, Switch, Badge } from 'antd';

import AdSpin from '@/components/AdSpin';
import Format from '@/components/Format';
import ErrorTip from '@/components/ErrorTip';
import IconFont from '@/components/IconFont';

import PromptTree from '../../CreateBenchmarkTask/AlgorithmSelector/LargeModel/PromptTree';
import CusInput from '../CusInput';
import { onUpdateTreeData } from './assistFunction';
import { ALG_TYPE_TWO, TYPE, TYPE_TO_ID, TYPE_TO_NAME, AGENT_STATUS, AGENT_STATUS_COLOR } from './enum';

import './style.less';

const Option = Select.Option;
// allListData 数据源
// algorithm_type 类型
// algChange 评估对象类型切换
const TreeLineSlider = (props: any, ref: any) => {
  const {
    treeData,
    onAddEvaluationObject,
    getListData,
    onChange,
    loading = false,
    operateChange,
    disabled,
    optionalList,
    allListData,
    onDelete,
    algorithm_type,
    onUpdateSelected,
    selectedValueArr,
    setSelectedValueArr,
    algChange,
    isSelectedEmpty,
  } = props;

  const [expandedKeys, setExpandedKeys] = useState<any[]>([]); // 展开的节点
  const [currentTreeData, setCurrentTreeData] = useState<any[]>([]);
  const isLargeModalExternal = _.includes([1, 4], algorithm_type);

  const addBtnIsShow = disabled || (selectedValueArr?.length && selectedValueArr?.length === allListData?.length) || isSelectedEmpty;
  const isAgentType = algorithm_type === 6;

  useImperativeHandle(ref, () => ({
    onClearSelectedValueArr: setSelectedValueArr([]),
  }));

  useEffect(() => {
    setCurrentTreeData(treeData);
    if (algorithm_type !== 4) onHandleSelectedValueArr(treeData);
  }, [JSON.stringify(treeData)]);

  useEffect(() => {
    const allExpandedKeys = _.map(_.cloneDeep(treeData), (item: any) => item.key);
    setExpandedKeys(allExpandedKeys);
  }, [treeData]);

  /**
   * Select框选择变化
   */
  const onValueChange = (value: any, e: any, key: any) => {
    onGeneralMethod(value, key, 'paTitle', e?.key);
  };

  /**
   * 开关变化
   */
  const onSwitchChange = (checked: boolean, key: any) => {
    onGeneralMethod(checked, key, 'switch');
  };

  /**
   * 子节点值变化(提示词、外部接入的URL)
   */
  const onChildChange = (value: any, key: any) => {
    onGeneralMethod(value, key, 'childTitle');
  };

  /**
   * 通用方法(更新数据)
   * @param value 选择框的值
   * @param key 选择框id
   * @param type 类型
   * @param newKey 选择下拉框数据的id
   */
  const onGeneralMethod = (value: any, key: any, type: string, newKey?: any) => {
    const findAgent = _.find(optionalList, (item: any) => item?.name === value);
    const updateTreeData = onUpdateTreeData(treeData, findAgent, algorithm_type, value, key, type, newKey);

    operateChange();
    onChange(updateTreeData);
    if (algorithm_type !== 4) {
      onHandleSelectedValueArr(updateTreeData);
      onUpdateSelected(updateTreeData);
    }
  };

  /**
   * 选择框内容---删除按钮
   */
  const onHandleSelectedValueArr = (updateTreeData: any) => {
    let filterData: any = [];
    let allFilterData: any = [];
    _.map(_.cloneDeep(updateTreeData), (item: any) => {
      if (item?.title) {
        if (!item?.noPermission) filterData = [...filterData, item.title];
        allFilterData = [...allFilterData, item.title];
      }
    });
    setSelectedValueArr(_.isEmpty(filterData) ? [] : [...new Set(filterData)]);

    // 此时后端返回列表无可选数据，若将已选择的数据又全部删除，则选择评估对象展示无数据提示
    if (isSelectedEmpty && _.isEmpty(allFilterData)) onDelete([]);
  };

  /**
   * 删除
   */
  const onDeleteEvaluationObject = (key: any) => {
    const filterTreeData = _.filter(_.cloneDeep(treeData), (tree: any) => key !== tree?.key);
    if (algorithm_type !== 4) {
      let evaluationNameArr: any = [];
      _.map(_.cloneDeep(filterTreeData), (item: any) => {
        if (item?.title) evaluationNameArr = [...evaluationNameArr, item?.title];
      });
      setSelectedValueArr([...new Set(evaluationNameArr)]);
    }
    onDelete(filterTreeData);
  };

  const titleRender = (node: any) => {
    const {
      key,
      title,
      is_run, // 开关
      error = false,
      childError = false,
      noPermission = '', // 不存在|无权限
      prompt_name = '', // 提示词名称(大模型)
      url = '', // (外部接入)
    } = node;

    return (
      <div title=''>
        {`${key}`?.split('*')?.[1] ? (
          <div className='ad-align-center ad-mt-4'>
            <Input
              className={classNames('ad-ml-2', { 'ad-mr-3': isLargeModalExternal })}
              style={{ width: isLargeModalExternal ? 273 : 558 }}
              value={title}
              disabled
            />
            {algorithm_type === 1 ? (
              <PromptTree
                disabled={disabled}
                childError={childError}
                node={node}
                prompt_name={prompt_name}
                onChildChange={(value: any) => onChildChange(value, key)}
              />
            ) : algorithm_type === 4 ? (
              <CusInput
                placeholder={intl.get('benchmarkTask.pleaseInutURL')}
                value={url}
                inputWidth={273}
                error={childError}
                disabled={disabled}
                setValue={(value: string) => onChildChange({ url: value }, key)}
              />
            ) : null}

            <Tooltip title={intl.get(`benchmarkTask.${is_run ? 'closeRun' : 'startRun'}`)} placement='top' arrowPointAtCenter={true}>
              <Switch size='small' className='ad-ml-3' checked={is_run} disabled={disabled} onChange={(checked: boolean) => onSwitchChange(checked, key)} />
            </Tooltip>
            {algorithm_type === 1 && noPermission ? (
              <Tooltip title={noPermission}>
                <IconFont type='icon-Warning' style={{ fontSize: 18 }} className='ad-c-error ad-ml-2' />
              </Tooltip>
            ) : null}
          </div>
        ) : (
          <div className='ad-align-center'>
            <ErrorTip errorText={error}>
              {algorithm_type === 4 ? (
                <CusInput
                  placeholder={intl.get('benchmarkTask.pleaseInutExternal')}
                  value={title}
                  error={error}
                  setValue={(value: string) => onValueChange(value, { key }, key)}
                  inputWidth={305}
                  disabled={disabled}
                />
              ) : (
                <Select
                  onClick={() => getListData()}
                  showSearch
                  disabled={disabled}
                  allowClear={true}
                  style={{ width: algorithm_type === 6 ? 560 : 305 }}
                  placeholder={intl.get('benchmarkTask.pleaseSelect', {
                    name: isAgentType ? title : TYPE[algorithm_type],
                  })}
                  value={title || undefined}
                  optionLabelProp={title}
                  onChange={(value, e) => onValueChange(value, e, key)}
                >
                  {loading ? (
                    <Option disabled={true} key='loading' style={{ height: '128px', background: '#fff' }}>
                      <div className='loading-mask ad-h-100 ad-center' style={{ flexFlow: 'column' }}>
                        <AdSpin />
                      </div>
                    </Option>
                  ) : (
                    _.map(optionalList, (item: any) => {
                      return (
                        <Select.Option
                          value={isAgentType ? item?.name : item?.[TYPE_TO_NAME[algorithm_type]]}
                          key={isAgentType ? item?.name : item?.[TYPE_TO_ID[algorithm_type]]}
                        >
                          <div className='ad-align-center ad-space-between' title={isAgentType ? item.name : item?.[TYPE_TO_NAME[algorithm_type]]}>
                            <div className='ad-ellipsis text-content' style={{ maxWidth: isAgentType ? 395 : 305 }}>
                              <div className={classNames('ad-ellipsis', { displayBlock: isAgentType })}>
                                {isAgentType ? item?.name?.split('(')?.[0] : item?.[TYPE_TO_NAME[algorithm_type]]}
                              </div>
                              {isAgentType ? (
                                <div className='displayNone ad-ellipsis' style={{ display: 'none' }}>
                                  {item?.name}
                                </div>
                              ) : null}
                            </div>
                            {isAgentType ? (
                              <div className='ad-ml-1 ad-flex select-badge-box'>
                                <span className='ad-c-watermark'>（</span>
                                <Badge
                                  text={AGENT_STATUS[item?.__showStatus]}
                                  status={AGENT_STATUS_COLOR[item?.__showStatus] as any}
                                  className='ad-ml-1 ad-mr-1'
                                  style={{
                                    maxWidth: 120,
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                  }}
                                />
                                <span className='ad-c-watermark'>）</span>
                              </div>
                            ) : null}
                          </div>
                        </Select.Option>
                      );
                    })
                  )}
                </Select>
              )}
            </ErrorTip>

            {disabled ? null : (
              <Format.Button type='icon' onClick={() => onDeleteEvaluationObject(key)}>
                <Tooltip title={intl.get('benchmarkTask.delEvaObjType')} placement='top' arrowPointAtCenter={true}>
                  <IconFont type='icon-lajitong' className='ad-c-text-lower ad-pointer ad-ml-1' />
                </Tooltip>
              </Format.Button>
            )}
            {noPermission && !disabled ? (
              <Tooltip title={noPermission}>
                <IconFont type='icon-Warning' style={{ fontSize: 18 }} className='ad-c-error' />
              </Tooltip>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={classNames('treeLineSliderRoot')}>
      {_.isEmpty(allListData) && algorithm_type !== 4 && !algChange && !treeData ? (
        <div className='algType-tip ad-align-center ad-align-start'>
          <div>
            <IconFont className='ad-mr-2' type='icon-Warning' style={{ color: '#efaf41', fontSize: 16 }} />
          </div>
          <div>
            {intl.get('benchmarkTask.emptyTip', {
              type: ALG_TYPE_TWO[algorithm_type]?.split('|')[0],
              path: ALG_TYPE_TWO[algorithm_type]?.split('|')[1],
            })}
          </div>
        </div>
      ) : (
        !algChange && (
          <>
            {_.map(currentTreeData, (item: any, index) => (
              <Tree
                key={index}
                className='ad-mb-5'
                showLine
                treeData={[{ ...item }]}
                titleRender={titleRender}
                expandedKeys={expandedKeys}
                defaultExpandAll={true}
                switcherIcon={false}
              />
            ))}

            {addBtnIsShow ? null : (
              <>
                <Divider />
                <span className='ad-pointer ad-c-primary' onClick={() => onAddEvaluationObject()}>
                  <IconFont type='icon-Add' className='ad-mr-2' />
                  <span>{intl.get('benchmarkTask.addEvaObjType')}</span>
                </span>
              </>
            )}
          </>
        )
      )}
    </div>
  );
};

export default forwardRef(TreeLineSlider);
