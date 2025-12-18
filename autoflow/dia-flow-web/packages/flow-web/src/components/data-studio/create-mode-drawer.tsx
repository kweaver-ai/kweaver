import React, { useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Drawer, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import drawerStyles from './styles/data-studio-drawer.module.less';
import SelectCreateMode from './create-mode-step/select-create-mode';
import { CreateFromTemplate } from './create-mode-step/create-from-template';
import { hasCompleted, ITemplateFlowsRef, TemplateFlows } from './create-mode-step/template-flows';
import { CreateType, IWorkflow, Template, Templates } from './create-mode-step/template-flows-data';
import { Trigger, TriggerConfig } from './trigger-config';
import { FlowDetail, TriggerType } from './types';
import { isFunction, omit } from 'lodash';
import CreateModal from './create-modal';
import { API, MicroAppContext, useTranslate } from '@applet/common';
import { IAtlasInfo, SelectAtlas } from './create-mode-step/select-atlas';
import clsx from 'clsx';
import styles from './create-mode-drawer.module.less';

export enum CreateMode {
    Template = 'template',
    Blank = 'blank',
}

interface ICreateModeDrawerProps {
    onClose: () => void;
    onSelectMode: (mode: CreateMode) => void;
    onSubmit: () => void;
}

enum Step {
    SelectMode = 0,
    CreateFromTemplate = 1,
    SelectAtlas = 2,
    UpdateAtlas = 3,
    TriggerConfig = 4,
}

const reducer = (state: any, action: { type: string, payload: any }) => {
    const { type, payload } = action

    switch (type) {
        case 'init':
            return Templates[payload as CreateType]

        case 'workflows':
            return {
                ...state,
                workflows: isFunction(payload) ? payload(state.workflows) : payload
            }

        default:
            return state
    }
}

const CreateModeDrawer: React.FC<ICreateModeDrawerProps> = ({
    onClose,
    onSelectMode,
    onSubmit,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isRenameVisible, setIsRenameVisible] = useState(false);

    const [atlasInfo, setAtlasInfo] = useState<IAtlasInfo>();

    const { prefixUrl } = useContext(MicroAppContext);
    const templateFlowsRef = useRef<ITemplateFlowsRef>(null);

    const [createType, setCreateType] = useState<any>(CreateType.UpdateAtlas)
    const [state, dispatch] = useReducer<React.Reducer<Template, { type: string, payload: any }>>(reducer, Templates[CreateType.UpdateAtlas])

    const { thirdTitle, fourthTitle, fourthDesc, workflows, complete, selectTypes } = state

    const setWorkflows = (workflows: IWorkflow[] | ((value: IWorkflow[]) => IWorkflow[])) => dispatch({ type: "workflows", payload: workflows })

    const t = useTranslate();

    const currentRecord: { val: IWorkflow | null } = useMemo(() => {
        return { val: null };
    }, []);

    useEffect(() => {
        setAtlasInfo(undefined)
        dispatch({ type: 'init', payload: createType })

    }, [createType])

    const handleEdit = (record: IWorkflow) => {
        currentRecord.val = record;
        setCurrentStep(Step.TriggerConfig);
    };

    const handleSubmit = async (value: IWorkflow[]) => {
        const allComplete = value.every(flow => hasCompleted(flow));
        if (!allComplete) {
            message.info(t('create.templateFlows.incomplete', '带“※”的工作流缺少配置，请完善工作流配置'));
            return;
        }

        const newValues = value.map(flow => {
            const { trigger, id, ...rest } = flow;

            const restValue = JSON.parse(JSON.stringify(rest))

            if (trigger === TriggerType.CRON) {
                if (restValue.trigger_config?.dataSource?.parameters) {
                    restValue.trigger_config.dataSource.parameters = omit(restValue.trigger_config.dataSource.parameters, ['docs']);
                }
            }

            if (trigger === TriggerType.EVENT) {
                if (restValue.trigger_config?.parameters) {
                    restValue.trigger_config.parameters = omit(restValue.trigger_config.parameters, ['docs', 'depth']);
                }
            }

            return restValue;
        });

        try {
            const results = await Promise.allSettled(
                newValues.map(flow =>
                    API.axios.post(`${prefixUrl}/api/automation/v1/data-flow/flow`, flow)
                )
            );

            const failures = results.filter(
                (result): result is PromiseRejectedResult => result.status === 'rejected'
            );

            if (failures.length > 0) {
                const duplicatedNames = failures
                    .filter(failure => failure.reason?.response?.data?.code === 'ContentAutomation.DuplicatedName')
                    .map(failure => failure.reason?.response?.data?.detail.title);

                const failedFlows = failures.map(failure => failure.reason?.response?.data?.detail.title)
                setWorkflows((prev) => prev.filter(flow => failedFlows.includes(flow.title)));
                if (duplicatedNames.length > 0) {
                    templateFlowsRef.current?.showErrorTips(t('workflow.error.duplicatedName', `${duplicatedNames.length}个工作流新建失败，请修改流程名称后重试`, { count: duplicatedNames.length }))
                    return;
                } else {
                    message.error(t('create.failed', '创建失败'));
                    return;
                }
            } else {
                message.success(t('create.success', '创建成功'));
                onSubmit();
            }
        } catch (error) {
            message.error(t('error.serviceError', '服务异常，请您稍后再试'));
        }
    };

    const onCornTriggerSubmit = (value: Trigger) => {
        setWorkflows(
            workflows.map(flow => flow.title === currentRecord.val?.title
                ? { ...flow, trigger_config: value }
                : flow)
        );
        setCurrentStep(Step.UpdateAtlas);
    };

    const handleRename = (record: IWorkflow) => {
        setIsRenameVisible(true);
        currentRecord.val = record;
    };

    const saveRename = (value?: string) => {
        setIsRenameVisible(false);
        setWorkflows(
            workflows.map(flow => flow.title === currentRecord.val?.title
                ? { ...flow, title: value || flow.title }
                : flow)
        );
    };

    const handleSelectAltasNext = (value: IAtlasInfo) => {
        setAtlasInfo(value);
        setWorkflows(complete(workflows, value))

        setCurrentStep(Step.UpdateAtlas);
    };

    const step = [
        {
            title: t('datastudio.create.selectMode', '新建方式'),
            content: <SelectCreateMode onSelectMode={onSelectMode} onNext={() => setCurrentStep(Step.CreateFromTemplate)} />,
        }, {
            title: t('datastudio.create.fromTemplate', '从模板新建'),
            content: <CreateFromTemplate onNext={(type: CreateType) => { setCreateType(type); setCurrentStep(Step.SelectAtlas) }} />,
        }, {
            title: t(thirdTitle),
            content: (
                <SelectAtlas
                    onNext={handleSelectAltasNext}
                    onPrev={() => setCurrentStep(Step.CreateFromTemplate)}
                    onClose={onClose}
                    atlasInfo={atlasInfo}
                    selectTypes={selectTypes}
                />
            ),
        }, {
            title: t('datastudio.create.template', '模板-') + t(fourthTitle),
            content: (
                <TemplateFlows
                    desc={t(fourthDesc)}
                    workflows={workflows}
                    onChangeWorkflows={setWorkflows}
                    onNext={handleEdit}
                    onPrev={() => setCurrentStep(Step.SelectAtlas)}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    onRename={handleRename}
                    ref={templateFlowsRef}
                />
            ),
        }, {
            title: `${t("datastudio.create.triggerUpdate", "触发更新方式")}-${currentRecord.val?.title}`,
            content: (
                <TriggerConfig
                    flowDetail={(currentRecord.val as FlowDetail)}
                    onFinish={onCornTriggerSubmit}
                    onCancel={() => {
                        onClose();
                    }}
                    isTemplCreate={true}
                    onBack={() => setCurrentStep(Step.UpdateAtlas)}
                />
            ),
        }
    ]

    return (
        <Drawer
            title={<div className={drawerStyles['drawer-title']}>{step[currentStep].title}</div>}
            placement="right"
            onClose={onClose}
            open={true}
            width={528}
            headerStyle={{ borderBottom: 'none', padding: '24px 32px' }}
            closeIcon={<CloseOutlined className={drawerStyles['drawer-close-icon']} />}
            className={clsx(drawerStyles['data-studio-drawer'], styles['create-mode-drawer'])}
        >
            {step[currentStep].content}
            {isRenameVisible && (
                <CreateModal
                    isTemplateCreate={true}
                    value={(currentRecord.val as FlowDetail)}
                    onClose={() => {
                        setIsRenameVisible(false);
                    }}
                    onSave={saveRename}
                />
            )}
        </Drawer>
    );
};

export default CreateModeDrawer;
