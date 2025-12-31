import { createContext, useContext } from 'react';

export const DataViewContext = createContext<{
  dataViewTotalInfo: any;
  setDataViewTotalInfo: (dataViewTotalInfo: any) => void;
  selectedDataView: any;
  setSelectedDataView: (selectedDataView: any) => void;
  previewNode: any;
  setPreviewNode: (previewNode: any) => void;
}>({
  dataViewTotalInfo: {},
  setDataViewTotalInfo: () => {},
  selectedDataView: {},
  setSelectedDataView: () => {},
  previewNode: {},
  setPreviewNode: () => {},
});

export const useDataViewContext = () => {
  return useContext(DataViewContext);
};
