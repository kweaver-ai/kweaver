/**
 * 算子代码编辑组件
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation, useBlocker } from 'react-router-dom';
import { Layout, Splitter, message, Modal } from 'antd';
import intl from 'react-intl-universal';
import {
  getToolBoxTemplate,
  postTool,
  getToolDetail,
  editTool,
  postOperatorRegisterWithoutHeader,
  getOperatorInfoById,
  postOperatorInfo,
} from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import DebugPanel from './DebugPanel';
import { OperatorTypeEnum } from '@/components/OperatorList/types';
import { useMicroWidgetProps, useNavigationBlocker } from '@/hooks';
import Toolbar from './Toolbar';
import ControlSidebar from './ControlSidebar';
import ConsolePanel from './ConsolePanel';
import EditingArea from './EditingArea';
import { ActionEnum, type ToolDetail } from './types';
import { parseInputsFromToolInfo, parseOutputsFromToolInfo } from './utils';

const commonStyle = {
  background: 'transparent',
};

interface IDEWorkspaceProps {
  action: ActionEnum; // 操作类型：新建 or 编辑
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
}

const IDEWorkspace = ({ action, operatorType }: IDEWorkspaceProps) => {
  const [modal, contextHolder] = Modal.useModal();
  const { toolId, toolboxId, operatorId } = useParams();
  const location = useLocation();
  const microWidgetProps = useMicroWidgetProps();
  const navigate = useNavigate();
  const editingAreaRef = useRef<{ validate: () => Promise<boolean> }>(null);
  const hasChangedRef = useRef<boolean>(false); // 是否已有改动
  const willGoBackRef = useRef<boolean>(false); // 是否会返回

  const [panelVisible, setPanelVisible] = useState<{ debugPanel: boolean; consolePanel: boolean }>({
    debugPanel: true,
    consolePanel: false,
  }); // 面板的显示状态
  const [stdoutLines, setStdoutLines] = useState<string[][]>([]); // 控制台输出结果
  const [detail, setDetail] = useState<ToolDetail>({
    script_type: 'python',
    operator_execute_control:
      operatorType === OperatorTypeEnum.Operator && action === ActionEnum.Create ? { timeout: 3000 } : undefined, // 新建算子，默认3000超时时间
  }); // 详细信息
  const [savedName, setSavedName] = useState<string>(''); // 已经保存了的名称，用于Toolbar的显示
  const [consolePanelSize, setConsolePanelSize] = useState<number>(200); // 控制台面板的高度(因为一开始控制台面板不显示，导致defaultSize: 200 不生效，所以用受控状态来控制高度)
  const [hasChanged, setHasChanged] = useState<boolean>(false); // 是否已有改动
  const [saveLoading, setSaveLoading] = useState<boolean>(false); // 保存按钮的加载状态

  useEffect(() => {
    // 隐藏侧边栏
    microWidgetProps?.toggleSideBarShow?.(false);

    return () => {
      microWidgetProps?.toggleSideBarShow?.(true);
    };
  }, []);

  useEffect(() => {
    if (action === ActionEnum.Create) {
      // 新建时，获取模板内容
      getPythonTemplate();
      setSavedName(operatorType === OperatorTypeEnum.Tool ? '新建工具（1）' : '新建算子（1）');
    } else {
      // 编辑时，接口获取所有信息
      switch (operatorType) {
        case OperatorTypeEnum.Tool:
          getTool(toolboxId!, toolId!);
          break;
        case OperatorTypeEnum.Operator:
          getOperatorDetail(operatorId!);
          break;
      }
    }
  }, [action, toolboxId, toolId, operatorType, operatorId]);

  // 获取python模板
  const getPythonTemplate = async () => {
    try {
      const { code_template } = await getToolBoxTemplate();
      setDetail(prev => ({
        ...prev,
        code: code_template,
      }));
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
    }
  };

  // 获取工具详情
  const getTool = async (toolBoxId: string, toolId: string) => {
    try {
      const {
        name,
        description,
        use_rule,
        metadata: {
          function_content: { code },
          api_spec,
        },
      } = await getToolDetail(toolBoxId, toolId);
      const inputs = parseInputsFromToolInfo(api_spec);
      const outputs = parseOutputsFromToolInfo(api_spec);

      setDetail(prev => ({
        ...prev,
        use_rule,
        name,
        description,
        inputs,
        outputs,
        code,
      }));
      setSavedName(name);
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
    }
  };

  // 新建工具
  const createToolFunction = useCallback(
    async (successCallback: () => void, finallyCallback: () => void) => {
      const { success_count, failure_count, success_ids, failures } = await postTool(toolboxId!, {
        metadata_type: MetadataTypeEnum.Function,
        use_rule: detail.use_rule,
        function_input: {
          name: detail.name,
          description: detail.description,
          inputs: detail.inputs,
          outputs: detail.outputs,
          code: detail.code,
          script_type: detail.script_type,
        },
      });

      if (success_count === 1) {
        message.success('新建成功');
        setSavedName(detail.name!);
        setDetail(prev => ({
          ...prev,
          inputs: detail.inputs,
          outputs: detail.outputs,
        }));
        successCallback();
        setTimeout(() => {
          if (!willGoBackRef.current) {
            // 新建成功后，路由需要变化成编辑的路由，便于后续刷新页面
            navigate(`/ide/toolbox/${toolboxId}/tool/${success_ids?.[0]}/edit`);
          }
        }, 0);
      } else if (failure_count === 1) {
        message.error(failures?.[0]?.error?.description || '新建失败');
      }
      finallyCallback();
    },
    [toolboxId, detail, navigate]
  );

  // 编辑工具
  const editToolFunction = useCallback(
    async (successCallback: () => void, finallyCallback: () => void) => {
      await editTool(toolboxId!, toolId!, {
        name: detail.name,
        description: detail.description,
        use_rule: detail.use_rule,
        metadata_type: MetadataTypeEnum.Function,
        function_input: {
          inputs: detail.inputs,
          outputs: detail.outputs,
          code: detail.code,
          script_type: detail.script_type,
        },
      });
      message.success('编辑成功');
      setSavedName(detail.name!);
      successCallback();
      finallyCallback();
    },
    [toolboxId, toolId, detail]
  );

  // 获取算子详情
  const getOperatorDetail = async (operatorId: string) => {
    try {
      const {
        name,
        metadata: {
          description,
          function_content: { code },
          api_spec,
        },
        operator_execute_control,
        operator_info,
      } = await getOperatorInfoById(operatorId);
      const inputs = parseInputsFromToolInfo(api_spec);
      const outputs = parseOutputsFromToolInfo(api_spec);

      setDetail(prev => ({
        ...prev,
        name,
        description,
        inputs,
        outputs,
        code,
        operator_execute_control,
        operator_info,
      }));
      setSavedName(name);
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
    }
  };

  // 新建算子
  const createOperator = useCallback(
    async (successCallback: () => void, finallyCallback: () => void) => {
      const [{ status, operator_id, error }] = await postOperatorRegisterWithoutHeader({
        operator_metadata_type: MetadataTypeEnum.Function,
        function_input: {
          name: detail.name,
          description: detail.description,
          inputs: detail.inputs,
          outputs: detail.outputs,
          code: detail.code,
          script_type: detail.script_type,
        },
        operator_info: {
          is_data_source: detail.operator_info?.is_data_source,
        },
        operator_execute_control: {
          timeout: detail.operator_execute_control?.timeout,
        },
      });

      if (status === 'success') {
        message.success('新建成功');
        setSavedName(detail.name!);
        setDetail(prev => ({
          ...prev,
          inputs: detail.inputs,
          outputs: detail.outputs,
        }));
        successCallback();
        // 新建成功后，路由需要变化成编辑的路由，便于后续刷新页面。这里要保留原先的state，否则会丢失
        setTimeout(() => {
          if (!willGoBackRef.current) {
            navigate(`/ide/operator/${operator_id}/edit`, {
              state: location.state,
            });
          }
        }, 0);
      } else {
        message.error(error?.description || '新建失败');
      }
      finallyCallback();
    },
    [detail, navigate, location.state]
  );

  // 编辑算子
  const editOperator = useCallback(
    async (successCallback: () => void, finallyCallback: () => void) => {
      await postOperatorInfo({
        operator_id: operatorId,
        name: detail.name,
        description: detail.description,
        metadata_type: MetadataTypeEnum.Function,
        function_input: {
          inputs: detail.inputs,
          outputs: detail.outputs,
          code: detail.code,
          script_type: detail.script_type,
        },
        operator_info: {
          is_data_source: detail.operator_info?.is_data_source,
        },
        operator_execute_control: {
          timeout: detail.operator_execute_control?.timeout,
        },
      });

      message.success('编辑成功');
      setSavedName(detail.name!);
      successCallback();
      finallyCallback();
    },
    [detail, operatorId]
  );

  // 保存
  const handleSave = useCallback(async () => {
    if (!detail.code?.trim()) {
      message.info('代码块内容不能为空');
      return;
    }

    const valid = await editingAreaRef.current?.validate?.();
    if (!valid) {
      message.info('请检查元数据');
      return;
    }

    const successCallback = () => {
      hasChangedRef.current = false;
      setHasChanged(false);
    };
    const finallyCallback = () => {
      setSaveLoading(false);
    };

    setSaveLoading(true);

    try {
      switch (operatorType) {
        case OperatorTypeEnum.Tool:
          if (action === ActionEnum.Create) {
            // 新建工具
            await createToolFunction(successCallback, finallyCallback);
          } else {
            // 编辑工具
            await editToolFunction(successCallback, finallyCallback);
          }
          break;
        case OperatorTypeEnum.Operator:
          if (action === ActionEnum.Create) {
            // 新建算子
            await createOperator(successCallback, finallyCallback);
          } else {
            // 编辑算子
            await editOperator(successCallback, finallyCallback);
          }
          break;
      }
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
      finallyCallback();
    }
  }, [createToolFunction, createOperator, editToolFunction, editOperator, operatorType, action]);

  // 返回
  const handleBack = useCallback(() => {
    switch (operatorType) {
      case OperatorTypeEnum.Tool:
        // 返回到工具详情页
        navigate(`/tool-detail?box_id=${toolboxId}&action=edit`);
        break;
      case OperatorTypeEnum.Operator:
        {
          const fromPath = location?.state?.from || '/?activeTab=operator';
          navigate(fromPath);
        }

        break;
    }
  }, [navigate, toolboxId, operatorType, location?.state?.from]);

  const handleNavigation = useCallback(
    (blocker: ReturnType<typeof useBlocker>) => {
      modal.confirm({
        centered: true,
        title: intl.get('global.existTitle'),
        content: intl.get('global.exitContent'),
        okText: intl.get('global.saveClose'),
        onOk: async () => {
          await handleSave();
          if (!hasChangedRef.current) {
            // 保存成功，然后会返回
            willGoBackRef.current = true;
            blocker.proceed!();
          } else {
            // 保存失败
            blocker.reset!();
          }
        },
        cancelText: intl.get('global.abandon'),
        onCancel: () => {
          // 放弃保存，然后会返回
          willGoBackRef.current = true;
          blocker.proceed!();
        },
      });
    },
    [handleSave, modal]
  );

  useNavigationBlocker({
    shouldBlock: hasChanged,
    handleNavigation,
  });

  // 更新控制台输出结果
  const updateStdoutLines = (stdout: string) => {
    // 将现在的时间转成 13:47:09 这种格式的，然后凑成数组 ['13:47:09', stdout]，最后添加到stdoutlines
    const time = new Date().toTimeString().split(' ')[0];
    setStdoutLines(prev => [...prev, [time, stdout]]);
  };

  // 更新信息
  const handleChangeInfo = (value: object) => {
    hasChangedRef.current = true;
    setHasChanged(true);
    setDetail(prev => ({
      ...prev,
      ...value,
    }));
  };

  return (
    <Layout className="dip-position-fill" style={commonStyle}>
      {/** 顶部工具栏 */}
      <Toolbar
        name={savedName}
        operatorType={operatorType}
        onSave={handleSave}
        onBack={handleBack}
        loading={saveLoading}
      />

      <div className="dip-flex dip-flex-1 dip-overflowY-hidden">
        <div className="dip-flex-1">
          <Splitter>
            <Splitter.Panel min={780}>
              <Splitter layout="vertical" onResize={size => setConsolePanelSize(size[1])}>
                <Splitter.Panel min={155}>
                  <EditingArea
                    operatorType={operatorType}
                    value={detail}
                    onChange={handleChangeInfo}
                    ref={editingAreaRef}
                  />
                </Splitter.Panel>

                {panelVisible.consolePanel && (
                  <Splitter.Panel min={56} size={consolePanelSize}>
                    <ConsolePanel
                      stdoutLines={stdoutLines}
                      onClose={() => setPanelVisible(prev => ({ ...prev, consolePanel: false }))}
                      onClearStdout={() => setStdoutLines([])}
                    />
                  </Splitter.Panel>
                )}
              </Splitter>
            </Splitter.Panel>

            {panelVisible.debugPanel && (
              <Splitter.Panel min={300} defaultSize={400} className="dip-h-100">
                <DebugPanel
                  onClose={() => setPanelVisible(prev => ({ ...prev, debugPanel: false }))}
                  code={detail.code || ''}
                  onUpdateStdoutLines={updateStdoutLines}
                />
              </Splitter.Panel>
            )}
          </Splitter>
        </div>

        {/** 侧边栏，控制测试、控制台面板的显示/隐藏 */}
        <ControlSidebar
          panelVisible={panelVisible}
          changePanelVisible={visible => setPanelVisible(prev => ({ ...prev, ...visible }))}
        />
      </div>
      {contextHolder}
    </Layout>
  );
};

export default IDEWorkspace;
