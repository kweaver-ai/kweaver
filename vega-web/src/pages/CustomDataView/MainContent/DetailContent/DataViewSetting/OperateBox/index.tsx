import { useState } from 'react';
import intl from 'react-intl-universal';
import { Radio, RadioChangeEvent } from 'antd';
import { DataViewQueryType } from '@/components/CustomDataViewSource';
import { DataViewOperateType } from '@/pages/CustomDataView/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';
import { useDataViewContext } from '../../context';

const OperateBox: React.FC<{ onOperate: (type: DataViewOperateType) => void }> = ({ onOperate }) => {
  const { dataViewTotalInfo } = useDataViewContext();
  const [type, setType] = useState('base');
  const [showList, setShowList] = useState(false);

  const handleTypeChange = (e: RadioChangeEvent) => {
    setType(e.target.value);
  };

  const handleOperate = (type: DataViewOperateType) => {
    onOperate(type);
    setShowList(false);
  };

  return (
    <div className={styles['operate-box']}>
      <div className={styles['btn-list']}>
        <IconFont type="icon-dip-color-tianjiajiedian" className={styles['btn-item']} onClick={() => setShowList(true)} />
        <IconFont type="icon-dip-youhuabuju" className={styles['btn-item']} onClick={() => handleOperate(DataViewOperateType.FORMAT)} />
        <div className={styles['btn-line']}></div>
        <IconFont type="icon-dip-jian1" className={styles['btn-item']} onClick={() => handleOperate(DataViewOperateType.ZOOM_OUT)} />
        <IconFont type="icon-dip-jia" className={styles['btn-item']} onClick={() => handleOperate(DataViewOperateType.ZOOM_IN)} />
      </div>

      {showList && (
        <div className={styles['type-box']}>
          <div className={styles['type-box-header']}>
            <Radio.Group value={type} size="small" onChange={handleTypeChange}>
              <Radio.Button value="base">{intl.get('CustomDataView.OperateBox.basicFunction')}</Radio.Button>
              {/* <Radio.Button value="analysis">{intl.get('CustomDataView.OperateBox.readParse')}</Radio.Button> */}
            </Radio.Group>
            <IconFont onClick={() => setShowList(false)} type="icon-dip-a-shouqi2" className={styles['btn-item']} style={{ fontSize: '12px' }} />
          </div>
          <div className={styles['list-box']}>
            <div className={styles['list-title']}>{intl.get('CustomDataView.OperateBox.input')}</div>
            <div
              className={styles['list-item']}
              onClick={() => {
                handleOperate(DataViewOperateType.ADD);
              }}
            >
              <IconFont type="icon-dip-color-shitusuanzi" className={styles['opreate-item']} />
              <span>{intl.get('CustomDataView.OperateBox.viewReference')}</span>
            </div>
            <div className={styles['list-title']}>{intl.get('CustomDataView.OperateBox.multiViewProcess')}</div>
            <div
              className={styles['list-item']}
              onClick={() => {
                handleOperate(DataViewOperateType.MERGE);
              }}
            >
              <IconFont type="icon-dip-color-shujuhebingsuanzi" className={styles['opreate-item']} />
              <span>{intl.get('CustomDataView.OperateBox.dataMerge')}</span>
            </div>
            {dataViewTotalInfo?.query_type === DataViewQueryType.SQL && (
              <>
                <div
                  className={styles['list-item']}
                  onClick={() => {
                    handleOperate(DataViewOperateType.RELATION);
                  }}
                >
                  <IconFont type="icon-dip-color-shujuguanliansuanzi" className={styles['opreate-item']} />
                  <span>{intl.get('CustomDataView.OperateBox.dataRelation')}</span>
                </div>
                <div
                  className={styles['list-item']}
                  onClick={() => {
                    handleOperate(DataViewOperateType.SQL);
                  }}
                >
                  <IconFont type="icon-dip-color-SQLsuanzi" className={styles['opreate-item']} />
                  <span>SQL</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperateBox;
