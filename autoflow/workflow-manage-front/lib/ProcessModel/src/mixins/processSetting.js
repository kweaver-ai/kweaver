import BpmnModdle from 'bpmn-moddle'
import { getDefaultJson } from 'ebpm-process-modeler-front/src/utils/processModel.js'
import activitiExtension from 'ebpm-process-modeler-front/activiti.json'
import { uuid8 } from '../utils/uuid.js'
export default {
  name:"ProcessSetting",
  data() {
    return {
      addNodeDisabled: false,
      processConfig: {},
      nodeConfig: {},
      flowPermission: []
    }
  },
  methods: {
    /**
     * 实例化流程配置
     * @param flow_xml (流程xml)
     * @param key （流程定义key）
     */
    initProcessConfig(flow_xml, key, name){
      const _this = this
      return new Promise((resolve) => {
        const activity_id = 'UserTask_' + uuid8(8, 62)
        _this.processConfig =  getDefaultJson(key, name, _this.getDefaultNodeName(0), activity_id, _this.getDefaultNodeName(1)).data
        _this.nodeConfig = _this.processConfig.nodeConfig
        _this.flowPermission = _this.processConfig.flowPermission
        if(null !== flow_xml && flow_xml !== ''){
          _this.openBpmn(flow_xml)
        }
        resolve(true)
      })
    },
    /**
     * 获取转换后bpmn格式xml
     */
    async getBpmnXml() {
      const _this = this
      _this.processConfig.flowPermission = _this.flowPermission
      let settingJsonStr = JSON.stringify(_this.processConfig)
      // 简单深拷贝取得流程配置数据
      let settingObj = JSON.parse(settingJsonStr)
      // eslint-disable-next-line consistent-return
      return await _this.json2Bpmn(settingObj)
    },
    getNodeList(settingObj){
      // 1.获取主节点内容
      let nodeMain = settingObj.nodeConfig
      // 设置各节点之间的关系，便于转化
      let nodeList = this.settingChildRel(nodeMain,[],'StartEvent_BPMN')
      return nodeList
    },
    /**
     * 转化为bpmn格式
     * params: settingObj  流程配置json数据
     * return bpmn格式内容
     */
    async json2Bpmn(settingObj) {
      const _this = this
      const moddle = new BpmnModdle({
        activiti: activitiExtension
      })
      // 1.获取主节点内容
      let nodeMain = settingObj.nodeConfig

      // 设置各节点之间的关系，便于转化
      let nodeList = _this.settingChildRel(nodeMain,[],'StartEvent_BPMN')
      // add a root element
      const {
        rootElement: definitions
      } = await moddle.fromXML('<?xml version="1.0" encoding="UTF-8"?>' +
        '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" ' +
        'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ' +
        'xmlns:activiti="http://activiti.org/bpmn" ' +
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
        'targetNamespace="http://www.activiti.org/test"> </definitions>')

      const startEvent = moddle.create('bpmn:StartEvent', {
        id: nodeList[0].id,
        'bpmn:name': nodeList[0].nodeName
      })
      const bpmnProcess = moddle.create('bpmn:Process', {
        id: _this.processConfig.workFlowDef.id ? _this.processConfig.workFlowDef.id : 'MyProcess_1',
        name: _this.processConfig.workFlowDef.name ? _this.processConfig.workFlowDef.name : '',
        isExecutable: true, 'bpmn:flowElements' : [startEvent]
      })
      // 任务列表
      const taskList = [startEvent]
      _this.setBpmnNode(nodeList, moddle, taskList, bpmnProcess)
      definitions.get('rootElements').push(bpmnProcess)

      // 图形配置（当前版本无用）
      const plane = moddle.create('bpmndi:BPMNPlane', {
        id: 'BPMNPlane_' + _this.processConfig.workFlowDef.id,
        'bpmndi:bpmnElement':bpmnProcess
      })
      const diagram = moddle.create('bpmndi:BPMNDiagram', { id: 'MyDiagramcess_' + _this.processConfig.workFlowDef.id,'bpmndi:plane': plane})
      definitions.get('rootElements').push(diagram)
      // xmlStrUpdated contains new id and the added process
      const {
        xml: xmlStrUpdated
      } = await moddle.toXML(definitions)

      return xmlStrUpdated
    },
    /**
     * 遍历递归转化各节点信息
     * 1.判断节点type类型 不为 3 (条件分支类型)
     * params ： nodeList  需要转化的节点列表
     * 			 moddle  bpmn-moddle
     * 			 taskList  任务节点列表
     * 			 bpmnProcess  进程节点 （主要载体）
     *
     */
    setBpmnNode(nodeList, moddle, taskList, bpmnProcess){
      const _this = this
      let lastUserTask = null
      let userTaskSequenceFlowList = []
      for(let item of nodeList){
        if(!item.parentId ){
          continue
        }
        if(!item.conditionNodes || item.conditionNodes.length === 0){
          if(item.type !== 3 ){
            // 自定义属性1
            const expandProperty = moddle.create('activiti:ExpandProperty', { id: 'dealType', value: 'tjsh' })
            // 原生扩展属性数组
            const extensions = moddle.create('bpmn:ExtensionElements', { values: [] })
            const multiInstanceLoopCharacteristics = moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
              'activiti:collection':'${assigneeList}',
              'activiti:elementVariable':'assignee'
            })
            extensions.values.push(expandProperty)
            // 声明任务节点和线节点，线节点的终点指自己，开始指向父关系节点，从任务节点找
            let UserTask = moddle.create('bpmn:UserTask', {
              id: item.id,
              name:item.nodeName,
              'activiti:assignee':'${assignee}',
              'activiti:candidateUsers': item.nodeUserList.length > 0 ? item.nodeUserList[0] : '',
              extensionElements: extensions,
              loopCharacteristics:multiInstanceLoopCharacteristics
            })
            let sequenceFlow
            let sourceRef = taskList.find(task => task.id === item.parentId)
            // 如果父类是条件节点,3类型的不会建立任务，所以sourceRef为空
            // 需要遍历4类型节点信息找sourceRef ，多个conditionNodes 就会有多条线节点
            // 7.28 龙哥说暂时不考虑条件节点
            if(item.parentType === 3 || item.parentType === 4){
              // 找父节点信息
              let pNode = nodeList.find(node => node.id === item.parentId)
              // 3类型节点conditionNodes为空 , 4类型可能有多个3类型的conditionNodes
              let conditionNodeList = []
              for(let i = 0;i < pNode.conditionNodes.length;i++){
                conditionNodeList.push(_this.settingChildRel(pNode.conditionNodes[i], [], pNode.id + i, pNode))
              }
              if(conditionNodeList.length < 1){
                if(pNode.parentType !== 3){
                  for(let tastItem of taskList){
                    if (tastItem.id === pNode.parentId){
                      sourceRef = tastItem
                    }
                  }
                  sequenceFlow = moddle.create('bpmn:SequenceFlow', {
                    id: item.inLine,
                    sourceRef:sourceRef,
                    targetRef:UserTask
                  })
                }else{
                  // 如果为3则继续找父节点不为3 的任务节点
                }
              }else{
                // 多个conditionNodeList
                let lineLists = []
                for(let nodes of conditionNodeList){
                  // 倒叙查找第一个返回的节点
                  let targetNode = nodes.reverse().find(node => node.type !== 3 && node.type !== 4)
                  if(!targetNode){
                    lineLists.push(pNode)
                  }else{
                    lineLists.push(targetNode)
                  }
                }
                taskList.push(UserTask)
                bpmnProcess.flowElements.push(UserTask)
                for(let k = 0;k < lineLists.length;k++){
                  let fromTask = taskList.find(task => task.id === lineLists[k].id)
                  sequenceFlow = moddle.create('bpmn:SequenceFlow', {
                    id: item.inLine + k,
                    sourceRef:fromTask,
                    targetRef:UserTask
                  })
                  bpmnProcess.flowElements.push(sequenceFlow)
                }
                return
              }
            }else{
              // 正常task
              sequenceFlow = moddle.create('bpmn:SequenceFlow', {
                id: 'SequenceFlow_' + item.inLine,
                sourceRef:sourceRef,
                targetRef:UserTask
              })
            }
            lastUserTask = UserTask
            taskList.push(UserTask)
            userTaskSequenceFlowList.push(sequenceFlow)
            bpmnProcess.flowElements.push(UserTask)
          }
        }else if (item.conditionNodes.length > 0){
          // 有条件节点，不知道正常节点会不会有这个东西
          // 应该也要判断父节点是不是3类型   7.28暂不考虑
          let sourceRef
          for(let tastItem of taskList){
            if (tastItem.id === item.parentId){
              sourceRef = tastItem
            }
          }
          // 条件
          let exclusiveGateway = moddle.create('bpmn:ExclusiveGateway', {
            id: item.id,
            name:item.nodeNamez
          })
          let sequenceFlow1 = moddle.create('bpmn:SequenceFlow', {
            id: item.inLine,
            sourceRef:sourceRef,
            targetRef:exclusiveGateway
          })
          taskList.push(exclusiveGateway)
          // 添加conditionNodes下的包含的子节点,因为有区别与childnode的另一种包含子节点的形式
          bpmnProcess.flowElements.push(exclusiveGateway,sequenceFlow1)
          for(let i = 0;i < item.conditionNodes.length;i++){
            let itemNodeList = this.settingChildRel(item.conditionNodes[i],[],item.id + i,item)
            this.setBpmnNode(itemNodeList, moddle, taskList, bpmnProcess)
          }
        }
      }

      // 返回bpmn需要组装一个结束节点
      const endEvent = moddle.create('bpmn:EndEvent', {
        id:this.processConfig.endId ? this.processConfig.endId : 'EndEvent_1wqgipp',
        'bpmn:name':this.processConfig.endName ? this.processConfig.endName : '流程结束'
      })
      bpmnProcess.flowElements.push(endEvent)

      // 添加用户任务连线
      userTaskSequenceFlowList.forEach(uts => {
        bpmnProcess.flowElements.push(uts)
      })

      // 添加结束节点连线
      let endSequenceFlow = moddle.create('bpmn:SequenceFlow', {
        id: 'SequenceFlow_EndEvent',
        sourceRef:lastUserTask,
        targetRef:endEvent
      })
      bpmnProcess.flowElements.push(endSequenceFlow)
    },
    /**
     * 打开bpmn格式xml
     * @param xml
     * @returns {Promise<void>}
     */
    async openBpmn(bpmn_xml){
      const moddle = new BpmnModdle()
      const {
        rootElement: definitions
      } = await moddle.fromXML(bpmn_xml)

      let process = definitions.rootElements[0]

      // 初始化流程信息
      this.processConfig.flowPermission = this.flowPermission
      this.processConfig.workFlowDef.name = process.name
      this.processConfig.id = process.id
      this.processConfig.endId = ''
      this.processConfig.endName = ''
      let endEle = process.flowElements.find(ele=>ele.$type === 'bpmn:EndEvent')
      if(endEle){
        this.processConfig.endId = endEle.id
        this.processConfig.endName = endEle.name
      }
      // 根据bpmn_xml流程元素生成页面流程节点
      let nodeList = process.flowElements
      for(let item of nodeList){
        // 初始化开始节点信息
        if(item.$type === 'bpmn:StartEvent'){
          this.processConfig.nodeConfig.nodeName = item.name
          this.processConfig.nodeConfig.id = item.id
          // 清空子节点信息
          this.processConfig.nodeConfig.childNode = null
        }else if(item.$type === 'bpmn:SequenceFlow'){
          // 根据读入的线节点关系，生成任务节点
          let fromItem = item.sourceRef
          let toItem = item.targetRef
          // 递归找node节点
          let node = this.findNode(this.processConfig.nodeConfig,fromItem.id)
          let toNode = this.findNode(this.processConfig.nodeConfig,toItem.id)
          if(node){
            let data
            if(toItem.extensionElements){
              // 扩展节点带来的值toItem.extensionElements.values
            }
            if(toItem.$type !== 'bpmn:EndEvent'){
              if(toItem.$type !== 'bpmn:ExclusiveGateway'){
                // 默认生成审批节点,暂不考虑条件节点
                const candidateUsers = toItem.$attrs['activiti:candidateUsers']
                let nodeUserList = []
                candidateUsers !== '' ? nodeUserList.push(candidateUsers) : ''
                if(node){
                  data = {
                    'nodeId': toItem.id,
                    'nodeName': toItem.name,
                    'error': false,
                    'type': 1,
                    'settype': 1,
                    'selectMode': 0,
                    'selectRange': 0,
                    'directorLevel': 1,
                    'examineMode': 1,
                    'noHanderAction': 1,
                    'id':toItem.id,
                    'examineEndDirectorLevel': 0,
                    'childNode': null,
                    'nodeUserList': nodeUserList
                  }
                }
              }
              // 处理多条线连接到一个节点的情况，暂不考虑
              if(!node.childNode && !toNode){
                node.childNode = data
              }
            }
          }else{
            // 如果父节点没有生成，目前的逻辑是先生成开始节点作为父节点，线节点的生成关系也是再任务节点后生成
          }
        }
      }
    },
    /**
     * 递归查找node节点
     * @param node
     * @param id
     * @returns {null|*|null|*}
     */
    findNode(node,id){
      if(node.id === id){
        return node
      }else if(node.childNode){
        return 	this.findNode(node.childNode,id)

      }else{
        return null
      }
    },
    /**
     * 递归遍历各节点，主要优化关系，配置父子联系
     * params ：node 要遍历的节点信息，
     * 			    nodeList  需要返回的节点数组
     * 			    sign  给节点id设置的标记 新建保存的时候会 "BPMN"前缀
     * 			    pNode 父节点
     * return : 配置了关系的节点列表
     */
    settingChildRel(node, nodeList, sign, pNode){
      const _this = this
      // 导入的节点存在id信息就不修改
      if(!node.id){
        node.id = node.nodeId
      }
      // 配置需要的信息
      node.outLine = node.nodeId + 'LINE'
      node.inLine = pNode ? pNode.outLine : null
      node.parentId = pNode ? pNode.id : null
      node.parentType = pNode ? pNode.type : null
      nodeList.push(node)
      if(node.childNode){
        return _this.settingChildRel(node.childNode, nodeList, 'UserTask_BPMN', node)
      }
      return nodeList
    },
    getDefaultNodeName(type){
      const _this = this
      if(type === 0){
        return _this.$i18n.tc('sync.startProcess')
      } else if(type === 1){
        return _this.$i18n.tc('modeler.procLink.UserTask')
      }
      return ''
    },
    settingNodeName(configObj){
      const _this = this
      if(configObj.nodeConfig.type === 1 && configObj.nodeConfig.nodeId === configObj.node.nodeId){
        configObj.nodeConfig.nodeName =  configObj.node.nodeName
        configObj.nodeConfig.nodeUserList = configObj.node.nodeUserList
        return configObj
      }
      if(configObj.nodeConfig.childNode){
        let childConfigObj = {
          nodeConfig: configObj.nodeConfig.childNode,
          nodeId: configObj.node.nodeId,
          node: configObj.node
        }
        const resultItem = _this.settingNodeName(childConfigObj)
        configObj.nodeConfig.childNode = resultItem.nodeConfig
        return configObj
      }
      return configObj
    },
    /**
     * 校验环节是否配置审核员
     * @param checkObj
     * @param nodeId
     * @returns {*}
     */
    checkNodeUsers(checkObj, nodeId){
      const _this = this
      if(nodeId !== null){
        if(checkObj.nodeConfig.nodeId === nodeId){
          if(checkObj.nodeConfig.type === 1 && checkObj.nodeConfig.nodeUserList.length === 0){
            checkObj.nodeConfig.error = true
            checkObj.result = false
          } else {
            checkObj.nodeConfig.error = false
          }
        }
      } else {
        checkObj.nodeConfig.error = false
        if(checkObj.nodeConfig.type === 1 && checkObj.nodeConfig.nodeUserList.length === 0){
          checkObj.nodeConfig.error = true
          checkObj.result = false
        }
      }

      if(checkObj.nodeConfig.childNode){
        let childCheckObj = {
          nodeConfig:checkObj.nodeConfig.childNode,
          result: checkObj.result
        }
        const resultItem = _this.checkNodeUsers(childCheckObj, nodeId)
        checkObj.nodeConfig.childNode = resultItem.nodeConfig
        checkObj.result = resultItem.result
        return checkObj
      }
      return checkObj
    },
    /**
     * 校验环节是否配置策略
     * @param checkObj
     * @param nodeId
     * @returns {*}
     */
    checkNodeSetStrategy(checkObj, nodeId){
      const _this = this
      checkObj.nodeConfig.error = false
      if(nodeId !== null){
        if(checkObj.nodeConfig.nodeId === nodeId){
          if(checkObj.nodeConfig.type === 1){
            let checkArray = checkObj.strategyList.filter(strategy => strategy.act_def_id === checkObj.nodeConfig.nodeId)
            if(checkArray.length === 0){
              checkObj.nodeConfig.error = true
              checkObj.result = false
            }
          }
        }
      } else {
        if(checkObj.nodeConfig.type === 1){
          let checkArray = checkObj.strategyList.filter(strategy => strategy.act_def_id === checkObj.nodeConfig.nodeId)
          if(checkArray.length === 0){
            checkObj.nodeConfig.error = true
            checkObj.result = false
          }
        }
      }

      if(checkObj.nodeConfig.childNode){
        let childCheckObj = {
          nodeConfig:checkObj.nodeConfig.childNode,
          strategyList:checkObj.strategyList,
          result: checkObj.result
        }
        const resultItem = _this.checkNodeSetStrategy(childCheckObj, nodeId)
        checkObj.nodeConfig.childNode = resultItem.nodeConfig
        checkObj.result = resultItem.result
        return checkObj
      }
      return checkObj
    },
    /**
     * 初始化审核环节审核员（用于校验）
     * @param initObj
     * @param strategyList
     * @returns {*}
     */
    initNodeUsers(initObj, strategyList){
      const _this = this
      if(initObj.nodeConfig.type === 1 && strategyList.length > 0){
        strategyList.forEach(strategy => {
          if(strategy.act_def_id === initObj.nodeConfig.nodeId){
            initObj.nodeConfig.nodeUserList = []
            initObj.nodeConfig.strategyType = strategy.strategy_type
            strategy.auditor_list.length > 0 ? initObj.nodeConfig.nodeUserList.push(strategy.auditor_list[0].user_id) : ''
          }
        })
      }
      if(initObj.nodeConfig.childNode){
        let childInitObj = {
          nodeConfig:initObj.nodeConfig.childNode
        }
        const resultItem = _this.initNodeUsers(childInitObj, strategyList)
        initObj.nodeConfig.childNode = resultItem.nodeConfig
        return initObj
      }
      return initObj
    },
    /**
     * 检查审核策略是否存在环节（环节删除移除审核策略）
     */
    checkNodeStrategy(checkObj){
      const _this = this
      if(checkObj.nodeConfig.type === 1){
        if (checkObj.nodeConfig.nodeId === checkObj.strategy.act_def_id) {
          checkObj.result = true
        }
      }
      if(checkObj.nodeConfig.childNode){
        let childInitObj = {
          nodeConfig:checkObj.nodeConfig.childNode,
          strategy:checkObj.strategy,
          result: checkObj.result
        }
        const resultItem = _this.checkNodeStrategy(childInitObj)
        checkObj.nodeConfig.childNode = resultItem.nodeConfig
        checkObj.result = resultItem.result
        return checkObj
      }
      return checkObj
    },
    /**
     * 根据环节节点对审核策略进行排序
     */
    sortNodeStrategy(sortObj){
      const _this = this
      if(sortObj.nodeConfig.type === 1){
        sortObj.approverConfigStrategyList.forEach(e => {
          if(e.act_def_id === sortObj.nodeConfig.nodeId){
            sortObj.sortedConfigStrategyList.push(e)
          }
        })
      }
      if(sortObj.nodeConfig.childNode){
        let childSortObj = {
          nodeConfig:sortObj.nodeConfig.childNode,
          approverConfigStrategyList:sortObj.approverConfigStrategyList,
          sortedConfigStrategyList: sortObj.sortedConfigStrategyList
        }
        const resultItem = _this.sortNodeStrategy(childSortObj)
        sortObj.nodeConfig.childNode = resultItem.nodeConfig
        sortObj.sortedConfigStrategyList = resultItem.sortedConfigStrategyList
        return sortObj
      }
      return sortObj
    },
    /**
     * 加载环节审核员显示
     * @param initObj
     * @param strategyList
     * @returns {*}
     */
    loadNodeUsersView(viewObj, viewAuditors){
      const _this = this
      if(viewObj.nodeConfig.type === 1 && viewAuditors.length > 0){
        viewAuditors.forEach(view => {
          if(view.actDefId === viewObj.nodeConfig.nodeId){
            viewObj.nodeConfig.viewAuditors = view
          }
        })
      }
      if(viewObj.nodeConfig.childNode){
        let childViewObj = {
          nodeConfig:viewObj.nodeConfig.childNode
        }
        const resultItem = _this.loadNodeUsersView(childViewObj, viewAuditors)
        viewObj.nodeConfig.childNode = resultItem.nodeConfig
        return viewObj
      }
      return viewObj
    },
    /**
     * 获取第一个节点ID
     * @param _obj
     * @returns {*}
     */
    getFirstNodeId(_obj){
      const _this = this
      if(_obj.nodeConfig.parentType === 0){
        _obj.firstNodeId = _obj.nodeConfig.nodeId
      }
      if(_obj.nodeConfig.childNode){
        let childObj = {
          nodeConfig: _obj.nodeConfig.childNode,
          firstNodeId: ''
        }
        const resultItem = _this.getFirstNodeId(childObj)
        _obj.nodeConfig.childNode = resultItem.nodeConfig
        _obj.firstNodeId = resultItem.nodeConfig.nodeId
        return _obj
      }
      return _obj
    }
  }
}
