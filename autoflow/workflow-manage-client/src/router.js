import Layout from './layout/index.vue'
let routes = [
  {
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
  },
  {
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
  },
  {
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
]
// eslint-disable-next-line no-unused-vars
const indexRoute = {
  path: '/',
  component: Layout,
  children: [{
    path: '',
    name: 'ProcessCenter',
    component: () => import('@/views/process-center/index'),
    meta: {
      title: 'menu.processCenter',
      icon: 'el-icon-tickets'
    }
  }]
}
const integrationRoute = {
  path: '/',
  name: 'index',
  hidden: true,
  component: () => import('@/views/integration/index')
}

window.__POWERED_BY_QIANKUN__ ? routes.push(integrationRoute) : routes.push(integrationRoute)

export default routes
