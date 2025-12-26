import intl from 'react-intl-universal';

import Format from '@/components/Format';

import FuncIndicatorList from './FuncIndicatorList';

const IndicatorLibraryList = () => {
  return (
    <div className='IndicatorLibraryList ad-w-100 ad-h-100 ad-flex-column' style={{ padding: '16px 24px', overflow: 'auto' }}>
      <Format.Title className='ad-c-header' style={{ marginBottom: 18 }}>
        {intl.get('benchmark.menu.indicator')}
      </Format.Title>
      <FuncIndicatorList />
    </div>
  );
};

export default IndicatorLibraryList;
