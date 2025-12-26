import { combineReducers } from 'redux-immutable';

import changeAnyDataLang from './changeAnyDataLang';

import knowledgeGraph from './knowledgeGraph';

import sqlQueryHistory from './sqlQueryHistory';

// 上传文件
import uploadFile from './uploadFile';

import graphQA from './graphQA';

export default combineReducers({
  changeAnyDataLang,

  knowledgeGraph,
  sqlQueryHistory,
  graphQA,
  uploadFile,
});
