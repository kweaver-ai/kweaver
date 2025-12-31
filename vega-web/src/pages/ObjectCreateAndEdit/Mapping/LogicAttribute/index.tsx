import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SettingOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { deduplicateObjects } from '@/utils/object';
import OntologyObjectType from '@/services/object/type';
import { IconFont } from '@/web-library/common';
import EditDrawer from './EditDrawer';
import styles from './index.module.less';

interface IconfontSelectProps {
  basicValue: OntologyObjectType.BasicInfo;
  allData: OntologyObjectType.ViewField[];
  logicFields: OntologyObjectType.LogicProperty[];
  otherData: OntologyObjectType.ViewField[];
  saveLogicAttrData: (data: OntologyObjectType.LogicProperty[]) => void;
}

const LogicAttribute: React.FC<IconfontSelectProps> = ({ allData = [], logicFields = [], otherData = [], saveLogicAttrData, basicValue }) => {
  const [open, setOpen] = useState(false);
  const [attrInfo, setAttrInfo] = useState<OntologyObjectType.LogicProperty>({} as OntologyObjectType.LogicProperty);
  const [dataList, setDataList] = useState<OntologyObjectType.LogicProperty[]>([]);
  const [searchInput, setSearchInput] = useState('');

  const onClose = () => {
    setOpen(false);
  };

  const handleEdit = (record: OntologyObjectType.LogicProperty) => {
    setAttrInfo(record);
    setOpen(true);
  };

  const handleDelete = (record: OntologyObjectType.LogicProperty) => {
    if (!record.type || !record.name) {
      return;
    }
    if (['metric', 'operator'].includes(record.type)) {
      saveLogicAttrData?.(
        logicFields.map((item) => {
          if (item.name === record.name) {
            item.parameters = null;
            item.data_source = null;
          }
          return item;
        })
      );
    } else {
      saveLogicAttrData?.(logicFields.filter((item) => item.name !== record.name));
    }
  };

  useEffect(() => {
    setDataList([...logicFields, ...(otherData as any)]);
  }, [otherData, logicFields]);

  const handleEditOk = (data: OntologyObjectType.LogicProperty) => {
    const currentData = deduplicateObjects([...logicFields, data], 'name');
    saveLogicAttrData?.(currentData);
    setOpen(false);
  };

  return (
    <>
      {dataList?.length > 0 && (
        <div className={styles['data-attribute']}>
          <div className={styles['search-container']}>
            <Input
              className={styles['search-input']}
              placeholder={intl.get('Global.filterByNameOrId')}
              onChange={(value) => setSearchInput(value.target.value)}
              prefix={<IconFont type="icon-dip-search" style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.25)' }} />}
            />
            <div>
              <IconFont type="icon-dip-filter" style={{ fontSize: '16px' }} />
            </div>
          </div>
          <div className={styles['data-row']}>
            <div className={styles['data-col']}>
              <div className={styles['data-info']}>
                {basicValue?.icon && (
                  <div className={styles['data-icon']} style={{ backgroundColor: basicValue?.color }}>
                    <IconFont type={basicValue?.icon} style={{ fontSize: '16px', color: '#fff' }} />
                  </div>
                )}
                <span className={styles['data-title']}>{basicValue?.name || ''}</span>
                <span className={styles['data-count']}>{dataList?.length || 0}</span>
              </div>
            </div>
            <div className={styles['data-col']}>
              <span className={styles['data-title']}>{intl.get('Object.configurationItem')}</span>
            </div>
          </div>
          {dataList.map((item, index) => (
            <div className={styles['data-row']} key={index} style={{ display: item.name.includes(searchInput) ? 'flex' : 'none' }}>
              <div className={styles['data-col']}>
                <span className={styles['data-name']}>{item.name}</span>
                <span className={styles['data-tip']}>{item.type}</span>
              </div>
              {item.parameters && item.parameters?.length > 0 ? (
                <div className={styles['data-col']}>
                  <div className={styles['data-setting']}>
                    {item.data_source?.type === OntologyObjectType.LogicAttributeType.METRIC && (
                      <IconFont type="icon-dip-color-zhibiaometirc" style={{ fontSize: '24px' }} />
                    )}
                    {item.data_source?.type === OntologyObjectType.LogicAttributeType.OPERATOR && (
                      <IconFont type="icon-dip-color-suanzitool" style={{ fontSize: '24px' }} />
                    )}
                    <span className={styles['data-name']}>{item.data_source?.name || ''}</span>
                  </div>
                  <div className={styles['data-setting']}>
                    <IconFont type="icon-dip-bianji" onClick={() => handleEdit(item)} style={{ fontSize: '14px', cursor: 'pointer' }} />
                    <IconFont
                      type="icon-dip-trash"
                      onClick={() => handleDelete(item)}
                      style={{ fontSize: '14px', cursor: 'pointer', color: 'rgba(0, 0, 0, 0.4)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles['data-col']}>
                  <div className={styles['data-setting']} style={{ cursor: 'pointer' }} onClick={() => handleEdit(item)}>
                    <SettingOutlined style={{ fontSize: '14px' }} />
                    <span className={styles['data-name']}>{intl.get('Global.config')}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 编辑抽屉 */}
      <EditDrawer
        allData={allData}
        logicFields={logicFields}
        title={intl.get('Object.logicAttributeMapping')}
        open={open}
        onClose={onClose}
        onOk={handleEditOk}
        attrInfo={attrInfo}
      />
    </>
  );
};

export default LogicAttribute;
