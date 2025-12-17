import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';
import { ModeEnum } from '@/components/DataAgents/types';

const routeComponents = {
  DataAgents: lazy(() => import('@/components/DataAgents')),
  AgentConfig: lazy(() => import('@/components/AgentConfig')),
  AgentDetail: lazy(() => import('@/components/AgentDetail')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.DataAgents mode={ModeEnum.AllTemplate} />,
  },
  {
    path: '/config',
    element: <routeComponents.AgentConfig />,
  },
  {
    path: '/template-detail/:id',
    element: <routeComponents.AgentDetail isTemplate={true} onlyShowPublishedVersion={true} />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes);
export { bootstrap, mount, unmount };
