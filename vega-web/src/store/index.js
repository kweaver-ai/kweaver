/**
 * Redux Store，存放应用中的所有状态
 */

import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '../reducers';
import rootSaga from '../sagas';

// 创建 saga 中间件
const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];

// 使 redux-devtools_extension 生效
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({}) : compose;

const enhancer = composeEnhancers(applyMiddleware(...middleware));

// 创建 Store，单一 Store
const store = createStore(rootReducer, enhancer);

// 运行 saga 中间件
sagaMiddleware.run(rootSaga);

export default store;
