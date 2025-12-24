import { Button, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { IWorkflow } from './template-flows-data';
import { useTranslate } from '@applet/common';
import styles from './create-mode-step.module.less';
import rename from '../../../assets/rename.svg';
import trigger from '../../../assets/trigger.svg';
import trash from '../../../assets/trash.svg';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { TriggerType } from '../types';
import { triggerIcons } from '../data-studio-panel';
import clsx from 'clsx';
import { ForwardedRef } from 'react';

interface ITemplateFlowsProps {
    desc: string
    workflows: IWorkflow[];
    onChangeWorkflows: (value: IWorkflow[]) => void;
    onNext: (value: IWorkflow) => void;
    onPrev: () => void;
    onClose: () => void;
    onSubmit: (value: IWorkflow[]) => void;
    onRename: (value: IWorkflow) => void;
}

export const hasEdit = (operator: string) => {
    const filterOperators = [
        '@anyshare-trigger/create-user',
        '@anyshare-trigger/change-user',
        '@anyshare-trigger/delete-user',
        '@anyshare-trigger/create-dept',
        '@anyshare-trigger/move-dept',
        '@anyshare-trigger/delete-dept',
        '@anyshare-trigger/create-tag-tree',
        '@anyshare-trigger/add-tag-tree',
        '@anyshare-trigger/edit-tag-tree',
        '@anyshare-trigger/delete-tag-tree',
        '@anyshare-trigger/user-update-dept',
    ];
    return !filterOperators.includes(operator);
};

export const hasCompleted = (record: IWorkflow) => {
    if (hasEdit(record.trigger_config.operator)) {
        const dataSourceOperator = (record.steps && record.steps[0]?.operator) || ''
        // 数据源为非结构类型（文件）时才可选择【适用范围】
        const isFile = dataSourceOperator === '@trigger/dataflow-doc'
        if (isFile) {
            return record.trigger === TriggerType.EVENT ? record.trigger_config.parameters : record.trigger_config.dataSource?.parameters;
        }
        return record.trigger_config.cron;
    }
    return true;
};

const { Text } = Typography;

export interface ITemplateFlowsRef {
    showErrorTips: (tips: string) => void;
}

export const TemplateFlows = forwardRef(({ desc, workflows, onChangeWorkflows, onNext, onPrev, onClose, onSubmit, onRename }: ITemplateFlowsProps, ref: ForwardedRef<ITemplateFlowsRef>) => {
    const t = useTranslate();
    const [showTips, setShowTips] = useState(false);
    const [tips, setTips] = useState('');

    const handleDelete = (title: string) => {
        if (workflows.length === 1) {
            setShowTips(true);
            setTips(t('datastudio.create.templateFlows.tips.atLeastOne', '请至少保留一条流程'));
            return;
        }
        onChangeWorkflows(workflows.filter(flow => flow.title !== title));
    };

    const handleSubmit = () => {
        setShowTips(false);
        setTips('');
        onSubmit(workflows);
    };

    const handleErrorTips = (tips: string) => {
        setShowTips(true);
        setTips(tips);
    }

    useImperativeHandle(ref, () => ({
        showErrorTips: handleErrorTips,
    }));

    const columns: ColumnsType<IWorkflow> = [
        {
            title: t('datastudio.create.templateFlows.title', '工作流'),
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: IWorkflow) => (
                <span>
                    {!hasCompleted(record) && <span className={styles["required-mark"]}>*</span>}
                    <img src={triggerIcons[record.trigger || TriggerType.EVENT]} alt="触发方式" className={styles['flow-trigger-icon']} />
                    {text}
                </span>
            ),
        },
        {
            title: t('datastudio.create.templateFlows.action', '操作'),
            key: 'action',
            width: 130,
            render: (_, record: IWorkflow) => (
                <div className="actions">
                    {hasEdit(record.trigger_config.operator) && (
                        <Button
                            type="link"
                            icon={
                                <img src={trigger} alt="触发方式" className={styles['template-flows-icon']} />
                            }
                            className={styles['flows-action-button']}
                            title={t("create.templateFlows.updateTrigger", "更新触发方式")}
                            onClick={() => onNext(record)}
                        />
                    )}

                    <Button
                        type="link"
                        icon={<img src={rename} alt="重命名" className={styles['template-flows-icon']} />}
                        title={t("datastudio.edit.rename", "重命名")}
                        className={styles['flows-action-button']}
                        onClick={() => onRename(record)}
                    />
                    <Button
                        type="link"
                        icon={<img src={trash} alt="删除" className={styles['template-flows-icon']} />}
                        title={t("datastudio.button.delete", "删除")}
                        className={styles['flows-action-button']}
                        onClick={() => handleDelete(record.title)}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className={styles['template-flows']}>
            <Text className={clsx(styles['create-mode-title'], styles['template-flows-title'])}>
                {desc}<br />
                {t("datastudio.create.templateFlows.tips", "（若不需要的流程也可直接删除）")}
            </Text>
            <Table
                columns={columns}
                dataSource={workflows}
                pagination={false}
                rowKey="title"
                scroll={{ y: 'calc(100vh - 300px)' }}
                className={styles['template-flows-table']}
            />
            {showTips && (
                <div className={styles['tips']}>
                    <Text className={styles['tips-text']}>{tips}</Text>
                </div>
            )}
            <div className={styles['footer-buttons']}>
                <Button onClick={onPrev}>{t("back", "返回")}</Button>
                <Space>
                    <Button type="primary" className="automate-oem-primary-btn" onClick={handleSubmit}>
                        {t("ok", "确定")}
                    </Button>
                    <Button onClick={onClose}>
                        {t("cancel", "取消")}
                    </Button>
                </Space>
            </div>
        </div>
    );
});
