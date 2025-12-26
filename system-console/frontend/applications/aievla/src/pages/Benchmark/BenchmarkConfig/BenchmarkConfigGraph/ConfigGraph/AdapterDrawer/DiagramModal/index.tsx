import intl from 'react-intl-universal';

import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';

import './style.less';

const DiagramModal = ({ closeModal }: any) => {
  const prefixLocale = 'benchmark.config';
  return (
    <UniversalModal title={intl.get(`${prefixLocale}.diagram`)} open className='DiagramModal' onCancel={closeModal}>
      <div>
        <div className='DiagramModal-title'>{intl.get(`${prefixLocale}.Illustration`)}</div>
        <div className='ad-content-center ad-mt-2'>
          <div className='ad-flex'>
            <span className='ad-column-center'>
              <IconFont style={{ width: 36, height: 36 }} border type='icon-color-sjj-126EE3' />
              <span className='ad-mt-1'>{intl.get(`${prefixLocale}.IllustrationStart`)}</span>
            </span>
            <div className='DiagramModal-arrow'>{intl.get(`${prefixLocale}.IllustrationMiddle`)}</div>
            <span className='ad-column-center'>
              <IconFont border type='icon-color-zbk-13C2C2' />
              <span className='ad-mt-1'>{intl.get(`${prefixLocale}.IllustrationEnd`)}</span>
            </span>
          </div>
        </div>
      </div>
      <div className='ad-mt-6'>
        <div className='DiagramModal-title'>{intl.get(`${prefixLocale}.explanation`)}</div>
        <div className='ad-mt-2'>{intl.get(`${prefixLocale}.desc`)}</div>
      </div>
      <div className='ad-mt-6'>
        <div className='DiagramModal-title'>{intl.get(`${prefixLocale}.example`)}</div>
        <div className='ad-mt-2'>
          <div className='ad-mb-2'>{intl.get(`${prefixLocale}.exampleTitle`)}</div>
          <ADTable
            showHeader={false}
            rowKey='column1'
            dataSource={[
              { column1: '查找关于欧洲杯足球比赛的各队伍', column2: '欧洲杯足球赛共有24支队伍参加。' },
              { column1: '2024年奥运会的举办城市', column2: '巴黎' },
            ]}
            columns={[
              { title: 'query', dataIndex: 'column1' },
              { title: 'Positive Document', dataIndex: 'column2' },
            ]}
          />
          <div className='ad-mt-3'>{intl.get(`${prefixLocale}.exampleDesc`)}</div>
          <div className='ad-mt-2'>[ "欧洲杯足球赛共有24支队伍参加。", "巴黎", ]</div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default ({ open, ...restProps }: any) => {
  return open && <DiagramModal {...restProps} />;
};
