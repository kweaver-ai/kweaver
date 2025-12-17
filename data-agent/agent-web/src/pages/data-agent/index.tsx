import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';

const routeComponents = {
  DataAgents: lazy(() => import('@/components/DataAgents')),
  AgentConfig: lazy(() => import('@/components/AgentConfig')),
  AgentUsage: lazy(() => import('./AgentUsage')),
  DolphinLanguageDoc: lazy(() => import('./DolphinLanguageDoc')),
  AgentApiDocument: lazy(() => import('./AgentApiDocument')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.DataAgents />,
  },
  {
    path: '/config',
    element: <routeComponents.AgentConfig />,
  },
  {
    path: '/usage',
    element: <routeComponents.AgentUsage />,
  },
  {
    path: '/dolphin-language-doc',
    element: <routeComponents.DolphinLanguageDoc />,
  },
  {
    path: '/api-doc',
    element: <routeComponents.AgentApiDocument />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes);
export { bootstrap, mount, unmount };
