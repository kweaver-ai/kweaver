import { useCallback, useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { QuestionCircleFilled } from '@ant-design/icons';
import { Button, InputNumber, Popover, Select, Switch, Tooltip } from 'antd';
import { useImmer } from 'use-immer';
import OntologyObjectType from '@/services/object/type';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Drawer } from '@/web-library/common';
import styles from './index.module.less';

interface Props {
  open: boolean;
  values: {
    names: string[];
    index_config: OntologyObjectType.IndexConfig;
  };
  onClose: () => void;
  onOK: (values: OntologyObjectType.IndexConfig) => void;
}

const IndexSetting: React.FC<Props> = ({ open, values, onClose, onOK }) => {
  const [smallModeList, setSmallModeList] = useState<any[]>([]);
  // 使用全局 Hook 获取国际化常量
  const { TOKENIZER_OPTIONS } = HOOKS.useConstants();

  const [indexConfig, setIndexConfig] = useImmer<OntologyObjectType.IndexConfig>({
    keyword_config: {
      enabled: false,
      ignore_above_len: 1024,
    },
    fulltext_config: {
      enabled: false,
      analyzer: '',
    },
    vector_config: {
      enabled: false,
      model_id: '',
    },
  });

  const [errorInfo, setErrorInfo] = useImmer<{
    vector_config: string;
    keyword_config: string;
    fulltext_config: string;
  }>({
    vector_config: '',
    keyword_config: '',
    fulltext_config: '',
  });

  const modelInfo = useMemo(() => {
    return smallModeList.find((item) => item.value === indexConfig.vector_config.model_id);
  }, [smallModeList, indexConfig.vector_config.model_id]);

  useEffect(() => {
    if (!values?.index_config) {
      return;
    }

    const {
      keyword_config = { enabled: false, ignore_above_len: 1024 },
      fulltext_config = { enabled: false, analyzer: '' },
      vector_config = { enabled: false, model_id: '' },
    } = values.index_config;

    setIndexConfig((draft) => {
      draft.keyword_config = keyword_config;
      draft.fulltext_config = fulltext_config;
      draft.vector_config = vector_config;
    });
  }, [values]);

  useEffect(() => {
    if (open) {
      SERVICE.object
        .getSmallModelList({
          page: 1,
          size: 9999,
        })
        .then((res) => {
          setSmallModeList(
            res?.data?.map((item) => ({
              ...item,
              label: item.model_name,
              value: item.model_id,
            })) || []
          );
        });
    } else {
      setSmallModeList([]);
      setIndexConfig({
        keyword_config: {
          enabled: false,
          ignore_above_len: 1024,
        },
        fulltext_config: {
          enabled: false,
          analyzer: '',
        },
        vector_config: {
          enabled: false,
          model_id: '',
        },
      });
      setErrorInfo({
        vector_config: '',
        keyword_config: '',
        fulltext_config: '',
      });
    }
  }, [open]);

  const validateParams = () => {
    let canSubmit = true;
    if (indexConfig?.keyword_config?.enabled && !indexConfig.keyword_config.ignore_above_len) {
      setErrorInfo((draft) => {
        draft.keyword_config = intl.get('Global.notNull');
      });
      canSubmit = false;
    }
    if (indexConfig?.fulltext_config?.enabled && !indexConfig.fulltext_config.analyzer) {
      setErrorInfo((draft) => {
        draft.fulltext_config = intl.get('Global.notNull');
      });
      canSubmit = false;
    }
    if (indexConfig?.vector_config?.enabled && !indexConfig.vector_config.model_id) {
      setErrorInfo((draft) => {
        draft.vector_config = intl.get('Global.notNull');
      });
      canSubmit = false;
    }
    return canSubmit;
  };

  const handleSubmit = () => {
    if (!validateParams()) {
      return;
    }
    onOK(indexConfig);
  };

  const footer = (
    <div className={styles.footer}>
      <Button type="primary" onClick={handleSubmit}>
        {intl.get('Global.ok')}
      </Button>
      <Button onClick={onClose}>{intl.get('Global.cancel')}</Button>
    </div>
  );

  const SelectComponent = useCallback(
    (props: any) =>
      props?.error ? (
        <Popover content={intl.get('Global.notNull')} placement="bottomLeft">
          <Select style={{ width: '100%' }} placeholder={intl.get('Global.pleaseSelect')} {...props} status="error" />
        </Popover>
      ) : (
        <Select style={{ width: '100%' }} placeholder={intl.get('Global.pleaseSelect')} {...props} />
      ),
    []
  );

  const InputComponent = useCallback(
    (props: any) =>
      props?.error ? (
        <Popover content={props.error} placement="bottomLeft">
          <InputNumber style={{ width: '100%' }} placeholder={intl.get('Global.placeholder')} {...props} status={'error'} />
        </Popover>
      ) : (
        <InputNumber style={{ width: '100%' }} placeholder={intl.get('Global.placeholder')} {...props} autoFocus />
      ),
    []
  );

  return (
    <Drawer title={intl.get('Object.indexConfiguration')} width={420} open={open} onClose={onClose} footer={footer} className={styles.drawerBox}>
      <div>
        <div className={styles.selectedBox}>
          <div>{intl.get('Global.selectedAttribute')}</div>
          <div>{values?.names?.[0]}</div>
        </div>

        <div className={styles.subTitleBox}>
          <div className={styles.subTitle}>{intl.get('Global.keywordIndex')}</div>
          <Switch
            size="small"
            value={indexConfig?.keyword_config?.enabled}
            onChange={(value) => {
              setIndexConfig((draft) => {
                draft.keyword_config.enabled = value;
                draft.keyword_config.ignore_above_len = 1024;
              });
              setErrorInfo((draft) => {
                draft.keyword_config = '';
              });
            }}
          />
        </div>
        {indexConfig?.keyword_config?.enabled && (
          <div className={styles.settingItem}>
            <div className={styles.settingItemTitle}>
              <span style={{ color: 'rgba(255, 0, 0, 0.85)', marginRight: 2 }}>*</span>
              <span>{intl.get('Global.indexFieldLength')}</span>
              <Tooltip title={intl.get('Global.indexFieldLengthTip')}>
                <QuestionCircleFilled className={styles.questionIcon} />
              </Tooltip>
            </div>
            <InputComponent
              error={errorInfo.keyword_config}
              value={indexConfig?.keyword_config?.ignore_above_len || undefined}
              onChange={(value: any) => {
                setIndexConfig((draft) => {
                  draft.keyword_config.ignore_above_len = value;
                });
                setErrorInfo((draft) => {
                  draft.keyword_config = '';
                });
              }}
              min={1}
            />
          </div>
        )}
        <div className={styles.subTitleBox}>
          <div className={styles.subTitle}>
            <span>{intl.get('Global.fulltextIndex')}</span>
          </div>
          <Switch
            size="small"
            value={indexConfig?.fulltext_config?.enabled}
            onChange={(value) => {
              setIndexConfig((draft) => {
                draft.fulltext_config.enabled = value;
                draft.fulltext_config.analyzer = 'standard';
              });
            }}
          />
        </div>
        {indexConfig?.fulltext_config?.enabled && (
          <div className={styles.settingItem}>
            <div className={styles.settingItemTitle}>
              <span style={{ color: 'rgba(255, 0, 0, 0.85)', marginRight: 2 }}>*</span>
              <span>{intl.get('Global.tokenizer')}</span>
            </div>
            <SelectComponent
              error={errorInfo.fulltext_config}
              value={indexConfig?.fulltext_config?.analyzer || undefined}
              options={TOKENIZER_OPTIONS}
              onChange={(value: any) => {
                setIndexConfig((draft) => {
                  draft.fulltext_config.analyzer = value;
                });
                setErrorInfo((draft) => {
                  draft.fulltext_config = '';
                });
              }}
            />
          </div>
        )}
        <div className={styles.subTitleBox}>
          <div className={styles.subTitle}>
            <span>{intl.get('Global.vectorIndex')}</span>
          </div>
          <Switch
            size="small"
            value={indexConfig?.vector_config?.enabled}
            onChange={(value) =>
              setIndexConfig((draft) => {
                draft.vector_config.enabled = value;
                draft.vector_config.model_id = smallModeList?.[0]?.value || '';
              })
            }
          />
        </div>
        {indexConfig?.vector_config?.enabled && (
          <div className={styles.settingItem}>
            <div className={styles.settingItemTitle}>
              <span style={{ color: 'rgba(255, 0, 0, 0.85)', marginRight: 2 }}>*</span>
              <span>{intl.get('Global.smallModel')}</span>
            </div>
            <SelectComponent
              error={errorInfo.vector_config}
              name="vector_config"
              value={indexConfig?.vector_config?.model_id || undefined}
              options={smallModeList}
              onChange={(value: any) => {
                setIndexConfig((draft) => {
                  draft.vector_config.model_id = value;
                });
                setErrorInfo((draft) => {
                  draft.vector_config = '';
                });
              }}
            />
            {modelInfo && (
              <div className={styles.tipInfoBox}>
                <div className={styles.tipItem}>
                  <span>{intl.get('Global.vectorDimension')}</span>
                  <span>{modelInfo?.embedding_dim}</span>
                </div>
                <div className={styles.tipItem}>
                  <span>{intl.get('Global.batchProcessingSize')}</span>
                  <span>{modelInfo?.batch_size}</span>
                </div>
                <div className={styles.tipItem}>
                  <span>{intl.get('Global.maxTokensCount')}</span>
                  <span>{modelInfo?.max_tokens}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default IndexSetting;
