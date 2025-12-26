import { Routes, Route } from 'react-router-dom';

import EvaluationData from './EvaluationData';
import EvaluationDataDetail from './EvaluationDataDetail';

// /evaluation-data
export default () => {
  return (
    <Routes>
      <Route path='/' element={<EvaluationData />} />
      <Route path='/detail' element={<EvaluationDataDetail />} />
    </Routes>
  );
};
