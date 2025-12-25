export function getDefaultJson(processId, processName, startName, activityId, activityName) {
  return {
    'data': {
      'tableId': 1,
      'workFlowVersionId': '',
      'workFlowDef': {
        'id':`${processId}`,
        'name': `${processName}`,
        'publicFlag': 1,
        'sortNo': 5,
        'duplicateRemovelFlag': 1,
        'optionTip': '',
        'optionNotNull': 0,
        'status': 1
      },
      'directorMaxLevel': 4,
      'flowPermission': [],
      'nodeConfig': {
        'pkId': 'sid-start-node',
        'nodeId': 'sid-start-node',
        'nodeName': `${startName}`,
        'type': 0,
        'priorityLevel': '',
        'settype': '',
        'selectMode': '',
        'selectRange': '',
        'examineRoleId': '',
        'directorLevel': '',
        'replaceByUp': '',
        'examineMode': '',
        'noHanderAction': '',
        'examineEndType': '',
        'examineEndRoleId': '',
        'examineEndDirectorLevel': '',
        'ccSelfSelectFlag': '',
        'conditionList': [],
        'nodeUserList': [],
        'viewAuditors': null,
        'strategyType': '',
        'childNode': {
          'nodeId': `${activityId}`,
          'nodeName': `${activityName}`,
          'error': false,
          'type': 1,
          'settype': 2,
          'selectMode': 0,
          'selectRange': 0,
          'directorLevel': 1,
          'replaceByUp': 0,
          'examineMode': 1,
          'noHanderAction': 2,
          'examineEndDirectorLevel': 0,
          'nodeUserList': []
        },
        'conditionNodes': []
      }
    }
  }
}
