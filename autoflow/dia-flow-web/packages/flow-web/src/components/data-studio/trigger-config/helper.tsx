import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useLayoutEffect } from "react"
import { FormItem } from "../../editor/form-item";
import { Form, Select, SelectProps } from "antd";
import CronTriggerSVG from "../../../extensions/cron/assets/trigger-clock.svg";
import ManualTriggerSVG from "../../../extensions/internal/assets/trigger-manual.svg";
import EventTriggerSVG from "../../../assets/trigger-event.svg";
import CronExtensions, { CronCustomAction } from '../../../extensions/cron'
import { Extension } from "../../extension";
import { SelectDocLib } from "./select-doclib";
import { TranslateFn, useTranslate } from "@applet/common";
import { DefaultOptionType } from "antd/lib/select";

interface Validatable {
    validate?(): boolean | Promise<boolean>;
}


export function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => {
        return {
            validate() {
                return form.validateFields().then(
                    () => true,
                    () => false
                );
            },
        };
    });

    useLayoutEffect(() => {
        form.setFieldsValue(parameters);
    }, [form, parameters]);

    return form;
}


export enum TriggerType {
    Cron = 'Cron',
    Event = 'Event',
    Manual = 'Manual'
}


const formattedCron = (extension: Extension): { getOptions: (t: TranslateFn) => SelectProps['options'], actions: Record<string, any> } => {
    const actions: Record<string, any> = {};
    const options: SelectProps['options'] = []

    extension?.triggers?.forEach((trigger) =>
        trigger.actions.forEach((action) => {
            options.push({ value: action.operator, label: `datastudio.trigger.${action.name}` })
            actions[action.operator] = { ...action, trigger: TriggerType.Cron };
        })
    );

    // 自定义触发
    options.push({ value: CronCustomAction.operator, label: `datastudio.trigger.${CronCustomAction.name}` })
    actions['@trigger/cron/custom'] = { ...CronCustomAction, trigger: TriggerType.Cron }

    return {
        getOptions: (t: TranslateFn) => options.map((option) => ({ ...option, label: t(option.label as string) })),
        actions
    }
}


const formattedEvent = (): { getOptions: (select: string, t: TranslateFn) => SelectProps['options'], actions: Record<string, any> } => {
    const actions: Record<string, any> = {};
    const options = [
        {
            key: '@trigger/dataflow-doc',  // 文件
            options: [
                {
                    label: 'datastudio.trigger.event.addFile',  // 当新增文件版本时（包括新建/上传/编辑/还原/复制文件操作）
                    value: '@anyshare-trigger/file-version-update'
                },
                {
                    label: 'datastudio.trigger.event.updateFile',   // 当修改文件路径时（包括重命名/移动文件操作）
                    value: '@anyshare-trigger/file-path-update'
                },
                {
                    label: 'datastudio.trigger.event.delFile',  // 当删除文件时
                    value: '@anyshare-trigger/file-version-delete'
                },
            ]
        },
        {
            key: '@trigger/dataflow-user',  // 用户
            options: [
                {
                    label: 'datastudio.trigger.event.createUser',  // 创建用户
                    value: '@anyshare-trigger/create-user'
                },
                {
                    label: 'datastudio.trigger.event.updateUser',  // 用户信息更新
                    value: '@anyshare-trigger/change-user'
                },
                {
                    label: 'datastudio.trigger.event.deleteUser',  // 删除用户
                    value: '@anyshare-trigger/delete-user'
                },
            ]
        },
        {
            key: '@trigger/dataflow-dept',
            options: [
                {
                    label: 'datastudio.trigger.event.createDept',
                    value: '@anyshare-trigger/create-dept'
                },
                {
                    label: 'datastudio.trigger.event.moveDept',
                    value: '@anyshare-trigger/move-dept'
                },
                {
                    label: 'datastudio.trigger.event.deleteDept',
                    value: '@anyshare-trigger/delete-dept'
                },
                {
                    label: 'datastudio.trigger.event.updateUserDeptInfo',
                    value: '@anyshare-trigger/user-update-dept'
                },
            ],
        },
        {
            key: '@trigger/dataflow-tag',  // 标签事件组
            options: [
                {
                    label: 'datastudio.trigger.event.addTagTree',  // 创建标签树
                    value: '@anyshare-trigger/create-tag-tree'
                },
                {
                    label: 'datastudio.trigger.event.addTag',  // 在标签树中添加标签
                    value: '@anyshare-trigger/add-tag-tree'
                },
                {
                    label: 'datastudio.trigger.event.updateTag',  // 修改标签树中的标签
                    value: '@anyshare-trigger/edit-tag-tree'
                },
                {
                    label: 'datastudio.trigger.event.delTag',  // 删除标签树中的标签
                    value: '@anyshare-trigger/delete-tag-tree'
                },
            ],
        }
    ]

    options.forEach((group) => {
        if (group?.options) {
            group?.options.forEach((item) => {
                let config: Record<string, any> = {
                    trigger: TriggerType.Event,
                    components: {}
                }

                if (group.key === '@trigger/dataflow-doc') {
                    config['allowDataSource'] = true
                }

                actions[item.value] = { ...item, ...config };
            })
        }
    })

    return {
        actions,
        getOptions: (select: string, t: TranslateFn) => {
            return options.reduce((prev, cur) => {
                const { key, options } = cur

                if (key === select) {
                    return [
                        ...prev,
                        ...options.map((option) => ({
                            label: t(option.label),
                            value: option.value
                        }))
                    ]
                }

                return prev
            }, [] as DefaultOptionType[])
        }
    }
}

