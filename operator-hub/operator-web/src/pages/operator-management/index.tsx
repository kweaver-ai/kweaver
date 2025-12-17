import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';

const routeComponents = {
  OperatorList: lazy(() => import('@/components/OperatorList')),
  ToolDetail: lazy(() => import('@/components/Tool/ToolDetail')),
  McpDetail: lazy(() => import('@/components/MCP/McpDetail')),
  OperatorDetailFlow: lazy(() => import('@/components/MyOperator/OperatorDetailFlow')),
  OperatorDetail: lazy(() => import('@/components/Operator/OperatorDetail')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.OperatorList />,
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
