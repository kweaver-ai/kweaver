import Layout from '@/layout/index.vue'
export function initRoutes(routes, realRouterPrefix) {
  const tokenRoute = {
    path: '/token',
    component: Layout,
    redirect: '/token/set',
    name: 'SETTOKEN',
    meta: { title: 'token设置', icon: 'el-icon-s-help' },
    children: [
      {
        path: 'set',
        name: 'tokenSet',
        alwaysShow: true,
        component: () => import('@/views/token/index'),
        meta: { title: 'menu.TokenSet', icon: 'el-icon-key' }
      }
    ]
  }

  const processCenterRoute = {
    path: '/processCenter',
    component: Layout,
    name: 'ProcessCenter',
    meta: { title: 'menu.processCenter', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'ProcessCenter',
        alwaysShow: true,
        component: () => import('@/views/process-center/index'),
        meta: { title: 'menu.processCenter', icon: 'el-icon-tickets' }
      }
    ]
  }

  const deptAuditorRoute = {
    path: '/deptAuditor',
    component: Layout,
    name: 'DeptAuditor',
    meta: { title: 'menu.deptAuditor', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'DeptAuditor',
        alwaysShow: true,
        component: () => import('@/views/dept-auditor-rule/index'),
        meta: { title: 'menu.deptAuditor', icon: 'el-icon-tickets' }
      }
    ]
  }

  const integrationRoute = {
    path: realRouterPrefix + '/',
    name: 'index',
    hidden: true,
    component: () => import('@/views/integration/index')
  }
  let tokenRoutes = routes.filter((item) => item.path === tokenRoute.path)
  tokenRoutes.length === 0 ? routes.push(tokenRoute) : ''

  let processCenterRoutes = routes.filter((item) => item.path === processCenterRoute.path)
  processCenterRoutes.length === 0 ? routes.push(processCenterRoute) : ''

  let deptAuditorRoutes = routes.filter((item) => item.path === deptAuditorRoute.path)
  deptAuditorRoutes.length === 0 ? routes.push(deptAuditorRoute) : ''

  let integrationRoutes = routes.filter((item) => item.path === integrationRoute.path)
  integrationRoutes.length === 0 ? routes.push(integrationRoute) : ''
}


