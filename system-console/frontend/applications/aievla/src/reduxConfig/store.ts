import { createStore, compose } from 'redux';
import rootReducer from '@/reduxConfig/reducers';

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store: any = createStore(rootReducer, composeEnhancers());

export default store;