const formattedManual = (): { options: SelectProps['options'], actions: Record<string, any> } => {
    const actions: Record<string, any> = {};
    const options = []

    options.push({ label: '@trigger/manual', value: '@trigger/manual' })

    // 手动点击触发
    actions['@trigger/manual'] = {
        operator: '@trigger/manual',
        trigger: TriggerType.Manual,
        components: {},
        allowDataSource: true
    }

    return { actions, options }
}

export const { getOptions: getCronOptions, actions: CronActions } = formattedCron(CronExtensions)
export const { getOptions: getEventOptions, actions: EventActions } = formattedEvent()
export const { actions: ManualActions, options: ManualOptions } = formattedManual()

const Cron = {
    name: TriggerType.Cron,
    description: 'CronDescription',
    icon: CronTriggerSVG,
    components: {
        OperatorSelect: forwardRef(({ parameters, onChange }: { parameters: { operator: string }, onChange: (value: { operator: string }) => void }, ref: ForwardedRef<Validatable>) => {
            const form = useConfigForm(parameters, ref);
            const t = useTranslate();

            return (
                <Form
                    form={form}
                    layout={'vertical'}
                    onValuesChange={(changedValues, allValues) => {
                        onChange(allValues)
                    }}
                >
                    <FormItem
                        name={'operator'}
                        required
                        label={t('datastudio.trigger.frequency', '频率')}
                        rules={[{ required: true, message: t("emptyMessage", "此项不允许为空") }]}

                    >
                        <Select
                            placeholder={t("datastudio.trigger.frequency.placeholder", "请选择触发频率")}
                            options={getCronOptions(t)}
                        />

                    </FormItem>
                </Form>

            )
        }),

        DataSource: SelectDocLib
    }
}

const Event = {
    name: TriggerType.Event,
    description: 'EventDescription',
    icon: EventTriggerSVG,
    components: {
        OperatorSelect: forwardRef(({ dataSourceOperator, parameters, onChange }: { dataSourceOperator: string, parameters: { operator: string }, onChange: (value: { operator: string }) => void }, ref: ForwardedRef<Validatable>) => {
            const form = useConfigForm(parameters, ref);
            const t = useTranslate();

            return (
                <Form
                    form={form}
                    layout={'vertical'}
                    onValuesChange={(changedValues, allValues) => {
                        onChange(allValues)
                    }}
                >
                    <FormItem
                        name={'operator'}
                        required
                        label={t("datastudio.trigger.event", "事件")}
                        rules={[{ required: true, message: t("emptyMessage", "此项不允许为空") }]}

                    >
                        <Select
                            placeholder={t("datastudio.trigger.event.placeholder", "请选择触发事件")}
                            options={getEventOptions(dataSourceOperator, t)}
                        />
                    </FormItem>
                </Form>

            )
        }),

        DataSource: SelectDocLib
    }
}

const Manual = {
    name: TriggerType.Manual,
    description: 'ManualDescription',
    icon: ManualTriggerSVG,
    defaultOperator: '@trigger/manual',
    components: {
        OperatorSelect: ({ parameters, onChange }: { parameters: { operator: string }, onChange: (value: { operator: string }) => void }) => {
            useEffect(() => {
                onChange({ operator: String(ManualOptions?.[0]?.value) })
            }, [])

            return <div></div>
        },
        DataSource: SelectDocLib
    }
}

export { Cron, Event, Manual }

