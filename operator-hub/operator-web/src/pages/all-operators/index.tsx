import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';

const routeComponents = {
  OperatorDetailFlow: lazy(() => import('@/components/MyOperator/OperatorDetailFlow')),
  ToolDetail: lazy(() => import('@/components/Tool/ToolDetail')),
  McpDetail: lazy(() => import('@/components/MCP/McpDetail')),
  PluginMarket: lazy(() => import('@/components/PluginMarket')),
  OperatorDetail: lazy(() => import('@/components/Operator/OperatorDetail')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.PluginMarket />,
  },
  {
    path: '/operator-detail',
    element: <routeComponents.OperatorDetail />,
  },
  {
    path: '/tool-detail',
    element: <routeComponents.ToolDetail />,
  },
  {
    path: '/mcp-detail',
    element: <routeComponents.McpDetail />,
  },
  {
    path: '/details/:id',
    element: <routeComponents.OperatorDetailFlow />,
  },
  {
    path: '/details/:id/log/:recordId',
    element: <routeComponents.OperatorDetailFlow />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes);
export { bootstrap, mount, unmount };
