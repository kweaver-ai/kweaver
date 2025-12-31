import { Splitter } from 'antd';
import { CustomDataViewProvider } from './context';
import { MainContent } from './MainContent';
import { SideBar } from './SideBar';

const CustomDataView = () => {
  return (
    <CustomDataViewProvider>
      <div className="g-h-100">
        <Splitter>
          <Splitter.Panel defaultSize={280} min={0} max={280} collapsible>
            <SideBar />
          </Splitter.Panel>
          <Splitter.Panel>
            <MainContent />
          </Splitter.Panel>
        </Splitter>
      </div>
    </CustomDataViewProvider>
  );
};

export default CustomDataView;
