import { createContext, useContext, useState } from 'react';
import { CustomDataViewContextType, GroupType } from './type';

const CustomDataViewContext = createContext<CustomDataViewContextType>({
  currentSelectGroup: undefined,
  setCurrentSelectGroup: () => {},
  reloadGroup: false,
  setReloadGroup: () => {},
});

export const CustomDataViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSelectGroup, setCurrentSelectGroup] = useState<GroupType | undefined>(undefined);
  const [reloadGroup, setReloadGroup] = useState<boolean>(false);

  const contextValue: CustomDataViewContextType = {
    currentSelectGroup,
    setCurrentSelectGroup,
    reloadGroup,
    setReloadGroup,
  };

  return <CustomDataViewContext.Provider value={contextValue}>{children}</CustomDataViewContext.Provider>;
};

export const useCustomDataViewContext = () => {
  return useContext(CustomDataViewContext);
};
