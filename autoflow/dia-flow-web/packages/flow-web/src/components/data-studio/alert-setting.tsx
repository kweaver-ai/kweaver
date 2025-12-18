import { Drawer, Form, Button, Select, InputNumber, Space, Tag } from "antd";
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useTranslate, MicroAppContext, API } from "@applet/common";
import drawerStyles from './styles/data-studio-drawer.module.less';
import styles from './alert-setting.module.less';
import { IUser } from "./types";
import debounce from 'lodash/debounce';
import { CloseOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { FormItem } from "../editor/form-item";


interface IAlertSettingProps {
    onClose: () => void;
}

interface IProcess {
    id: string;
    title: string;
    // ... 其他字段
}

export interface IAlertUser {
    id: string;
    name: string;
    type: string;
}

export interface IAlertDag {
    id: string;
    name: string;
}

export interface IAlertRule {
    rule_id: string;
    alert_users: IAlertUser[];
    dags: IAlertDag[];
    frequency: number;
    threshold: number;
}

interface IProcessOption {
    value: string;
    label: string;
}

const getUserType = (type: number | string) => {
    if (typeof type === 'number') {
        return type === 1 ? 'group' : 'user';
    }
    return type;
}

const AlertSetting = ({ onClose }: IAlertSettingProps) => {
    const [form] = Form.useForm();
    const [originalDags, setOriginalDags] = useState<IProcess[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedProcesses, setSelectedProcesses] = useState<IProcessOption[]>([]);
    const [alertId, setAlertId] = useState<string>();

    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const t = useTranslate();

    const handleClose = () => {
        onClose();
    };

    const handleConfirm = (data: IUser[]) => {
        setSelectedUsers(data);
        form.setFieldValue('receivers', data.map(user => user.id));
        handleCancel();
    };

    const handleCancel = () => {
        microWidgetProps?.unmountComponent(document.getElementById('org'));
    };

    const handleSelectUser = () => {
        microWidgetProps?.mountComponent({
            component: microWidgetProps?.components?.OrgAndGroupPicker,
            props: {
                nodeType: [2], // 选择用户
                isSingleChoice: false,
                isMult: false,
                tabType: ['org', 'group'],
                onRequestConfirm: handleConfirm,
                onRequestCancel: handleCancel,
                defaultSelections: selectedUsers,
                title: t('add', '添加'),
            },
            element: document.getElementById('org'),
        })
    };

    const handleSubmit = async () => {
        form.validateFields().then(async (values) => {
            const params = {
                alert_users: selectedUsers.map(user => ({
                    id: user.id,
                    type: getUserType(user.type)
                })),
                dag_ids: selectedProcesses.map(process => process.value),
                frequency: values.frequency,
                threshold: values.threshold,
            };

            try {
                if (alertId) {
                    await API.automation.updateAlert(alertId, params);
                } else {
                    await API.automation.createAlert(params);
                }
                onClose();
            } catch (error) {
                console.error('Failed to save alert:', error);
            }
        });
    };

    // 使用 useMemo 缓存处理后的数据
    const processes = useMemo(() => {
        return originalDags.map(item => ({
            value: item.id,
            label: item.title
        }));
    }, [originalDags]);

    // 获取流程列表
    const fetchProcesses = async (search: string, { isMore = false }) => {
        try {
            setLoading(true);
            const currentPage = isMore ? page + 1 : 0;

            const data = await API.axios.get(`${prefixUrl}/api/automation/v2/dags`, {
                params: {
                    page: currentPage,
                    limit: 50,
                    type: "data-flow",
                    title: search,
                },
            });

            // 只需要更新原始数据，processes 会自动通过 useMemo 更新
            setOriginalDags(prev => isMore ? [...prev, ...data?.data?.dags] : data?.data?.dags);
            setPage(currentPage);
            setHasMore(data?.data?.total > data?.data?.limit * (data?.data?.page + 1));
        } catch (error) {
            console.error('Failed to fetch processes:', error);
        } finally {
            setLoading(false);
        }
    };

    // 防抖处理搜索
    const debouncedFetch = useCallback(
        debounce((search: string) => {
            fetchProcesses(search, { isMore: false });
        }, 300),
        []
    );

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchValue(value);
        debouncedFetch(value);
    };

    // 处理滚动加载
    const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (
            !loading &&
            hasMore &&
            target.scrollTop + target.offsetHeight === target.scrollHeight
        ) {
            fetchProcesses(searchValue, { isMore: true });
        }
    };

    const handleChangeProcess = (value: IProcessOption[]) => {
        setSelectedProcesses(value);
    };

    useEffect(() => {
        // 初始加载
        fetchProcesses('', { isMore: false });
    }, []);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data }: { data: { rules: IAlertRule[] } } = await API.automation.getAlerts();
                if (data?.rules.length > 0) {
                    const firstAlert = data.rules[0];
                    // Set form values
                    form.setFieldsValue({
                        frequency: firstAlert.frequency,
                        threshold: firstAlert.threshold,
                        receivers: firstAlert.alert_users.map(user => user.id),
                        processes: firstAlert.dags.filter(dag => dag.name).map(dag => ({
                            value: dag.id,
                            label: dag.name
                        }))
                    });

                    // Update component state
                    setSelectedUsers(firstAlert.alert_users.map(user => ({
                        id: user.id,
                        type: user.type === 'user' ? 2 : 1,
                        name: user.name
                    })));
                    setSelectedProcesses(firstAlert.dags.map(dag => ({
                        value: dag.id,
                        label: dag.name
                    })));
                    setAlertId(firstAlert.rule_id);
                }
            } catch (error) {
                console.error('Failed to fetch alerts:', error);
            }
        };

        fetchAlerts();
    }, []);

    return (
        <Drawer
            title={<div className={drawerStyles['drawer-title']}>{t('alert.setting', '告警设置')}</div>}
            placement="right"
            onClose={handleClose}
            open={true}
            width={528}
            zIndex={49}
            closeIcon={<CloseOutlined className={drawerStyles['drawer-close-icon']} />}
            className={clsx(drawerStyles['data-studio-drawer'], styles['alert-setting'])}
            headerStyle={{ borderBottom: 'none', padding: '24px 32px' }}
            bodyStyle={{ padding: '0 32px' }}
            footerStyle={{ borderTop: 'none', padding: '24px 32px' }}
            footer={
                <Space className={styles['alert-setting-footer']}>
                    <Button type="primary" onClick={handleSubmit}>{t('ok', '确定')}</Button>
                    <Button onClick={handleClose}>{t('cancel', '取消')}</Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <p className={styles['drawer-tips']}>{t('alert.setting.tips', '流程运行异常时将主动发送告警邮件')}</p>

                <FormItem
                    label={t('receivers', '接收人')}
                    name="receivers"
                    className={styles['receivers-select-item']}
                    rules={[{ required: true, message: t('receivers.placeholder', '请选择接收人') }]}
                >
                    <Select
                        style={{ width: 'calc(100% - 58px)' }}
                        mode="multiple"
                        open={false}
                        value={selectedUsers.map(user => user.id)}
                        placeholder={t('receivers.placeholder', '请选择接收人')}
                        tagRender={({ value }) => {
                            const user = selectedUsers.find(u => u.id === value);
                            return (
                                <Tag
                                    closable
                                    onClose={() => {
                                        const newUsers = selectedUsers.filter(u => u.id !== value);
                                        setSelectedUsers(newUsers);
                                        form.setFieldValue('receivers', newUsers.map(u => u.id));
                                    }}
                                >
                                    <span title={user?.name}>{user?.name}</span>
                                </Tag>
                            );
                        }}
                    />
                    <Button className={styles['select-button']} onClick={handleSelectUser}>{t('select', '选择')}</Button>
                </FormItem>

                <FormItem
                    label={t('alert.setting.processes', '需要告警的流程')}
                    name="processes"
                    rules={[{ required: true, message: t('alert.setting.processes.placeholder', '请选择流程') }]}
                >
                    <Select
                        mode="multiple"
                        options={processes}
                        placeholder={t('alert.setting.processes.placeholder', '请选择流程')}
                        filterOption={false}
                        showSearch
                        onChange={handleChangeProcess}
                        onSearch={handleSearch}
                        onPopupScroll={handlePopupScroll}
                        loading={loading}
                        allowClear
                        labelInValue
                    />
                </FormItem>

                <FormItem label={t('alert.setting.rules', '告警规则')} required>
                    <Space style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} align="baseline">
                        <span>{t('alert.setting.rules.frequency', '当')}</span>
                        <Form.Item name="frequency" noStyle rules={[{ required: true }]} initialValue={0.5}>
                            <InputNumber
                                min={0.1}
                                max={1000}
                                precision={1}
                                step={0.1}
                                keyboard={false}
                            />
                        </Form.Item>
                        <span>{t('alert.setting.rules.threshold', '小时内，运行失败次数超过')}</span>
                        <Form.Item name="threshold" noStyle rules={[{ required: true }]} initialValue={500}>
                            <InputNumber
                                min={1}
                                max={100000}
                                precision={0}
                                keyboard={false}
                            />
                        </Form.Item>
                        <span>{t('alert.setting.rules.send', '次时，发送告警邮件')}</span>
                    </Space>
                </FormItem>
            </Form>
            <div id='org'></div>
        </Drawer>
    );
};

export default AlertSetting;
