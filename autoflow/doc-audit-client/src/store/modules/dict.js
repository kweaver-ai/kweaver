const state = {
  // 字典
  dictList: {
    // 审核模式
    auditTypes: [
      { label: '同级审核', value: 'tjsh' },
      { label: '会签审核', value: 'hqsh' },
      { label: '依次审核', value: 'zjsh' }
    ],
    // 审核状态
    auditStatuss: [
      { label: '全部', value: '' },
      { label: '审核中', value: 'pending' },
      { label: '已拒绝', value: 'reject' },
      { label: '已通过', value: 'pass' },
      { label: '自动审核通过', value: 'avoid' },
      /* { label: '发起失败', value: 'failed' },*/
      { label: '已撤销', value: 'undone' }
    ],
    // 申请类型
    bizTypes: [
      { label: '申请类型', value: '' },
      {
        label: '共享申请', value: 'share', children: [
          // 实名新类型  [perm, owner,inherit]
          { label: '共享给指定用户的申请', value: 'realname' },
          { label: '共享给任意用户的申请', value: 'anonymous' }
        ]
      },
      // { label: '文档域同步申请', value: 'sync' },
      // { label: '定密申请', value: 'security' },
      { label: '文档流转/文档收集申请', value: 'flow' }
    ],
    // 文档共享权限
    docSharePermEnum: [
      { value: 'display', index: 1 },
      { value: 'preview', index: 2 },
      { value: 'cache', index: 3 },
      { value: 'download', index: 4 },
      { value: 'create', index: 5 },
      { value: 'modify', index: 6 },
      { value: 'delete', index: 7 }
    ]
  }
}

export default {
  state
}
