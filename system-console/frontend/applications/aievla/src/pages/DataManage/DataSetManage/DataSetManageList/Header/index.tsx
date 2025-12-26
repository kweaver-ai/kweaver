import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';
import TextExpand from '@/pages/DataManage/components/TextExpand';
import HeaderBackground from '@/assets/images/dataSetHeaderBg.svg';

import './style.less';

export interface DataSetHeaderProps {
  className?: string;
  info: any;
}

const DataSetHeader = (props: DataSetHeaderProps) => {
  const { info } = props;

  const { name, color, description, create_user, create_time, update_user, update_time } = info;
  const desc_detail = intl.get('dataSet.config.desDetail', { create_user, create_time, update_user, update_time });

  return (
    <div className='dataSet-files-header ' style={{ background: `url(${HeaderBackground})` }}>
      <div className='align-start'>
        <div style={{ background: '#fff', marginRight: 12 }}>
          <IconFont type={color || 'icon-color-sjj-FADB14'} border style={{ width: 60, height: 60, fontSize: 26 }} />
        </div>
        <div className='ad-flex-item-full-width'>
          <div className='title ad-c-header' title={name}>
            <div style={{ maxWidth: 300 }} className='ad-ellipsis'>
              {name}
            </div>
          </div>
          <div className='desc ad-ellipsis ad-flex'>
            <div className='detail'>{desc_detail || intl.get('global.notDes')}</div>
          </div>

          <div className='description'>
            {!description ? (
              <div>{intl.get('global.notDes')}</div>
            ) : (
              <TextExpand
                content={description}
                maxLen={71}
                contentRender={(text: string, handler: any) => {
                  return (
                    <>
                      <span className='ad-mr-1'>{text}</span>
                      <span>{handler}</span>
                    </>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSetHeader;
