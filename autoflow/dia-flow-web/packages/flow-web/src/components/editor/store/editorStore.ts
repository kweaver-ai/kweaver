import { create } from 'zustand';

export interface EditorStoreType {
  editorSteps?: any;
  setEditorSteps: (editorSteps: any) => void;
}

const editorStore = create<EditorStoreType>(set => ({
  editorSteps: [],
  setEditorSteps: editorSteps => set({ editorSteps }),
}));

export default editorStore;
