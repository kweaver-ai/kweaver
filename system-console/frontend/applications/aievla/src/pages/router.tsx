import { useMemo, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/lib/locale/en_US';

import locales from '@/locales';
import { adCookie } from '@/utils/handleFunction';
import { langTransform } from '@/utils/axios-http/studioAxios';
import getAntdGlobalConfig from '@/theme/getAntdGlobalConfig';

import UploadDrawer from './Global/UploadDrawer';
import NotFound from '@/components/NotFound';
import DataSetList from '@/pages/DataManage/DataSetList'; // 测评数据集
import DataSetManage from '@/pages/DataManage/DataSetManage'; // 测评数据集详情
import LeaderBoard from '@/pages/Benchmark/Leaderboard'; // 榜单
import IndicatorLibrary from '@/pages/Benchmark/IndicatorLibrary'; // 测试指标
import EffectEvaluation from '@/pages/Benchmark/EffectEvaluation'; // 效果测评
import BenchmarkConfigGraph from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph';
import BenchmarkCreateTask from '@/pages/Benchmark/BenchmarkTasks/CreateBenchmarkTask';
import ViewLog from '@/pages/Benchmark/BenchmarkTasks/ViewLog';

// ✓ 1、Benchmark配置 Benchmark任务 改成 tabs
// ✓ 2、Benchmark任务 选择提示词改成输入框
// ✓ 3、modal 的 样式
// ✓ 4、模型工厂接口调整
const App = (props: any) => {
  const { lang, container } = props;
  const language = langTransform[lang] || 'zh-CN';

  useEffect(() => {
    ConfigProvider.config({ theme: { ...getAntdGlobalConfig() } });
    message.config({
      top: 32,
      maxCount: 1,
      getContainer: () => document.getElementById('aievla-root') || container,
    });
    adCookie.set('anyDataLang', language, { expires: 365 });
    intl.init({ currentLocale: language, locales, warningHandler: () => '' });
  }, []);

  /** url */
  const baseUrl = useMemo(() => {
    if (!props?.history?.getBasePath) return '';
    const name = '/' + props?.name;
    return _.split(props?.history?.getBasePath, name)?.[0] || '';
  }, [props?.history?.getBasePath]);

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      locale={language === 'en_US' ? enUS : zhCN}
      getPopupContainer={() => document.getElementById('aievla-root') || container}
    >
      <Router basename={(window as any).__POWERED_BY_QIANKUN__ ? baseUrl : ''}>
        <Switch>
          <Route exact path='/evaluation-data' render={() => <DataSetList />} />
          <Route path='/evaluation-data/manager' render={() => <DataSetManage />} />
          <Route path='/board' render={() => <LeaderBoard />} />
          <Route path='/indicator' render={() => <IndicatorLibrary />} />
          <Route exact path='/effect-evaluation' render={() => <EffectEvaluation />} />
          <Route path='/effect-evaluation/config-graph' render={() => <BenchmarkConfigGraph />} />
          <Route path='/effect-evaluation/create-task' render={() => <BenchmarkCreateTask />} />
          <Route path='/effect-evaluation/log' render={() => <ViewLog />} />
          <Route render={() => <NotFound />} />
        </Switch>
      </Router>
      <UploadDrawer />
    </ConfigProvider>
  );
};

export default App;
