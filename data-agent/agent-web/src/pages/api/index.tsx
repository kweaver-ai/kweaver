import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';
import { ModeEnum } from '@/components/DataAgents/types';

const routeComponents = {
  DataAgents: lazy(() => import('@/components/DataAgents')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.DataAgents mode={ModeEnum.API} />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes);
export { bootstrap, mount, unmount };
